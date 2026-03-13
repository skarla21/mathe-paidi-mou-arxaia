---
name: pr-review-toolkit
description: Comprehensive PR and code review covering comments, tests, error handling, types, and code quality. Use when the user asks for code review, PR review, to check tests, review error handling, analyze comments, or review type design.
---

# PR Review Toolkit

Comprehensive review covering multiple aspects of code quality. Apply the relevant focus based on what the user requests.

## 1. Comment Analyzer

When reviewing documentation or comments:
- Verify comment accuracy vs actual code
- Check documentation completeness
- Flag misleading or outdated comments
- Identify comment rot and technical debt

**Triggers:** "Check if comments are accurate", "Review the documentation", "Analyze comments"

## 2. Test Coverage Analyzer

When reviewing tests:
- Assess behavioral vs line coverage
- Identify critical gaps in test coverage
- Evaluate test quality and resilience
- Check edge cases and error conditions

**Triggers:** "Check if tests are thorough", "Review test coverage", "Are there critical test gaps?"

## 3. Silent Failure Hunter

When reviewing error handling:
- Find silent failures in catch blocks
- Flag inadequate error handling
- Check for inappropriate fallback behavior
- Identify missing error logging

**Triggers:** "Review error handling", "Check for silent failures", "Analyze catch blocks"

## 4. Type Design Analyzer

When reviewing types or data models:
- Rate type encapsulation (1-10)
- Evaluate invariant expression (1-10)
- Assess type usefulness (1-10)
- Check invariant enforcement (1-10)

**Triggers:** "Review type design", "Analyze types in this PR", "Check type invariants"

## 5. General Code Reviewer

When doing general code review:
- Check .cursor/rules and project guideline compliance
- Identify style violations
- Detect bugs and logic errors
- Flag code quality issues

**Triggers:** "Review my changes", "Check if everything looks good", "Review before I commit"

## 6. Code Simplifier

When code works but feels complex (see code-simplifier skill for full details):
- Identify unnecessary complexity
- Suggest clarity improvements
- Preserve functionality while improving structure

## Output Format

For each finding:
- Clear issue identification with file:line references
- Explanation of why it's a problem
- Suggestions for improvement
- Prioritize by severity (critical, important, suggestion)

## Recommended Workflow

1. Write code -> General code review
2. Fix issues -> Silent failure hunter (if error handling changed)
3. Add tests -> Test coverage analyzer
4. Document -> Comment analyzer
5. Review passes -> Code simplifier (polish)
