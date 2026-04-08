| From | To | Trigger |
|------|-----|---------|
| Backlog | To Do | Thinker sets during planning, or coordinator adjusts |
| To Do | In Progress | Coordinator dispatches executor |
| In Progress | In Test | Executor returns `READY_FOR_TEST` |
| In Test | Human Review | Reviewer returns `PASS` |
| In Test | To Do | Reviewer returns `FAIL` |
| Any | Needs Human Input | Ambiguity escalation |
| Human Review | Done | **Human only** - final sign-off |
| Human Review | To Do | Human requests changes |

<HARD-GATE>
No agent may move a task to Done. Only the human user can mark tasks complete.
</HARD-GATE>
