# Installed Skills

Skills live in `.claude/skills/<name>/` and are picked up automatically for
this project. Each skill directory carries a `.source` file naming the
upstream repository it came from.

## Sources (installed in this order)

| # | Repository | Commit | Skills |
|---|------------|--------|--------|
| 1 | https://github.com/anthropics/skills | `5304866` | 19 |
| 2 | https://github.com/vercel-labs/agent-skills | `063bee9` | 9 |
| 3 | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `58c220f` | 7 |
| 4 | https://github.com/bencium/bencium-marketplace | `8b152ec` | 16 |
| 5 | https://github.com/AccessLint/skills | `2e9d733` | 5 |
| 6 | https://github.com/vercel-labs/agent-skills | `063bee9` | (repeat of #2 — re-applied last, no change) |

Total: **56 skills**. No name collided across repositories, so the install
order did not cause any skill to shadow another.

## Skills by source

### anthropics/skills

- academy-guide
- algorithmic-art
- brand-guidelines
- canvas-design
- claude-api
- discernment-nudge
- doc-coauthoring
- docx
- frontend-design
- internal-comms
- mcp-builder
- pdf
- pptx
- skill-creator
- slack-gif-creator
- theme-factory
- web-artifacts-builder
- webapp-testing
- xlsx

### vercel-labs/agent-skills

- composition-patterns
- deploy-to-vercel
- react-best-practices
- react-native-skills
- react-view-transitions
- vercel-cli-with-tokens
- vercel-optimize
- web-design-guidelines
- writing-guidelines

### nextlevelbuilder/ui-ux-pro-max-skill

- banner-design
- brand
- design
- design-system
- slides
- ui-styling
- ui-ux-pro-max

### bencium/bencium-marketplace

- adaptive-communication
- bencium-aeo
- bencium-code-conventions
- bencium-controlled-ux-designer
- bencium-impact-designer
- bencium-innovative-ux-designer
- design-audit
- eu-ai-act-reviewer
- human-architect-mindset
- hungarian-humanizer
- insurgent-campaign
- negentropy-lens
- relationship-design
- renaissance-architecture
- typography
- vanity-engineering-review

### AccessLint/skills

- accessibility-audit
- accessibility-diff
- accessibility-fix
- accessibility-inspect
- accessibility-scan

## Notes

- `relationship-design` (bencium) shipped with `name: Agentic UX Design -
  Relationship-Centric Interfaces` in its frontmatter, which is not a valid
  skill slug. It was normalized to `relationship-design` to match its
  directory so the skill loads. No other file was modified.
- Several skills from `anthropics/skills` (`docx`, `xlsx`, `pptx`, `pdf`,
  `skill-creator`, `brand-guidelines`, `claude-api`) share names with skills
  that ship with Claude Code. The project-level copies take precedence here;
  they are the same upstream skills.
