<p align="center">
  <img src="assets/logo.png" alt="Notion Agent Hive" width="400">
</p>

# notion-agent-hive

**Persistent memory for AI coding sessions using Notion.**

## Why this exists

Like many, I've been using LLMs extensively, in every flavour, and with all sorts of harnesses (Claude code, Codex, Copilot, etc.)

While they can be wildly effective, I found some limitations in my workflow:

**Form factor** CLIs can be a bit clunky to collect one's thoughts. I love to write, edit, revisit, add structure through headers and richer markup ... Command line doesn't feel like the best place for that.

**You lose track of what actually happened.** When working on larger features that take time, you often switch between your agent and other tasks. Coming back later, it's hard to trace what happened and what the agent was working on. You get a "done!" checklist but lose the 200k tokens of reasoning behind it, leaving you wondering what was actually discussed and implemented.

**Sessions die at the worst time.** Especially when Anthropic cuts your plan allowance. The plan and logs live somewhere in some temp folder, you could do some digging, fire opencode, and let it handle the context all over again, but this is a bit awkward and wasteful.

**Limited task horizon.** Models' performance tend to degrade far below their max context size. I found it hard to reliably tackle more ambitious features because of it. Harnesses _may_ compact, or _may_ use subagents, which can help, but feels like a roll of dice. Being diligent, going through plan -> execute loops helps too, but then you're still facing issues 1-3 in this list.

## What this does

This uses Notion as a persistent memory layer and source of truth. Every feature gets:

- A dedicated Notion page with the full plan, decisions, and reasoning
- An inline kanban board with detailed task tickets
- Context that persists across sessions and tools

Under the hood, the tool will synchronise a few specialised subagents:

| Agent           | Role                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Coordinator** | Entry point. Manages the Notion board, creates feature pages and task tickets, dispatches subagents, and handles status transitions.                                                 |
| **Thinker**     | Deep research and investigation. Interrogates users, explores the codebase, decomposes features into tasks. Returns structured reports to the coordinator. Never modifies the board. |
| **Executor**    | Implements code for the specific ticket assigned by the Coordinator. Writes findings/work summaries on that ticket, then reports back; does not route itself to other tasks.         |
| **Reviewer**    | Verifies implementations against acceptance criteria. Gates tasks for human review before they can be marked done.                                                                   |

It's quite flexible. Fire it with a rough idea, either inline or in a Notion page, and it will interactively create a plan. Give it an existing plan in Notion, and it will resume the work. Just like that, you get:

- **A proper space to think.** Notion pages with headers, tables, and structure. Each step becomes a ticket on a board with rich context, not a checklist item in a terminal.
- **A proper space to review.** Leave comments on specific parts of the plan. Add notes. Give feedback where it matters, not in a chat thread that scrolls away.
- **A proper space to supervise.** The board shows you exactly where everything stands at a glance.

Each task runs with a fresh context, so you stay in the sweet spot where models perform best. When you want to review what an agent did, just look at the ticket: the work summary and QA report are right there.

It also saves money. You can assign a strong model for planning, a fast one for coordination, and a cheaper one for execution, since the thinking has already been done.

I'm still toying with different configurations, but had some good results using chatGPT 5.4 mini as the fast coordinator, chatGPT 5.4 (With high effort) or opus 4.6 as the thinker/reviewer, and at this point anything "Not considered SOTA but still good" like KIMI K2.5, GLM-5, or Devstral as the executor, where most of the tokens are spent.

## Installation

### Quick Start

```bash
bunx @tesselate-digital/notion-agent-hive install
```

This command:

1. Adds `@tesselate-digital/notion-agent-hive` to the `plugin` array in `~/.config/opencode/opencode.json`
2. Creates a `~/.config/opencode/notion-agent-hive.json` starter config

### Prerequisites

- [OpenCode](https://opencode.ai) installed
- A Notion workspace with an [integration/API token](https://www.notion.so/my-integrations)
- The [Notion MCP server](https://github.com/makenotion/notion-mcp-server) configured in OpenCode

### Configuring Models

There are two places to configure models, merged at startup:

| Location                                    | Scope                 | Use for                       |
| ------------------------------------------- | --------------------- | ----------------------------- |
| `~/.config/opencode/notion-agent-hive.json` | Global (all projects) | Your personal default models  |
| `notion-agent-hive.json` in project root    | Per-project           | Overrides for a specific repo |

Project config takes precedence. Agent keys are merged individually — setting `thinker` in the project config does not wipe out `executor` from your global config.

Example config:

```json
{
  "agents": {
    "coordinator": { "model": "openai/gpt-5.2" },
    "thinker": { "model": "openai/gpt-5.4", "variant": "xhigh" },
    "executor": { "model": "kimi-for-coding/k2p5" },
    "reviewer": { "model": "openai/gpt-5.4", "variant": "xhigh" }
  }
}
```

Restart OpenCode for changes to take effect.

#### Fallback chains

Define ordered fallback models per agent. If the primary model hits a rate limit mid-session, the plugin automatically switches to the next in the chain:

```json
{
  "agents": {
    "thinker": { "model": "openai/gpt-5.4" }
  },
  "fallback": {
    "enabled": true,
    "chains": {
      "thinker": ["google/gemini-2.5-pro", "anthropic/claude-opus-4"]
    }
  }
}
```

You can also pass the full chain directly as the `model` value — the first entry is used at startup, the rest are fallbacks:

```json
{
  "agents": {
    "thinker": {
      "model": [
        "openai/gpt-5.4",
        "google/gemini-2.5-pro",
        "anthropic/claude-opus-4"
      ]
    }
  }
}
```
