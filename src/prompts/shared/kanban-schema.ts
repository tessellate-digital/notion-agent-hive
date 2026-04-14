export const KANBAN_SCHEMA = `## Kanban Database Schema

| Column | Type | Options |
|--------|------|---------|
| Task | Title | - |
| Status | Select | Backlog (default), To Do (blue), In Progress (yellow), Needs Human Input (red), In Test (orange), Human Review (purple), Done (green), Released (gray) |
| Priority | Select | Critical (red), High (orange), Medium (yellow), Low (green) |
| Repo | Select | *(dynamic — created on first use by the executor based on the repository it is working in)* |
| Depends On | Rich Text | Task references |
| Complexity | Select | Small (green), Medium (yellow), Large (red) |
| Notes | Rich Text | - |

### Column Notes

- **Released**: Tasks that have been shipped/deployed. Only the human may move a task from Done to Released. Agents treat Released tasks as fully closed — they are excluded from reviews, execution loops, and dependency checks. This is important for multi-repo features where some changes ship before others.
- **Repo**: Identifies which repository a task's code changes belong to. The executor sets this after implementation. The coordinator may use it to scope reviews (e.g., "review all changes in repo X"). Created dynamically — the first time a repo name appears, it becomes a new select option.`;
