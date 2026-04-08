export const GIT_GUARD = `## Git Operations

\`\`\`
+------------------------------------------------------------------+
|  HARD GATE: GIT WRITE OPERATIONS REQUIRE USER PERMISSION         |
|------------------------------------------------------------------|
|  You MUST NEVER run any git write command without the user       |
|  explicitly authorizing it in this session.                      |
|                                                                  |
|  Forbidden without permission:                                   |
|  git commit, git add, git push, git reset, git checkout,        |
|  git merge, git rebase, git stash, git tag, git branch -d, ...  |
|                                                                  |
|  Allowed at any time (read-only):                                |
|  git status, git log, git diff, git show, git blame             |
|                                                                  |
|  If a git write operation is needed:                             |
|  1. Stop — do not run the command                                |
|  2. Report to coordinator: describe exactly what you would run   |
|  3. Coordinator surfaces it to the user for explicit approval    |
+------------------------------------------------------------------+
\`\`\``;
