# 07 — Architecture

Status: NOT STARTED

Implementation may not begin until this document is complete.

## Overview

Prefer the least complex architecture capable of satisfying the requirements.

## Layers

| Layer | Responsibility | Location |
|-------|----------------|----------|
| Presentation | SwiftUI views, view state | `App/` |
| Domain | Entities, use cases, business rules | `Sources/AppCore/Domain` |
| Data | Repositories, persistence, network | `Sources/AppCore/Data` |
| Platform services | Analytics, monetization, config | `Sources/AppCore/{Analytics,Monetization}` |

Rule: no business logic inside SwiftUI views.

## Dependency injection

## Concurrency model

## Error handling

Every error path is explicit. Document user-visible error copy.

## Persistence

See `08-Database.md`.

## Backend

Answer before adding any backend:

- Which features require an account?
- Which data must sync across devices?
- Which data can remain local?
- Which operations require server authority?
- What sensitive data is collected?
- What is the minimum backend required for V1?

Decision:

## Configuration

Centralized. No secrets in source control.

## Third-party dependencies

| Dependency | Justification | Alternative considered |
|------------|---------------|------------------------|

## Testing strategy
