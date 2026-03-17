#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve repo root from script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

// Agent configurations with exact OpenCode frontmatter
const agents = [
  {
    name: "notion-agent-hive",
    frontmatter: `---
description: Coordinator agent and entry point for the Notion Agent Hive system. Owns the Notion board, dispatches thinker/executor/reviewer subagents, and manages all board state transitions.
mode: primary
model: openai/gpt-5.4
color: "#2D3436"
temperature: 0.2
tools:
  question: true
  bash: true
  read: true
  write: false
  edit: false
  glob: true
  grep: true
  webfetch: false
  task: true
  todowrite: true
  notion_*: true
  mcp_*: true
permission:
  webfetch: deny
  task:
    "*": "deny"
    "explore": "allow"
    "notion-thinker": "allow"
    "notion-executor": "allow"
    "notion-reviewer": "allow"
---`,
  },
  {
    name: "notion-thinker",
    frontmatter: `---
description: Deep research and investigation subagent. Interrogates users, explores codebases, and returns structured reports (plans, investigations, task refinements) to the coordinator. Read-only board access.
mode: subagent
model: github-copilot/claude-opus-4.6
hidden: true
color: "#6C5CE7"
temperature: 0.2
tools:
  question: true
  bash: true
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  webfetch: false
  task: true
  todowrite: true
  notion_*: true
  mcp_*: true
permission:
  webfetch: deny
  task:
    "*": "deny"
    "explore": "allow"
---`,
  },
  {
    name: "notion-executor",
    frontmatter: `---
description: Execution-focused subagent for implementing Notion board tasks. Writes findings on tickets, reports verdict to coordinator.
mode: subagent
hidden: true
model: github-copilot/claude-sonnet-4.6
color: "#0EA5A4"
temperature: 0.15
tools:
  bash: true
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  webfetch: false
  task: true
  todowrite: true
  notion_*: true
  mcp_*: true
permission:
  webfetch: deny
  task:
    "*": "deny"
    "explore": "allow"
---`,
  },
  {
    name: "notion-reviewer",
    frontmatter: `---
description: QA reviewer subagent that verifies implementations and writes findings on tickets. Reports verdict to coordinator.
mode: subagent
hidden: true
model: github-copilot/claude-opus-4.6
variant: max
color: "#E74C3C"
temperature: 0.1
tools:
  bash: true
  read: true
  glob: true
  grep: true
  write: false
  edit: false
  webfetch: false
  task: false
  todowrite: true
  notion_*: true
  lsp_*: true
  mcp_*: true
permission:
  webfetch: deny
  task:
    "*": "deny"
---`,
  },
];

// OpenCode-specific substitutions
const substitutions: Record<string, string> = {
  "{{ASK_USER_TOOL}}": "question",
  "{{TODO_TOOL}}": "todowrite",
  "{{EXPLORE_REF}}": "`explore` subagent",
  "{{AGENT_TOOL}}": "Task tool",
  "{{EXPLORE_AND_SEARCH_REF}}":
    "`explore` subagent (and any available MCP-backed code search tools)",
};

// Create output directories
const outputDir = resolve(root, ".opencode");
const agentsDir = resolve(outputDir, "agents");
mkdirSync(outputDir, { recursive: true });
mkdirSync(agentsDir, { recursive: true });

// Generate each agent file
for (const agent of agents) {
  const templatePath = resolve(root, "agents", `${agent.name}.md`);

  // Check if template file exists
  if (!existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  // Read template content
  let body = readFileSync(templatePath, "utf-8");

  // Apply substitutions
  for (const [placeholder, replacement] of Object.entries(substitutions)) {
    body = body.replaceAll(placeholder, replacement);
  }

  // Check for unresolved placeholders
  const unresolvedPattern = /\{\{[A-Z_]+\}\}/g;
  const unresolvedMatches = body.match(unresolvedPattern);
  if (unresolvedMatches) {
    const uniqueUnresolved = [...new Set(unresolvedMatches)];
    console.error(
      `Error: Unresolved placeholders in ${agent.name}.md: ${uniqueUnresolved.join(", ")}`,
    );
    process.exit(1);
  }

  // Concatenate frontmatter + body
  const output = `${agent.frontmatter}\n\n${body}`;

  // Write output file to agents subfolder
  const outputPath = resolve(agentsDir, `${agent.name}.md`);
  writeFileSync(outputPath, output, "utf-8");

  console.log(`Generated .opencode/agents/${agent.name}.md`);
}

// Generate INSTALL.md for OpenCode
const opencodeInstallMd = `# Installation Instructions for OpenCode

This directory contains agent configurations for the OpenCode platform that enable **persistent task memory across LLM sessions**. Install these agents to use a Notion kanban board as durable shared memory—surviving across sessions, agents, and CLI tools—so your task context, decisions, and review checkpoints remain available whenever you resume work.

## Prerequisites

- You must have OpenCode installed and configured
- Your project should have an \`.opencode/\` directory at the repository root

## Agent Customization (Important)

Before installing, review the agent definitions. These files include the default agent assignments for each task. Would you like to keep those defaults, or would you prefer to customize them before installation? If the user wants different defaults, edit the markdown files in the \`agents/\` folder before proceeding with installation.

## Installation Steps

1. Copy the agent files from \`agents/\` to your project's \`.opencode/\` directory:
   \`\`\`bash
   cp .opencode/agents/*.md /path/to/your/project/.opencode/
   \`\`\`

2. Verify the following files are now present in your project's \`.opencode/\` directory:
   - \`notion-agent-hive.md\` - Coordinator agent (entry point) for board management and subagent dispatch
   - \`notion-thinker.md\` - Deep research and investigation subagent (returns reports to coordinator)
   - \`notion-executor.md\` - Subagent for implementing specific tasks
   - \`notion-reviewer.md\` - Subagent for QA review

3. Restart OpenCode or reload your project to pick up the new agents.

## Files Included

| File | Purpose |
|------|---------|
| \`agents/notion-agent-hive.md\` | Coordinator agent (entry point) that owns the board, creates feature pages/tickets, and dispatches subagents |
| \`agents/notion-thinker.md\` | Deep research and investigation subagent. Returns structured reports to the coordinator. Read-only board access. |
| \`agents/notion-executor.md\` | Execution-focused subagent for implementing Notion board tasks |
| \`agents/notion-reviewer.md\` | QA reviewer subagent for verifying implementations |

## Verification

After installation, you can verify the agents are loaded by checking OpenCode's agent list or attempting to invoke the \`notion-agent-hive\` agent.

---
*Generated by scripts/generate-opencode-agents.ts*
`;

const installPath = resolve(outputDir, "INSTALL.md");
try {
  writeFileSync(installPath, opencodeInstallMd, "utf-8");
  console.log("Generated .opencode/INSTALL.md");
} catch (err) {
  console.error(`Error writing INSTALL.md file ${installPath}:`, err);
  process.exit(1);
}

console.log("All OpenCode agent files generated successfully.");
