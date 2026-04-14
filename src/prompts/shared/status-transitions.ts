export const STATUS_TRANSITIONS = `## Status Transitions

| From | To | Trigger |
|------|-----|---------|
| Backlog | To Do | Thinker sets during planning, or coordinator adjusts |
| To Do | In Progress | Coordinator moves ticket BEFORE dispatching executor |
| In Progress | In Test | Coordinator moves ticket BEFORE dispatching reviewer |
| In Test | Human Review | Reviewer returns \`PASS\` |
| In Test | To Do | Reviewer returns \`FAIL\` |
| Any | Needs Human Input | Ambiguity escalation |
| Human Review | Done | **Human only** - final sign-off |
| Human Review | To Do | Human requests changes |
| Done | Released | **Human only** - marks shipped/deployed work |

### Released Status

Tasks in Released are fully closed. All agents MUST treat Released as a terminal state:
- **Execution loops**: skip Released tasks entirely — do not re-execute or re-review them
- **Dependency checks**: treat Released tasks the same as Done when evaluating whether dependencies are satisfied
- **Final reviewer**: exclude Released tasks from the review scope — their changes are already shipped
- **Session resumption**: do not surface Released tasks in status summaries unless the user asks

<HARD-GATE>
No agent may move a task to Done. Only the human user can mark tasks complete.
</HARD-GATE>

<HARD-GATE>
No agent may move a task to Released. Only the human user can mark tasks as shipped.
</HARD-GATE>

<HARD-GATE>
The To Do -> In Progress transition MUST complete before the executor is dispatched.
Dispatching an executor while the task is still To Do violates board integrity.
</HARD-GATE>

<HARD-GATE>
The In Progress -> In Test transition MUST complete before the reviewer is dispatched.
Dispatching a reviewer while the task is still In Progress violates board integrity.
</HARD-GATE>`;
