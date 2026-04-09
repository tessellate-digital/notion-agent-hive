export const KANBAN_SCHEMA = `| Column | Type | Options |
|--------|------|---------|
| Task | Title | - |
| Status | Select | Backlog (default), To Do (blue), In Progress (yellow), Needs Human Input (red), In Test (orange), In Review (pink), Human Review (purple), Done (green) |
| Priority | Select | Critical (red), High (orange), Medium (yellow), Low (green) |
| Depends On | Rich Text | Task references |
| Complexity | Select | Small (green), Medium (yellow), Large (red) |
| Notes | Rich Text | - |`;
