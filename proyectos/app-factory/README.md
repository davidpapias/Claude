# App Factory

Reusable factory for taking a validated product opportunity to a released native iOS
application: research → planning → design → implementation → QA → monetization →
launch.

The factory is not an application. Applications live in `projects/<project-id>/`, each
one isolated, each one created from a template in `templates/`.

## Structure

```
app-factory/
├── CLAUDE.md                 Operating system: the rules every project follows
├── README.md                 This file
├── templates/
│   └── ios-swiftui-app/      Native iOS template (SwiftUI + testable Swift core)
├── projects/                 One isolated directory per application
├── scripts/
│   └── new-app.sh            Creates a project from a template
└── checklists/
    ├── new-project.md        Project Creation Protocol
    ├── phase.md              Implementation Protocol + Definition of Done
    └── release.md            Human release review (never automated)
```

## Creating an application

```bash
./scripts/new-app.sh sleep-coach "Sleep Coach"
```

This creates `projects/sleep-coach/` from `templates/ios-swiftui-app`, substitutes the
project identifier and display name, initializes a Git repository, and leaves every
required document as an unanswered skeleton.

Project identifiers are lowercase kebab-case (`^[a-z][a-z0-9-]*$`). The script refuses
to overwrite an existing project.

After creation, the only permitted next step is planning: complete the Project Brief,
mark assumptions explicitly, and present the research and planning sequence. Do not
start implementation.

## Gate before implementation

Production code may not start until these documents are complete:

- `docs/03-PRD.md`
- `docs/04-User-Journey.md`
- `docs/06-UI-Development-Plan.md`
- `docs/07-Architecture.md`
- The first implementation phase in `docs/TASKS.md`, with acceptance criteria

## Validation inside a project

The template's Swift core builds and tests without Xcode:

```bash
cd projects/<project-id>
swift build
swift test
```

The SwiftUI app shell in `App/` requires Xcode; see the project README for how to
attach it to an Xcode project. Never report the iOS app as building in an environment
where it was not built.

## Rules

`CLAUDE.md` is the authority. Read it before working in any project. It defines the
operating principles, the required documents, the creation / planning / implementation
protocols, the Definition of Done, and the prohibited behaviors.
