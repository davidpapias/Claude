#!/usr/bin/env bash
#
# Create an isolated application project from a factory template.
#
# Usage: ./scripts/new-app.sh <project-id> "<App Name>" [template]
#
# Steps 1-4 of the Project Creation Protocol. The remaining steps (complete the
# Project Brief, identify missing information, mark assumptions, present the research
# and planning sequence) are done by hand. Implementation does not start here.

set -euo pipefail

FACTORY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_TEMPLATE="ios-swiftui-app"

usage() {
    echo "Usage: $0 <project-id> \"<App Name>\" [template]" >&2
    echo "  project-id  lowercase kebab-case, e.g. sleep-coach" >&2
    echo "  template    defaults to ${DEFAULT_TEMPLATE}" >&2
    echo >&2
    echo "Available templates:" >&2
    ls -1 "${FACTORY_DIR}/templates" | sed 's/^/  /' >&2
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
    usage
    exit 1
fi

PROJECT_ID="$1"
APP_NAME="$2"
TEMPLATE="${3:-$DEFAULT_TEMPLATE}"

if ! printf '%s' "$PROJECT_ID" | grep -Eq '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'; then
    echo "Error: project identifier must be lowercase kebab-case: '$PROJECT_ID'" >&2
    exit 1
fi

if [ -z "$APP_NAME" ]; then
    echo "Error: app name must not be empty" >&2
    exit 1
fi

TEMPLATE_DIR="${FACTORY_DIR}/templates/${TEMPLATE}"
PROJECT_DIR="${FACTORY_DIR}/projects/${PROJECT_ID}"

if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "Error: unknown template '${TEMPLATE}'" >&2
    usage
    exit 1
fi

if [ -e "$PROJECT_DIR" ]; then
    echo "Error: project already exists: ${PROJECT_DIR}" >&2
    echo "Refusing to overwrite. Never mix two applications in one directory." >&2
    exit 1
fi

CREATED_DATE="$(date +%Y-%m-%d)"

# 1. Isolated copy of the template.
mkdir -p "$PROJECT_DIR"
cp -R "${TEMPLATE_DIR}/." "$PROJECT_DIR/"

# 2-3. Substitute the project identifier, display name, and creation date.
find "$PROJECT_DIR" -type f \( -name '*.md' -o -name '*.swift' \) -print0 \
    | while IFS= read -r -d '' file; do
        tmp="${file}.tmp"
        APP_NAME="$APP_NAME" PROJECT_ID="$PROJECT_ID" CREATED_DATE="$CREATED_DATE" \
            perl -pe 's/\{\{APP_NAME\}\}/$ENV{APP_NAME}/g;
                      s/\{\{PROJECT_ID\}\}/$ENV{PROJECT_ID}/g;
                      s/\{\{DATE\}\}/$ENV{CREATED_DATE}/g' "$file" > "$tmp"
        mv "$tmp" "$file"
    done

# 4. Isolated Git history, one repository per application.
git -C "$PROJECT_DIR" init --quiet
git -C "$PROJECT_DIR" add -A
git -C "$PROJECT_DIR" -c user.name="App Factory" -c user.email="factory@local" \
    commit --quiet -m "chore: initialize ${PROJECT_ID} from ${TEMPLATE} template"

cat <<EOF
Created ${PROJECT_DIR}
  template:   ${TEMPLATE}
  app name:   ${APP_NAME}
  identifier: ${PROJECT_ID}
  git:        initialized with one commit

Next permitted steps (no implementation):
  1. Complete docs/00-Project-Brief.md
  2. Identify missing information and list open questions
  3. Mark every assumption explicitly
  4. Present the proposed research and planning sequence

See ${FACTORY_DIR}/checklists/new-project.md
EOF
