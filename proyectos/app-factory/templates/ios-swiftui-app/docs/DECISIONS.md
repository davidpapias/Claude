# DECISIONS

One entry per important technical or product decision. Append only; supersede rather
than rewrite.

## Format

### YYYY-MM-DD — <decision title>

- **Context:** what forced a choice
- **Options:** what was considered
- **Decision:** what was chosen
- **Consequences:** what this makes easy and what it makes hard
- **Status:** accepted / superseded by <entry>

---

### {{DATE}} — Project created from `ios-swiftui-app` template

- **Context:** New application `{{PROJECT_ID}}` initialized in the App Factory.
- **Options:** N/A
- **Decision:** Start from the native SwiftUI template with a testable Swift core;
  local-only persistence until a product requirement justifies a backend.
- **Consequences:** Domain and data logic are testable without Xcode. Any backend or
  third-party dependency requires a new decision entry.
- **Status:** accepted
