# Checklist — Project Creation Protocol

Run `../scripts/new-app.sh <project-id> "<App Name>"` for steps 1-4.

- [ ] 1. New isolated project created from the appropriate template
- [ ] 2. Lowercase kebab-case project identifier assigned
- [ ] 3. Git initialized in the project directory
- [ ] 4. Project README written (name, identifier, status, current phase)
- [ ] 5. `docs/00-Project-Brief.md` completed
- [ ] 6. Missing information identified and listed as open questions
- [ ] 7. Conservative assumptions made only where necessary
- [ ] 8. Every assumption marked explicitly as `ASSUMPTION`
- [ ] 9. No implementation started
- [ ] 10. Proposed research and planning sequence presented for approval

## Gate

Implementation may not begin until these are complete:

- [ ] `docs/03-PRD.md`
- [ ] `docs/04-User-Journey.md`
- [ ] `docs/06-UI-Development-Plan.md`
- [ ] `docs/07-Architecture.md`
- [ ] First implementation phase in `docs/TASKS.md`, with acceptance criteria per task
