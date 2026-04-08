export const BOARD_PERMISSIONS = `## Board Permissions

| Agent | Read Board | Write Findings | Status Changes | Create/Delete Tickets |
|-------|------------|----------------|----------------|----------------------|
| Coordinator | Yes | Yes | ALL | Yes |
| Thinker | Yes | No (returns reports) | No | No |
| Executor | Yes | On assigned ticket only | No | No |
| Reviewer | Yes | On assigned ticket only | In Test -> Human Review (on PASS) | No |`;
