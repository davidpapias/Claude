# {{APP_NAME}}

Project identifier: `{{PROJECT_ID}}`
Created: {{DATE}}
Status: **Planning — implementation not started**

This project was created by the App Factory. The factory rules in
`../../CLAUDE.md` apply to everything in this directory.

## Current phase

Phase 0 — Planning. Production code is not permitted until `docs/03-PRD.md`,
`docs/04-User-Journey.md`, `docs/06-UI-Development-Plan.md`, `docs/07-Architecture.md`,
and the first implementation phase in `docs/TASKS.md` are complete.

## Layout

```
App/                    SwiftUI presentation layer (requires Xcode)
Sources/AppCore/        Domain, Data, Analytics, Monetization, DesignSystem
Tests/AppCoreTests/     Unit tests for the core
docs/                   Required project documents
Package.swift           Swift package for the core
```

## Validation

```bash
swift build
swift test
```

These cover `Sources/AppCore` only. The SwiftUI app in `App/` requires an Xcode
project: create an iOS App target, add `App/` to it, and add this package as a local
Swift package dependency. Do not report the iOS app as building unless it was built.

## Documents

See `docs/`. Every document starts as a skeleton; unanswered sections are marked
`NOT STARTED`, and unverified content must be labelled `ASSUMPTION`.
