#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="/Users/yuraw/Documents/Clients/NoblesMedia/EBRD/develope plugins/Releases"
PLUGIN_SLUG="yoo-load-more"
PLUGIN_MAIN_FILE="yoo-load-more.php"
VERSION="n/a"
TEMP_DIR=""

print_final_status() {
    local exit_code=$?
    local timestamp

    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        /usr/bin/find "$TEMP_DIR" -depth -delete 2>/dev/null || true
    fi

    timestamp="$(date '+%Y-%m-%d %H:%M:%S %Z')"
    if [ "$exit_code" -eq 0 ]; then
        printf '\n\033[1;32m%s\033[0m\n' "✅ STATUS: SUCCESS | VERSION: ${VERSION} | CREATED: ${timestamp}"
    else
        printf '\n\033[1;31m%s\033[0m\n' "❌ STATUS: FAILED | VERSION: ${VERSION} | TIME: ${timestamp}"
    fi

    exit "$exit_code"
}
trap print_final_status EXIT

usage() {
    cat <<'EOF'
Usage:
  ./build.sh
  ./build.sh [patch|minor|major] [--yes] [--comment "text"] [--publish-release]

Options:
  patch|minor|major  Bump the synchronized plugin version before building.
  --yes              Skip confirmation before the release commit.
  --comment TEXT     Append text to the release commit message.
  --publish-release  Create/update the matching GitHub Release and upload the ZIP.
  --help             Show this help.
EOF
}

BUMP_TYPE=""
AUTO_YES=0
RELEASE_COMMENT=""
PUBLISH_RELEASE=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        patch|minor|major)
            if [ -n "$BUMP_TYPE" ]; then
                echo "❌ Version bump level was specified more than once."
                usage
                exit 1
            fi
            BUMP_TYPE="$1"
            shift
            ;;
        --yes)
            AUTO_YES=1
            shift
            ;;
        --comment)
            if [ "$#" -lt 2 ]; then
                echo "❌ --comment requires a value."
                exit 1
            fi
            RELEASE_COMMENT="$2"
            shift 2
            ;;
        --comment=*)
            RELEASE_COMMENT="${1#--comment=}"
            shift
            ;;
        --publish-release)
            PUBLISH_RELEASE=1
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

cd "$ROOT_DIR"

for command_name in php node rsync zip unzip mktemp; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "❌ Required command is not installed: $command_name"
        exit 1
    fi
done

if [ "$PUBLISH_RELEASE" -eq 1 ] && [ -z "$BUMP_TYPE" ]; then
    echo "❌ --publish-release requires patch, minor, or major."
    exit 1
fi

if [ -n "$BUMP_TYPE" ]; then
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "❌ A version bump requires an initialized Git repository."
        exit 1
    fi
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "❌ A version bump requires a configured GitHub remote named origin."
        exit 1
    fi
fi

if [ -n "$BUMP_TYPE" ]; then
    echo "⬆️ Bumping ${BUMP_TYPE} version..."
    php bin/bump-version.php "$BUMP_TYPE"
elif [ -n "${RELEASE_COMMENT// }" ]; then
    echo "ℹ️ --comment is ignored when no version bump is requested."
fi

VERSION="$(sed -n 's/^[[:space:]]*\*[[:space:]]*Version:[[:space:]]*//p' "$PLUGIN_MAIN_FILE" | head -n 1 | tr -d '\r')"
if ! printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "❌ Unable to read a semantic version from ${PLUGIN_MAIN_FILE}."
    exit 1
fi

echo "🔎 Running release checks..."
while IFS= read -r php_file; do
    php -l "$php_file" >/dev/null
done < <(find . -type f -name '*.php' -not -path './vendor/*' -not -path './node_modules/*' -print)
node --check assets/js/load-more-engine.js
node --check assets/js/block-editor.js
php bin/check-version.php "$VERSION"

if [ -n "$BUMP_TYPE" ]; then
    git add -A
    if ! git diff --cached --quiet; then
        release_message="Release v${VERSION}"
        if [ -n "${RELEASE_COMMENT// }" ]; then
            release_message="${release_message} - ${RELEASE_COMMENT}"
        fi

        echo "📋 Files included in the release commit:"
        git diff --cached --name-status

        if [ "$AUTO_YES" -ne 1 ]; then
            read -r -p "Create git commit \"${release_message}\"? [y/N]: " confirmation
            case "$confirmation" in
                y|Y|yes|YES) ;;
                *)
                    echo "⏹️ Release commit cancelled."
                    exit 1
                    ;;
            esac
        fi

        git commit -m "$release_message"
    else
        echo "ℹ️ No changes to commit."
    fi

    current_branch="$(git branch --show-current)"
    if [ -z "$current_branch" ]; then
        echo "❌ Unable to determine the current Git branch."
        exit 1
    fi
    echo "🚀 Pushing origin/${current_branch}..."
    git push -u origin "$current_branch"
fi

ZIP_NAME="${PLUGIN_SLUG}-v${VERSION}.zip"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${PLUGIN_SLUG}-build.XXXXXX")"
STAGE_DIR="${TEMP_DIR}/${PLUGIN_SLUG}"
TEMP_ZIP="${TEMP_DIR}/${ZIP_NAME}"

echo "📂 Staging ${PLUGIN_SLUG} v${VERSION}..."
mkdir -p "$STAGE_DIR"
rsync -a ./ "$STAGE_DIR/" --exclude-from="$ROOT_DIR/.distignore"

echo "📦 Creating ${ZIP_NAME}..."
(
    cd "$TEMP_DIR"
    zip -q -r "$TEMP_ZIP" "$PLUGIN_SLUG"
)

if unzip -Z1 "$TEMP_ZIP" | grep -Eq '(^|/)\.DS_Store$|(^|/)\.git(/|$)|(^|/)build\.sh$|(^|/)bin(/|$)'; then
    echo "❌ Development-only files were found in the release archive."
    exit 1
fi

mkdir -p "$RELEASE_DIR"
mv -f "$TEMP_ZIP" "$RELEASE_DIR/$ZIP_NAME"
echo "✅ Archive created: ${RELEASE_DIR}/${ZIP_NAME}"

if [ "$PUBLISH_RELEASE" -eq 1 ]; then
    if ! command -v gh >/dev/null 2>&1; then
        echo "❌ GitHub CLI (gh) is not installed."
        exit 1
    fi
    if ! gh auth status >/dev/null 2>&1; then
        echo "❌ GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    fi

    TAG_NAME="v${VERSION}"
    RELEASE_TITLE="Release ${TAG_NAME}"
    RELEASE_ASSET_PATH="${RELEASE_DIR}/${ZIP_NAME}"

    if ! git rev-parse -q --verify "refs/tags/${TAG_NAME}" >/dev/null 2>&1; then
        git tag -a "$TAG_NAME" -m "$RELEASE_TITLE"
    fi
    if ! git ls-remote --exit-code --tags origin "refs/tags/${TAG_NAME}" >/dev/null 2>&1; then
        git push origin "$TAG_NAME"
    fi

    if gh release view "$TAG_NAME" >/dev/null 2>&1; then
        gh release upload "$TAG_NAME" "$RELEASE_ASSET_PATH" --clobber
    else
        gh release create "$TAG_NAME" "$RELEASE_ASSET_PATH" --title "$RELEASE_TITLE" --generate-notes
    fi

    release_url="$(gh release view "$TAG_NAME" --json url -q '.url')"
    echo "🔗 GitHub Release: ${release_url}"
fi
