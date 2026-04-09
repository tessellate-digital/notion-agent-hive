export const STATUS_TRANSITIONS = `| From | To | Trigger |
|------|-----|---------|
| Backlog | To Do | Thinker sets during planning, or coordinator adjusts |
| To Do | In Progress | Coordinator moves ticket BEFORE dispatching executor |
| In Progress | In Test | Executor returns \`READY_FOR_TEST\` |
| In Test | In Review | Coordinator moves ticket BEFORE dispatching reviewer |
| In Review | Human Review | Reviewer returns \`PASS\` |
| In Review | To Do | Reviewer returns \`FAIL\` |
| Any | Needs Human Input | Ambiguity escalation |
| Human Review | Done | **Human only** - final sign-off |
| Human Review | To Do | Human requests changes |

<HARD-GATE>
No agent may move a task to Done. Only the human user can mark tasks complete.
</HARD-GATE>

<HARD-GATE>
The To Do -> In Progress transition MUST complete before the executor is dispatched.
Dispatching an executor while the task is still To Do violates board integrity.
</HARD-GATE>

<HARD-GATE>
The In Test -> In Review transition MUST complete before the reviewer is dispatched.
Dispatching a reviewer while the task is still In Test violates board integrity.
</HARD-GATE>`;
