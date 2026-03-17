import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve repo root from script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

// Agent configurations with Claude-specific frontmatter
const agents = [
  {
    name: 'notion-agent-hive',
    frontmatter: `---
name: notion-agent-hive
description: Coordinator agent and entry point for the Notion Agent Hive system. Owns the Notion board, dispatches thinker/executor/reviewer subagents, and manages all board state transitions. Use when the user wants to plan, break down, or execute features via a Notion board.
tools: Bash, Read, Glob, Grep, Agent(notion-thinker), Agent(notion-executor), Agent(notion-reviewer), AskUserQuestion, TodoWrite
disallowedTools: Write, Edit, WebFetch
model: sonnet
mcpServers:
  - notion
---`,
  },
  {
    name: 'notion-thinker',
    frontmatter: `---
name: notion-thinker
description: Deep research and investigation subagent. Interrogates users, explores codebases, and returns structured reports (plans, investigations, task refinements) to the coordinator. Read-only board access.
tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, TodoWrite
disallowedTools: WebFetch
model: opus
mcpServers:
  - notion
---`,
  },
  {
    name: 'notion-executor',
    frontmatter: `---
name: notion-executor
description: Execution-focused subagent for implementing Notion board tasks. Writes findings on tickets, reports verdict to coordinator.
tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
disallowedTools: WebFetch
model: sonnet
mcpServers:
  - notion
---`,
  },
  {
    name: 'notion-reviewer',
    frontmatter: `---
name: notion-reviewer
description: QA reviewer subagent that verifies implementations and writes findings on tickets. Reports verdict to coordinator.
tools: Bash, Read, Glob, Grep, TodoWrite
disallowedTools: Write, Edit, WebFetch
model: opus
mcpServers:
  - notion
---`,
  },
];

// Substitution map for Claude platform
const substitutions: Record<string, string> = {
  '{{ASK_USER_TOOL}}': 'AskUserQuestion',
  '{{TODO_TOOL}}': 'TodoWrite',
  '{{EXPLORE_REF}}': 'built-in `Explore` agent',
  '{{AGENT_TOOL}}': 'Agent tool',
  '{{EXPLORE_AND_SEARCH_REF}}': 'built-in Explore agent (and any available MCP-backed code search tools)',
};

// Regex to detect unresolved placeholders (only {{UPPERCASE_WITH_UNDERSCORES}})
const UNRESOLVED_PLACEHOLDER_REGEX = /\{\{[A-Z_]+\}\}/g;

// Create output directories
const outputDir = resolve(root, '.claude');
const agentsDir = resolve(outputDir, 'agents');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}
if (!existsSync(agentsDir)) {
  mkdirSync(agentsDir, { recursive: true });
}

// Generate each agent file
for (const agent of agents) {
  const templatePath = resolve(root, 'agents', `${agent.name}.md`);

  // Check if template exists
  if (!existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  // Read template
  let body: string;
  try {
    body = readFileSync(templatePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading template file ${templatePath}:`, err);
    process.exit(1);
  }

  // Apply substitutions
  for (const [placeholder, value] of Object.entries(substitutions)) {
    body = body.replaceAll(placeholder, value);
  }

  // Check for unresolved placeholders
  const unresolved = body.match(UNRESOLVED_PLACEHOLDER_REGEX);
  if (unresolved) {
    console.error(
      `Error: Unresolved placeholders in ${agent.name}.md: ${unresolved.join(', ')}`
    );
    process.exit(1);
  }

  // Concatenate frontmatter + blank line + body
  const output = `${agent.frontmatter}\n\n${body}`;

  // Write output file to agents subfolder
  const outputPath = resolve(agentsDir, `${agent.name}.md`);
  try {
    writeFileSync(outputPath, output, 'utf-8');
    console.log(`Generated .claude/agents/${agent.name}.md`);
  } catch (err) {
    console.error(`Error writing output file ${outputPath}:`, err);
    process.exit(1);
  }
}

// Generate INSTALL.md for Claude
const claudeInstallMd = `# Installation Instructions for Claude

This directory contains agent configurations for the Claude Code platform that enable **persistent task memory across LLM sessions**. Install these agents to use a Notion kanban board as durable shared memory—surviving across sessions, agents, and CLI tools—so your task context, decisions, and review checkpoints remain available whenever you resume work.

## Prerequisites

- You must have Claude Code installed and configured
- Your project should have a \`.claude/\` directory at the repository root

## Installation Steps

1. Copy the agent files from \`agents/\` to your project's \`.claude/\` directory:
   \`\`\`bash
   cp .claude/agents/*.md /path/to/your/project/.claude/
   \`\`\`

2. Verify the following files are now present in your project's \`.claude/\` directory:
   - \`notion-agent-hive.md\` - Coordinator agent (entry point) for board management and subagent dispatch
   - \`notion-thinker.md\` - Deep research and investigation subagent (returns reports to coordinator)
   - \`notion-executor.md\` - Subagent for implementing specific tasks
   - \`notion-reviewer.md\` - Subagent for QA review

3. Restart Claude Code or reload your project to pick up the new agents.

## Files Included

| File | Purpose |
|------|---------|
| \`agents/notion-agent-hive.md\` | Coordinator agent (entry point) that owns the board, creates feature pages/tickets, and dispatches subagents |
| \`agents/notion-thinker.md\` | Deep research and investigation subagent. Returns structured reports to the coordinator. Read-only board access. |
| \`agents/notion-executor.md\` | Execution-focused subagent for implementing Notion board tasks |
| \`agents/notion-reviewer.md\` | QA reviewer subagent for verifying implementations |

## Verification

After installation, you can verify the agents are loaded by asking Claude to list available agents or by attempting to invoke the \`notion-agent-hive\` agent.

---
*Generated by scripts/generate-claude-agents.ts*
`;

const installPath = resolve(outputDir, 'INSTALL.md');
try {
  writeFileSync(installPath, claudeInstallMd, 'utf-8');
  console.log('Generated .claude/INSTALL.md');
} catch (err) {
  console.error(`Error writing INSTALL.md file ${installPath}:`, err);
  process.exit(1);
}

console.log('All Claude agent files generated successfully.');
