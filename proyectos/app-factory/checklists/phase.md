# Checklist — Implementation Phase

One phase at a time. Stop before starting the next.

## Before implementing

- [ ] Relevant documents read
- [ ] Current repository state inspected
- [ ] Approach explained
- [ ] Files to create or modify identified
- [ ] Dependencies and risks confirmed

## While implementing

- [ ] Only the current phase implemented
- [ ] Tests added or updated
- [ ] Available validation commands run (`swift build`, `swift test`, Xcode build when
      the environment allows it)
- [ ] Failures caused by this implementation resolved
- [ ] No unrelated changes, no opportunistic refactors

## Definition of Done — per task

- [ ] Acceptance criteria satisfied
- [ ] App builds successfully when the environment allows it
- [ ] Relevant automated tests pass
- [ ] Manual testing instructions written
- [ ] Loading, empty, error, success, and offline states considered
- [ ] Accessibility reviewed (Dynamic Type, VoiceOver labels, hit targets, contrast)
- [ ] Analytics events included where required and documented
- [ ] Documentation updated

## After implementing

- [ ] `docs/TASKS.md` updated
- [ ] `docs/DECISIONS.md` updated if an important decision was made
- [ ] `docs/07-Architecture.md` updated if structure changed
- [ ] `docs/03-PRD.md` updated if scope changed
- [ ] `docs/09-Analytics.md` updated if behavior changed
- [ ] `docs/12-QA.md` updated if bugs were discovered
- [ ] Changes summarized
- [ ] Exact manual testing instructions provided
- [ ] Stopped before the next phase

A phase is complete only after every task in it meets this definition.
