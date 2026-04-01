// src/agents/shared.ts
// Shared constants across coordinator, executor, reviewer, and thinker agents

/**
 * Kanban database schema for feature boards.
 * Used by coordinator when creating new boards.
 */
export const KANBAN_SCHEMA = `\`\`\`sql
CREATE TABLE (
  "Task"        TITLE,
  "Status"      SELECT('Backlog':default, 'To Do':blue, 'In Progress':yellow, 'Needs Human Input':red, 'In Test':orange, 'Human Review':purple, 'Done':green),
  "Priority"    SELECT('Critical':red, 'High':orange, 'Medium':yellow, 'Low':green),
  "Depends On"  RICH_TEXT,
  "Complexity"  SELECT('Small':green, 'Medium':yellow, 'Large':red),
  "Notes"       RICH_TEXT
)
\`\`\``;

/**
 * Status transition rules. Coordinator is the sole agent responsible for all transitions.
 */
export const STATUS_TRANSITIONS = `| Transition | Condition |
|---|---|
| Backlog → To Do | Thinker sets during plan creation, or coordinator adjusts |
| To Do → In Progress | When dispatching executor |
| In Progress → In Test | Executor reports \`READY_FOR_TEST\` |
| In Test → Human Review | Reviewer reports \`PASS\` |
| In Test → To Do | Reviewer reports \`FAIL\` |
| Any → Needs Human Input | Ambiguity escalation |
| Human Review → Done | **Human only**, final sign-off |
| Human Review → To Do | Human requests changes |`;

/**
 * Board permissions by agent role.
 * Single source of truth referenced by all agents.
 */
export const BOARD_PERMISSIONS = {
	coordinator: {
		summary: "Full board control. Creates pages, databases, tickets. Handles ALL status transitions.",
		allowed: ["create pages/databases/tickets", "all status transitions", "update ticket properties"],
		forbidden: ["implementing code", "deep research"],
	},
	executor: {
		summary: "Limited board access. Read context, write findings on assigned ticket only.",
		allowed: ["read board/ticket context", "write implementation notes on assigned ticket page"],
		forbidden: ["moving tasks between statuses", "creating/deleting tickets", "scanning board for next task"],
	},
	reviewer: {
		summary: "Read-only for source code. Can move In Test → Human Review on PASS verdict.",
		allowed: ["read board/ticket context", "write QA findings on ticket page"],
		forbidden: ["moving to Done (human only)", "moving to To Do/In Progress", "creating/deleting tickets"],
	},
	thinker: {
		summary: "Read-only Notion access. Returns reports; coordinator handles all writes.",
		allowed: ["read Notion pages for context"],
		forbidden: ["create/update/delete anything in Notion", "move tickets", "dispatch subagents"],
	},
};

/**
 * Generates a thinker dispatch instruction block.
 * Consolidates boilerplate across PLAN_FEATURE, PLAN_FROM_DRAFT, INVESTIGATE, REFINE_TASK.
 */
export function formatThinkerDispatch(
	type: "PLAN_FEATURE" | "PLAN_FROM_DRAFT" | "INVESTIGATE" | "REFINE_TASK",
): string {
	const headers: Record<typeof type, string> = {
		PLAN_FEATURE: "You are being dispatched to research and plan a feature.",
		PLAN_FROM_DRAFT: "You are being dispatched to convert a user's draft into a structured feature plan.",
		INVESTIGATE: "You are being dispatched to investigate an issue.",
		REFINE_TASK: "You are being dispatched to refine a task specification.",
	};

	const contexts: Record<typeof type, string> = {
		PLAN_FEATURE: `BOARD_CONTEXT:
  thinking_board_id: <page ID>
  existing_context: <any relevant board state, or "new board">

USER_REQUEST:
<verbatim user request>`,
		PLAN_FROM_DRAFT: `BOARD_CONTEXT:
  thinking_board_id: <page ID>
  draft_page_id: <same page ID, or child page if draft is nested>

USER_DRAFT_CONTENT:
<full content extracted from the Notion page>

USER_REQUEST:
<any additional instructions from the user, or "Convert this draft into a thinking board">`,
		INVESTIGATE: `BOARD_CONTEXT:
  thinking_board_id: <page ID>
  task_page_id: <page ID of the affected task>

QUESTION:
<specific question or problem to investigate>

CONTEXT:
<execution report, reviewer findings, human comments, or other relevant context>`,
		REFINE_TASK: `BOARD_CONTEXT:
  thinking_board_id: <page ID>
  task_page_id: <page ID of the task to refine>

FEEDBACK:
<execution report, reviewer findings, or human comments>

CURRENT_SPECIFICATION:
<full current task page content>`,
	};

	const instructions: Record<typeof type, string> = {
		PLAN_FEATURE: `Interrogate the user, explore the codebase, decompose into tasks.
Return a PLANNING_REPORT with the complete feature context and task specifications.
Do NOT create anything in Notion - just return the report.`,
		PLAN_FROM_DRAFT: `The user has already done preliminary thinking. Your job is to:
1. Understand their intent, ideas, and any structure they've established
2. Ask clarifying questions if critical details are missing
3. Preserve their terminology and framing where sensible
4. Decompose into concrete, actionable tasks
5. Return a PLANNING_REPORT as usual

Do NOT discard or override the user's ideas. Build on them.
Do NOT create anything in Notion - just return the report.`,
		INVESTIGATE: `Research the issue, explore the codebase, and return an INVESTIGATION_REPORT.
Do NOT modify Notion - just return the report.`,
		REFINE_TASK: `Research the issue and return a REFINEMENT_REPORT with the updated specification.
Do NOT modify Notion - just return the report.`,
	};

	return `\`\`\`
${headers[type]}

DISPATCH_TYPE: ${type}

${contexts[type]}

${instructions[type]}
\`\`\``;
}

/**
 * Board permissions summary for subagent prompts.
 */
export function getBoardPermissionsBlock(role: keyof typeof BOARD_PERMISSIONS): string {
	const perms = BOARD_PERMISSIONS[role];
	return `## Board Permissions

${perms.summary}

- **Allowed:** ${perms.allowed.join("; ")}
- **Forbidden:** ${perms.forbidden.join("; ")}`;
}
