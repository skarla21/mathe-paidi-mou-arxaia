---
name: security-guidance
description: Warns about common security vulnerabilities when editing code. Use when editing GitHub Actions workflows, adding exec/eval, using dangerouslySetInnerHTML, or when the user asks for security review.
---

# Security Guidance

When editing code, check for these security patterns and warn the user before proceeding.

## GitHub Actions Workflows

When editing `.github/workflows/*.yml` or `.yaml`:

- **Command Injection**: Never use untrusted input (issue titles, PR descriptions, commit messages) directly in `run:` commands
- **Use env variables**: Instead of `${{ github.event.issue.title }}` in run, use `env:` with proper quoting
- **Risky inputs**: `github.event.issue.body`, `github.event.pull_request.title`, `github.event.comment.body`, `github.event.review.body`, `github.event.commits.*.message`, `github.event.head_commit.message`, `github.event.head_commit.author.email`, `github.head_ref`

**Safe pattern:**
```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: echo "$TITLE"
```

## Command Injection (Node.js)

- **Avoid**: `child_process.exec()` with user input - leads to command injection
- **Prefer**: `execFile` with array arguments, or project-specific safe utilities
- **Never**: `exec(\`command ${userInput}\`)`

## Code Injection

- **eval()**: Major security risk. Use JSON.parse() for data or alternative patterns
- **new Function()**: Can lead to code injection with dynamic strings
- **pickle** (Python): Arbitrary code execution with untrusted content. Use JSON instead

## XSS Vulnerabilities

- **dangerouslySetInnerHTML**: Requires sanitization (e.g. DOMPurify) for untrusted content
- **document.write()**: Exploitable for XSS. Use createElement/appendChild instead
- **innerHTML =**: Use textContent for plain text, or sanitize HTML

## System Commands (Python)

- **os.system()**: Only with static arguments. Never with user-controlled input

## When to Warn

Flag these patterns when they appear in code being written or edited. Provide the specific warning and suggest the safer alternative.
