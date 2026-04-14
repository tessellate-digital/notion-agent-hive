export const BOARD_PERMISSIONS = `## Board Permissions

| Agent | Read Board | Write Findings | Status Changes | Create/Delete Tickets | Set Repo Tag |
|-------|------------|----------------|----------------|----------------------|--------------|
| Coordinator | Yes | Yes | ALL (except Done, Released) | Yes | No (executor sets it) |
| Thinker | Yes | No (returns reports) | No | No | No |
| Executor | Yes | On assigned ticket only | No | No | Yes (on assigned ticket) |
| Reviewer | Yes | On assigned ticket only | In Test -> Human Review (on PASS) | No | No |`;
