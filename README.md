# notion-agent-hive

**Persistent task memory for developers across LLM sessions and CLI tools.**

A developer workflow that solves the ephemeral context problem: when you return to a project after a break, you shouldn't have to re-explain your intent or re-discover what was in progress. This system uses a Notion kanban board as durable shared memory—surviving across sessions, agents, and CLI tools—so your task context, decisions, and review checkpoints remain available whenever you resume work.

## The Problem

As a developer working with AI coding assistants, you've probably experienced this:

- **Session-local todos disappear** — The todo list you built up in a Claude or OpenCode session is gone when you start fresh
- **Chat context fades quickly** — "Updated readme" in your chat history doesn't explain *why* you made those changes an hour later
- **Cross-CLI handoff is painful** — When your Claude session ends, resuming the same feature in OpenCode requires re-pasting prompts and re-discovering state from the repo
- **Human review lacks durable context** — There's no persistent record of what was planned, what changed, what passed QA, and what still needs a decision

Your task memory shouldn't be trapped inside a single LLM conversation.

## The Solution

This workflow treats a Notion kanban board as **persistent shared memory** for software development tasks:

1. **Persistent Task Memory** — Every feature, task, and decision lives in a durable Notion board outside any single LLM session. Start a new chat in any CLI and your task context is immediately available.

2. **Cross-Agent Collaboration** — Three specialized agents (Thinker, Executor, Reviewer) coordinate through the same board. The Thinker plans and orchestrates; the Executor implements; the Reviewer verifies. All state is shared through Notion.

3. **Cross-Session & Cross-CLI Continuity** — Resume work seamlessly whether you're in Claude Code today, OpenCode tomorrow, or switching between them mid-feature. The board holds the canonical state.

4. **Human-in-the-Loop Review** — Clear checkpoints with acceptance criteria, QA validation, and explicit human review gates. The board preserves the full context needed for code review: what was planned, what changed, and what passed automated checks.

## Agent Overview

### Thinker

Senior product manager agent that plans features using Notion kanban boards as persistent memory. Creates deterministic, implementation-ready task tickets so executors can operate with minimal interpretation. Decomposes work into precise tasks and makes all product and architecture decisions.

### Executor

Implementation-only subagent that modifies code based on task specifications. The sole agent responsible for writing code. Follows the task contract exactly without redesigning intent. Reports structured execution feedback to the Thinker.

### Reviewer

QA subagent that verifies implementations against task specifications, runs tests, and checks acceptance criteria. Strictly read-only with respect to source code. Gates tasks for human review before they can be marked done.

## Repository Structure

```
notion-agent-hive/
├── README.md                    # This file
├── package.json                 # npm scripts and dependencies
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Test runner configuration
│
├── agents/                     # Source-of-truth agent templates (shared bodies)
│   ├── notion-thinker.md
│   ├── notion-executor.md
│   └── notion-reviewer.md
│
├── scripts/                    # Platform-specific frontmatter generators
│   ├── generate-claude-agents.ts
│   └── generate-opencode-agents.ts
│
├── .claude/                    # Generated Claude CLI outputs (committed)
│   ├── INSTALL.md
│   └── agents/
│       ├── notion-thinker.md
│       ├── notion-executor.md
│       └── notion-reviewer.md
│
└── .opencode/                  # Generated OpenCode CLI outputs (committed)
    ├── INSTALL.md
    └── agents/
        ├── notion-thinker.md
        ├── notion-executor.md
        └── notion-reviewer.md
```

## Source-of-Truth Architecture

This repository uses a **generator-based workflow** to maintain agent definitions for multiple CLI platforms:

| Layer | Purpose | Location |
|-------|---------|----------|
| **Shared bodies** | Common agent instructions and behavior | `agents/*.md` |
| **Platform frontmatter** | CLI-specific YAML frontmatter and install logic | `scripts/generate-*.ts` |
| **Generated outputs** | Committed installable artifacts | `.claude/`, `.opencode/` |

The markdown body content (below the YAML frontmatter) is identical between the two formats for each agent. Only the frontmatter differs to match each CLI's configuration format.

## Format Differences

| Field | OpenCode | Claude CLI |
|-------|----------|------------|
| Agent name | `description` field | `name` field |
| Tool declaration | Boolean map (`bash: true`) | Comma-separated string (`tools: Bash, Read, Write`) |
| Tool restrictions | `permission` block with nested allow/deny | `disallowedTools` field |
| Model specification | Full provider path (e.g., `kimi-for-coding/k2p5`) | Alias (e.g., `opus`, `sonnet`) |
| MCP servers | Implicit via `notion_*: true` and `mcp_*: true` patterns | Explicit `mcpServers` list |
| Subagent mode | `mode: subagent`, `hidden: true` | Not specified (inferred from `name` matching `Agent()` reference) |
| Visual/behavior | `color`, `temperature`, `variant` fields | Not supported |

## Installation

For CLI-specific installation instructions, see the generated INSTALL.md files:

- **Claude CLI**: See `.claude/INSTALL.md`
- **OpenCode**: See `.opencode/INSTALL.md`

These files contain authoritative, copy-paste-ready instructions for installing the agents into your respective CLI environment.

## Development Commands

### Generating Agent Files

Regenerate all platform-specific outputs from the shared templates:

```bash
# Generate both Claude and OpenCode outputs
npm run generate

# Generate only Claude outputs
npm run generate:claude

# Generate only OpenCode outputs
npm run generate:opencode
```

### Testing

Run the test suite (if tests exist):

```bash
# Run tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

## MCP Expectations

These agents are designed around specific MCP (Model Context Protocol) assumptions:

| MCP Server | Status | Notes |
|------------|--------|-------|
| **Notion** | Required | All agent workflows depend on Notion for board operations, task management, and persistent memory |
| **OpenCode-specific MCPs** | Optional | OpenCode agents use `mcp_*: true` pattern, exposing broad MCP access where available in the environment |
| **Other MCPs (Claude)** | Intentionally excluded | Claude agents list **only** `notion` in `mcpServers` for portability. Additional MCPs can be added locally if needed |

**Important**: Only Notion is required for core functionality. Do not add other MCP servers as mandatory setup requirements.

## Verification for Maintainers

Before committing changes to generators or templates, run these verification steps:

1. **Regenerate outputs** to ensure committed files are up-to-date:
   ```bash
   npm run generate
   ```

2. **Check for placeholder errors** - the generators will exit with error if any `{{PLACEHOLDER}}` remains unresolved in templates

3. **Verify file contents** - confirm `.claude/` and `.opencode/` contain expected agent files with correct frontmatter

4. **Run tests** (if applicable):
   ```bash
   npm test
   ```

5. **Manual sanity check** - ensure generated agent files are valid markdown with proper YAML frontmatter delimiters (`---`)

## Contributing

When modifying agent behavior:

1. Edit the shared templates in `agents/` for body content changes
2. Edit the generators in `scripts/` for frontmatter or platform-specific changes
3. Run `npm run generate` to update committed outputs
4. Commit both template changes and regenerated outputs together
