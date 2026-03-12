# Pull Request Management Playbook

This playbook defines how maintainers should review PRs, decide whether to approve or deny them, and resolve merge conflicts consistently.

## 1) Intake checklist (for every PR)

- Confirm the PR has a clear title and description.
- Confirm linked issue/task context is present.
- Confirm scope is focused and not bundling unrelated work.
- Confirm CI status is green (lint, typecheck, tests).
- Confirm release-impacting changes are documented.

If any required item is missing, request changes before full review.

## 2) Merge decision policy

## Approve when all are true

- Code is correct and maintainable.
- Required tests exist and pass.
- Security/privacy concerns are addressed.
- API or behavior changes are documented.
- No unresolved review threads remain.

## Deny (request changes) when any is true

- The PR breaks existing behavior without explicit migration notes.
- Tests are missing for behavior changes.
- CI is failing.
- Security, data-handling, or permission concerns are unresolved.
- Scope creep introduces unrelated work.

When denying, include:

1. The exact blocking issue.
2. The expected fix.
3. Whether the author should update the same branch or open a follow-up PR.

## 3) Conflict resolution workflow

When a PR has merge conflicts:

1. Rebase or merge the base branch into the PR branch.
2. Resolve conflicts manually in each affected file.
3. Re-run validation locally (`npm run lint`, `npm run typecheck`, `npm test`).
4. Commit with a message such as `chore: resolve merge conflicts with main`.
5. Push and confirm CI is green.

## 4) Reviewer response templates

### Approve template

- **Decision:** Approve ✅
- **Reason:** All required checks passed; no blocking issues found.
- **Follow-up:** Optional nits can be handled in subsequent PRs.

### Deny / Request changes template

- **Decision:** Request changes ❌
- **Blocking issues:**
  - `<issue 1>`
  - `<issue 2>`
- **Required before merge:**
  - `<required fix 1>`
  - `<required fix 2>`

## 5) Practical commands for maintainers

```bash
# Update local main
git checkout main
git pull --ff-only

# Review a branch
git checkout <pr-branch>
git fetch origin

# Rebase onto main to resolve conflicts
git rebase origin/main

# Validate before approval
npm run lint
npm run typecheck
npm test
```
