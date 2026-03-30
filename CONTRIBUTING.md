# Contributing to notion-agent-hive

Technical guide for contributors. Assumes familiarity with TypeScript, Bun, and OpenCode plugins.

## Architecture

notion-agent-hive is an **OpenCode plugin** that registers four agents and handles runtime model fallback. It ships as an npm package with a CLI installer.

### How OpenCode plugins work

An OpenCode plugin is a module that exports a default async function:

```typescript
export default async function plugin(ctx: { directory: string }) {
  return {
    name: "plugin-name",
    agents: { "agent-name": agentConfig },
  }
}
```

OpenCode calls this at startup, passing the project directory. The return value registers agents. See `src/index.ts` for the full implementation.

### Project structure

```
src/
├── agents/
│   ├── types.ts          # Core interfaces: AgentDefinition, AgentConfig
│   ├── coordinator.ts    # Orchestration-only agent (no code writes)
│   ├── thinker.ts        # Research + planning agent (Notion writes during PLAN_FEATURE)
│   ├── executor.ts       # Code implementation agent (all tool access)
│   └── reviewer.ts       # QA agent (read-only for source code)
├── cli/
│   ├── index.ts          # CLI entry: parses process.argv, routes to commands
│   └── install.ts        # install(): patches opencode.json, creates starter config
├── config.ts             # loadConfig() + Zod schema + DEFAULT_MODELS
├── fallback.ts           # ForegroundFallbackManager: runtime model switching on rate limits
└── index.ts              # Plugin entry + re-exports all public APIs
```

### Agent prompts

Each agent's system prompt is embedded as a template string in its `.ts` file. There are no external markdown files at runtime — prompts are bundled into `dist/`.

When editing a prompt, edit the `XYZZ_PROMPT` constant in the corresponding `src/agents/xyz.ts` file directly.

### Model configuration

Each agent factory (`createCoordinatorAgent`, etc.) accepts:

- `string` — single model ID, sets `config.model`
- `Array<string | {id, variant}>` — sets `_modelArray` for fallback chain resolution
- `variant` — optional second arg (e.g. `"max"` for extended thinking)

The plugin entry point (`src/index.ts`) reads `notion-agent-hive.json` and passes model config to each factory. At startup, the first model in `_modelArray` is selected. `ForegroundFallbackManager` advances the index when it sees a `rate_limit_exceeded` event.

## Development

### Requirements

- [Bun](https://bun.sh) >= 1.1

### Setup

```bash
bun install
```

### Commands

```bash
bun test           # Run all tests
bun run lint       # Lint with Biome
bun run check      # Lint + format (auto-fix)
bun run build      # Build dist/
```

### Testing

Tests use Bun's built-in test runner. Run specific files:

```bash
bun test tests/config.test.ts
bun test tests/fallback.test.ts
bun test tests/cli-install.test.ts
bun test tests/agents.test.ts
```

Tests follow TDD: each module has a corresponding test file. Agent tests are type-level (verify factory output shape). Config and install tests use temp directories with `beforeEach`/`afterEach` cleanup.

### Building

```bash
bun run build
```

Produces:
- `dist/index.js` — plugin entry point
- `dist/cli/index.js` — CLI binary
- `dist/*.d.ts` — TypeScript declarations (via `tsc --emitDeclarationOnly`)

### Using locally without publishing

OpenCode loads plugins from `node_modules`, so you need to install the local build into a project.

**1. Build the plugin:**
```bash
cd /path/to/notion-agent-hive
bun run build
```

**2. In your target project, install the local package:**
```bash
bun add /path/to/notion-agent-hive
```

This copies the built `dist/` into `node_modules/notion-agent-hive`. Then run the installer:

```bash
bun run notion-agent-hive install
# or
node node_modules/notion-agent-hive/dist/cli/index.js install
```

The installer updates your global OpenCode config in `~/.config/opencode/` (or `$OPENCODE_CONFIG_DIR` / `$XDG_CONFIG_HOME/opencode`) and writes `notion-agent-hive.json` there.

**Re-syncing after edits:** `bun add` copies files at install time. After any source change, rebuild and reinstall:

```bash
# in the plugin repo
bun run build

# in your target project
bun add /path/to/notion-agent-hive
```

Alternatively, use `bun link` for a symlinked workflow that picks up builds without reinstalling:

```bash
# in the plugin repo (once)
bun link

# in your target project (once)
bun link notion-agent-hive
```

Then `bun run build` in the plugin repo is immediately reflected — no reinstall needed.

### Publishing to npm

Publishing makes `bunx notion-agent-hive@latest install` work for everyone.

**1. Make sure the build is clean:**
```bash
bun test && bun run build
```

**2. Log in to npm if needed:**
```bash
npm login
```

**3. Bump the version** in `package.json` (follow semver: patch for fixes, minor for new features):
```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
```

**4. Publish:**
```bash
npm publish
```

The `files` field in `package.json` controls what ships: only `dist/`, `schema.json`, `README.md`, and `LICENSE` are included. Source files and tests are not published.

**Verify the release:**
```bash
bunx notion-agent-hive@latest --help
```

## Making Changes

### Editing an agent prompt

1. Open `src/agents/<name>.ts`
2. Edit the `const <NAME>_PROMPT = \`...\`` template string
3. Run `bun test tests/agents.test.ts` to verify tests still pass
4. Run `bun run build` to verify the build succeeds

### Adding a new agent

1. Create `src/agents/myagent.ts` following the pattern in `coordinator.ts`:
   - Define `MYAGENT_PROMPT` as a template string
   - Export `createMyagentAgent(model?, variant?): AgentDefinition`
2. Add tests in `tests/agents.test.ts`
3. Export from `src/index.ts`
4. Register in the plugin function in `src/index.ts`
5. Add to `DEFAULT_MODELS` in `src/config.ts` and to the Zod schema

### Changing config schema

1. Edit the Zod schema in `src/config.ts`
2. Update `schema.json` to match (used for editor autocomplete)
3. Add/update tests in `tests/config.test.ts`

### Changing the CLI installer

1. Edit `src/cli/install.ts`
2. Tests live in `tests/cli-install.test.ts` — they use temp directories and cover the happy path and edge cases (duplicates, existing configs)

## Key constraints

- **No runtime file reads.** Agent prompts must be embedded in source, not loaded from disk. The `agents/` directory does not exist in the distributed package.
- **No Claude support.** This plugin is OpenCode-only. Do not add Claude Code agent generation.
- **Prompts stay in TypeScript.** The template string approach keeps prompts bundled, type-checkable, and version-controlled alongside the code that uses them.
- **Notion MCP only.** Agent prompts explicitly forbid headless browsers. Do not add Playwright or Chrome automation to any agent.
