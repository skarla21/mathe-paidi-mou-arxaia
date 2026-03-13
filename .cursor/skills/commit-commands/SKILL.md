---
name: commit-commands
description: Streamlines git workflow with commit, push, and PR creation. Use when the user asks to commit changes, create a commit, push and create PR, clean up gone branches, or run /commit, /commit-push-pr, /clean_gone style workflows.
---

# Commit Commands

Automate common git operations: committing with generated messages, pushing and creating PRs, and cleaning up stale branches.

## Workflow 1: Commit

When the user wants to create a git commit:

1. Run `git status` and `git diff HEAD` to see staged and unstaged changes
2. Check `git log --oneline -10` to match the repository's commit style
3. Draft an appropriate commit message (follow conventional commits if the project uses them)
4. Avoid committing files with secrets (.env, credentials.json)
5. Stage relevant files and create the commit with `git add` and `git commit`

**Commit message guidelines:**
- Match the repo's existing style from recent commits
- Be descriptive but concise
- Use conventional commit format when appropriate: `feat:`, `fix:`, `refactor:`, etc.

## Workflow 2: Commit, Push, and Create PR

When the user wants to commit, push, and open a pull request:

1. If on main, create a new branch with `git checkout -b <branch-name>`
2. Stage and commit changes with an appropriate message
3. Push the branch to origin with `git push -u origin <branch>`
4. Create a PR using `gh pr create` (requires GitHub CLI)
5. Provide the PR URL

**PR description** should include:
- Summary of changes (1-3 bullet points)
- Test plan checklist
- Analyze all commits in the branch, not just the latest

**Requirements:** GitHub CLI (`gh`) must be installed and authenticated. Repository must have a remote named `origin`.

## Workflow 3: Clean Gone Branches

When the user wants to clean up local branches deleted from remote:

1. List branches: `git branch -v` to identify [gone] status
2. List worktrees: `git worktree list` (branches with '+' have worktrees)
3. For each [gone] branch:
   - Remove associated worktree first if it exists: `git worktree remove --force <path>`
   - Delete the branch: `git branch -D <branch>`

**When to use:** After merging PRs and deleting remote branches, or when the local branch list is cluttered with stale branches.

**Note:** Run `git fetch --prune` first if branches don't show as [gone] - they must be deleted from remote.
