# AI App Factory — Operating System

## Mission

This directory is a reusable factory for researching, planning, designing, building,
testing, monetizing, and releasing native iOS applications.

The factory itself is not an individual application.

Every application must be created as an isolated project under `projects/`, from one of
the templates in `templates/`.

Never mix the source code, requirements, tasks, design decisions, analytics,
credentials, or documentation of two applications.

---

## Core Operating Principles

1. Research before building.
2. Define the product before writing production code.
3. Reduce the MVP before expanding it.
4. Prefer simple, maintainable architecture.
5. Use local storage unless cloud infrastructure provides a clear product requirement.
6. Every feature must have acceptance criteria.
7. Every implementation phase must be testable.
8. Never claim that code works without verifying it.
9. Maintain project documentation as the product evolves.
10. Record important technical and product decisions.
11. Do not silently expand scope.
12. Do not copy another application's trademarks, copyrighted assets, written content,
    or distinctive visual identity.
13. Extract patterns and principles, not protected expression.
14. Optimize for a functional, testable, releasable MVP.
15. Treat accessibility, privacy, error states, and subscription restoration as
    first-class requirements.

---

## Required Project Documents

Every application project must contain:

- `docs/00-Project-Brief.md`
- `docs/01-Research.md`
- `docs/02-Reverse-Engineering.md`
- `docs/03-PRD.md`
- `docs/04-User-Journey.md`
- `docs/05-Design-System.md`
- `docs/06-UI-Development-Plan.md`
- `docs/07-Architecture.md`
- `docs/08-Database.md`
- `docs/09-Analytics.md`
- `docs/10-Monetization.md`
- `docs/11-ASO.md`
- `docs/12-QA.md`
- `docs/13-Launch.md`
- `docs/TASKS.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

Do not begin production implementation until the PRD, user journey, UI development
plan, architecture, and first implementation phase have been documented.

---

## Project Creation Protocol

When asked to create a new application:

1. Create a new isolated project from the appropriate template.
2. Assign a lowercase kebab-case project identifier.
3. Initialize Git.
4. Create a new project README.
5. Complete the Project Brief.
6. Identify missing information.
7. Make conservative assumptions only when necessary.
8. Mark every assumption explicitly.
9. Do not start implementation.
10. Present the proposed research and planning sequence.

See `scripts/new-app.sh` for step 1–4 and `checklists/new-project.md` for the full list.

---

## Planning Protocol

Before implementation:

1. Analyze the target user and problem.
2. Research comparable products.
3. Separate verified facts from assumptions.
4. Identify common user complaints.
5. Map the complete user journey.
6. Define the smallest useful MVP.
7. Define exclusions for V1.
8. Define the monetization model.
9. Define activation and retention mechanics.
10. Create the screen inventory.
11. Define the architecture.
12. Break implementation into phases.
13. Add acceptance criteria to every task.

---

## Implementation Protocol

For each implementation phase:

1. Read the relevant documents.
2. Inspect the current repository state.
3. Explain the proposed approach.
4. Identify files to create or modify.
5. Confirm dependencies and risks.
6. Implement only the current phase.
7. Add or update tests.
8. Run available validation commands.
9. Resolve failures caused by the implementation.
10. Update `docs/TASKS.md`.
11. Update `docs/DECISIONS.md` when an important decision was made.
12. Summarize what changed.
13. Provide exact manual testing instructions.
14. Stop before beginning the next phase.

Never implement several undocumented phases at once.

---

## Definition of Done

A task is complete only when:

- Its acceptance criteria are satisfied.
- The app builds successfully when the environment allows it.
- Relevant automated tests pass.
- Manual testing instructions exist.
- Loading, empty, error, success, and offline states have been considered.
- Accessibility has been reviewed.
- Analytics events are included where required.
- Documentation has been updated.
- No unrelated changes were introduced.

A phase is complete only after every task in that phase meets this definition.

---

## Code Quality Rules

- Prefer native Swift and SwiftUI.
- Prefer Apple platform conventions.
- Keep views small and composable.
- Separate presentation, domain logic, and data access.
- Avoid business logic inside SwiftUI views.
- Use dependency injection where it improves testability.
- Avoid unnecessary third-party dependencies.
- Never commit secrets.
- Centralize configuration.
- Handle errors explicitly.
- Use meaningful names.
- Remove dead code.
- Add comments only where intent is not clear from the implementation.
- Do not create abstractions before they are justified.
- Do not perform large refactors while implementing an unrelated feature.

---

## Product Rules

Every product must define:

- Target user.
- Core problem.
- Primary job to be done.
- Activation event.
- Retention loop.
- Monetization event.
- North-star metric.
- Primary funnel.
- Cancellation risks.
- Ethical boundaries.
- Medical, financial, legal, or safety limitations when relevant.

The emotional journey must be documented alongside the functional journey.

---

## Design Rules

Before creating multiple screens:

1. Define the design system.
2. Build one representative screen.
3. Review hierarchy, spacing, typography, tone, and components.
4. Correct the system.
5. Only then scale the system across the remaining screens.

Use one primary action per screen whenever possible.

Do not introduce new colors, spacing values, radii, shadows, or component variants
without updating the design system.

---

## Backend Rules

Before adding backend infrastructure, answer:

- Which features require an account?
- Which data must sync across devices?
- Which data can remain local?
- Which operations require server authority?
- What sensitive data is collected?
- What is the minimum backend required for V1?

Prefer the least complex architecture capable of satisfying the product requirements.

---

## Subscription Rules

Every subscription implementation must include:

- Product loading.
- Purchase flow.
- Restore purchases.
- Entitlement verification.
- Loading states.
- Failure states.
- Cancelled purchase handling.
- Expired entitlement handling.
- Offline behavior.
- Sandbox testing instructions.
- Analytics events.
- Clear pricing and renewal language.

Never implement a paywall as a purely visual screen without functional entitlement
logic.

---

## Testing Rules

Testing must cover, when applicable:

- First launch.
- Returning user.
- Interrupted onboarding.
- Empty state.
- Failed network request.
- Offline mode.
- Invalid input.
- Authentication expiration.
- Purchase success.
- Purchase cancellation.
- Purchase failure.
- Restore purchases.
- Expired subscription.
- Data persistence.
- App relaunch.
- Different device sizes.
- Dynamic Type.
- VoiceOver labels.
- Dark and light appearance when supported.

---

## Documentation Discipline

Documentation is part of the product.

After meaningful work:

- Update task status.
- Record decisions.
- Update architecture when structure changes.
- Update the PRD when scope changes.
- Update analytics when behavior changes.
- Update QA cases when bugs are discovered.
- Keep documents concise and accurate.
- Do not leave completed plans describing behavior that no longer exists.

---

## Communication Format

For substantial tasks, respond using:

**Analysis** — what was inspected and understood.

**Proposed Approach** — what will be done and why.

**Files** — files that will be created or modified.

**Risks** — potential problems, assumptions, or dependencies.

**Validation** — how success will be tested.

**Status** — current phase and next permitted step.

Be precise. Avoid promotional language. Do not hide uncertainty.

---

## Prohibited Behavior

Do not:

- Start coding from a vague idea.
- Invent screens that are not in the approved plan.
- Add features without updating scope.
- Mark tasks complete without validation.
- Delete working functionality without explaining why.
- Introduce infrastructure merely because it is common.
- Store secrets in source control.
- Clone copyrighted branding or assets.
- Make medical or therapeutic claims without explicit product approval and appropriate
  evidence.
- Submit an application automatically without a human release review.

---

## Final Principle

The factory does not optimize for generating the most code.

It optimizes for repeatedly turning validated product opportunities into focused,
maintainable, testable, monetizable, and releasable applications.
