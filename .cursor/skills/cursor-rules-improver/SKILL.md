---
name: cursor-rules-improver
description: Audits and improves .cursor/rules files to ensure optimal project context for the AI. Use when the user asks to check, audit, update, improve, or fix Cursor rules. Also use for "project rules maintenance" or "cursor rules optimization".
---

# Cursor Rules Improver

Audit, evaluate, and improve .cursor/rules files across a codebase so the AI has optimal project context.

## Workflow

### Phase 1: Discovery

Find all rule files:
- `.cursor/rules/*.mdc` (project rules)
- `.cursor/rules/*.md`
- Root-level `AGENTS.md` or similar if present

### Phase 2: Quality Assessment

For each rules file, evaluate:

| Criterion | Check |
|-----------|-------|
| Commands/workflows documented | Are build/test/deploy commands present? |
| Architecture clarity | Can the AI understand codebase structure? |
| Non-obvious patterns | Are gotchas and quirks documented? |
| Conciseness | No verbose explanations or obvious info? |
| Currency | Does it reflect current codebase state? |
| Actionability | Are instructions executable, not vague? |

**Quality Grades:** A (90-100), B (70-89), C (50-69), D (30-49), F (0-29)

### Phase 3: Quality Report

**ALWAYS output the quality report BEFORE making any updates.**

Format:
```
## Cursor Rules Quality Report

### Summary
- Files found: X
- Average score: X/100
- Files needing update: X

### File-by-File Assessment
[Per-file scores, issues, recommended additions]
```

### Phase 4: Targeted Updates

After user approval only. Focus on:
- Commands or workflows discovered during analysis
- Gotchas or non-obvious patterns found in code
- Package relationships that weren't clear
- Testing approaches that work
- Configuration quirks

**Avoid:** Restating obvious code, generic best practices, one-off fixes, verbose explanations.

### Phase 5: Apply Updates

Use Edit tool. Preserve existing content structure. Show diffs before applying.

## Common Issues to Flag

1. Stale commands (build/test that no longer work)
2. Missing dependencies (required tools not mentioned)
3. Outdated architecture (file structure changed)
4. Missing environment setup (env vars, config)
5. Broken test commands
6. Undocumented gotchas

## Key Principles

- Concise and human-readable
- Actionable commands that can be copy-pasted
- Project-specific patterns, not generic advice
- Non-obvious gotchas and warnings
