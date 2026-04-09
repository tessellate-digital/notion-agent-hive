export const DISPATCH_TEMPLATES = `## Dispatch Templates

Templates for dispatching subagents. Use the appropriate template based on the task type.

---

### Thinker-Planner (PLAN_FEATURE)

Use when starting a new feature from scratch.

\`\`\`
DISPATCH: PLAN_FEATURE

BOARD_ID: {{board_id}}
FEATURE_DESCRIPTION: {{feature_description}}

INSTRUCTIONS:
Analyze the codebase and create a detailed implementation plan for this feature.
Break it down into atomic, testable tasks suitable for the kanban board.
Return your plan as a structured report. Do not modify the board directly.
\`\`\`

---

### Thinker-Planner (PLAN_FROM_DRAFT)

Use when the human has already drafted tasks on the board that need refinement.

\`\`\`
DISPATCH: PLAN_FROM_DRAFT

BOARD_ID: {{board_id}}
DRAFT_TASK_IDS: {{task_ids}}

INSTRUCTIONS:
Review the draft tasks on the board. Analyze dependencies, identify gaps,
suggest complexity estimates, and recommend task ordering.
Return your analysis as a structured report. Do not modify the board directly.
\`\`\`

---

### Thinker-Investigator (INVESTIGATE)

Use when you need codebase analysis without creating a plan.

\`\`\`
DISPATCH: INVESTIGATE

BOARD_ID: {{board_id}}
QUESTION: {{question}}

INSTRUCTIONS:
Investigate the codebase to answer this question. Look at relevant files,
understand patterns, and provide a detailed answer.
Return your findings as a structured report. Do not modify the board or any files.
\`\`\`

---

### Thinker-Refiner (REFINE_TASK)

Use when a single task needs more detail before execution.

\`\`\`
DISPATCH: REFINE_TASK

BOARD_ID: {{board_id}}
TASK_ID: {{task_id}}

INSTRUCTIONS:
Analyze this task and the surrounding codebase context. Identify:
- Specific files that need changes
- Test files that need creation/modification
- Edge cases to handle
- Potential blockers or dependencies
Return your refinement as a structured report. Do not modify the board directly.
\`\`\`

---

### Executor

Use when a task is ready for implementation.

\`\`\`
DISPATCH: EXECUTE

BOARD_ID: {{board_id}}
TASK_ID: {{task_id}}
TASK_TITLE: {{task_title}}
TASK_NOTES: {{task_notes}}

INSTRUCTIONS:
Implement this task following TDD workflow (red-green-refactor).
Write to the assigned ticket's Notes field with your progress.
When complete, return READY_FOR_TEST.
If blocked, return BLOCKED with explanation.
\`\`\`

---

### Reviewer

Use when a task is in the "In Test" status and needs review.

\`\`\`
DISPATCH: REVIEW

BOARD_ID: {{board_id}}
TASK_ID: {{task_id}}
TASK_TITLE: {{task_title}}

INSTRUCTIONS:
Review the implementation for this task:
1. Run existing tests and verify they pass
2. Check code quality and adherence to project patterns
3. Verify the implementation matches the task requirements
4. Look for edge cases or potential issues

Return PASS if acceptable (task moves to Human Review).
Return FAIL with specific feedback if changes needed (task returns to To Do).
Write your review findings to the ticket's Notes field.
\`\`\``;

export const GIT_COMMIT_TEMPLATE = `### Git Commit Architect (GIT_COMMIT)

Use when the user wants to commit changes.

\`\`\`
DISPATCH: GIT_COMMIT

BOARD_ID: {{board_id}}
FEATURE_TITLE: {{feature_title}}
SCOPE: {{scope_description}}

INSTRUCTIONS:
Analyze all staged and unstaged changes. Group them into atomic,
coherent commits. Return a GIT_COMMIT_PLAN before executing anything.
Wait for coordinator approval before running any git write commands.
\`\`\``;

export const FINAL_REVIEW_TEMPLATE = `### Final Reviewer (FINAL_REVIEW)

Use when the user requests a final review after all tasks are complete.

\`\`\`
DISPATCH: FINAL_REVIEW

BOARD_ID: {{board_id}}
FEATURE_PAGE_ID: {{feature_page_id}}
TASK_IDS: {{task_ids}}

INSTRUCTIONS:
Review all changes for this feature holistically. Read every ticket and
every changed file. Assess big-picture coherence — not per-task
correctness, but whether the changes together form a complete, consistent
whole that achieves the feature goal. Return FINAL_REVIEW_REPORT.
\`\`\``;

export const PR_REVIEW_TEMPLATE = `### PR Reviewer (PR_REVIEW)

Use when the user wants to review PR/MR comments from GitHub.

\`\`\`
DISPATCH: PR_REVIEW

BOARD_ID: {{board_id}}

INSTRUCTIONS:
Auto-detect the PR for the current branch using gh pr view.
Fetch all review comments, capturing their integer IDs and comment type.
Classify each comment as Critical, Actionable, Nitpick, or Wrong/Irrelevant.
Return a PR_REVIEW_REPORT with metadata, classified comments (including github_id and
comment_type per entry), concise per-thread summaries, investigations, and summary counts.
Do not modify any files or the Notion board.
\`\`\``;

export const PR_RESPOND_TEMPLATE = `### PR Responder (PR_RESPOND)

Use when the user wants to post replies to GitHub PR review comments.

Phase 1 — draft (dispatch first):
\`\`\`
DISPATCH: PR_RESPOND

BOARD_ID: {{board_id}}
FEEDBACK_TICKET_ID: {{feedback_ticket_id}}
PR_NUMBER: {{pr_number}}
PHASE: DRAFT

INSTRUCTIONS:
Read the PR feedback ticket from Notion. For each comment row, extract the human's
decision from the Human Feedback column and draft an appropriate reply.
Short acknowledgement for addressed comments. Detailed motivation for declined ones.
Return PR_RESPOND_PLAN with all draft replies for coordinator approval.
Do not post anything to GitHub in this phase.
\`\`\`

Phase 2 — execute (send as follow-up after human approval, include the full approved plan):
\`\`\`
PHASE: EXECUTE

PR_NUMBER: {{pr_number}}
PR_URL: {{pr_url}}

APPROVED_PLAN:
{{full_pr_respond_plan}}

Post all replies to GitHub using the IDs and reply text in the approved plan above.
Do not re-fetch or re-match anything. Return PR_RESPOND_REPORT.
\`\`\``;
