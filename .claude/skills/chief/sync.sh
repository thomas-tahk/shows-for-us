#!/usr/bin/env bash
# Copy chief and the global specialists into a repo's .claude/ so cloud
# sessions (which never see ~/.claude) can run them. Leaves project-specific
# agents (<project>-<role>.md) alone. Usage: sync.sh [repo-path]
set -euo pipefail

repo="${1:-.}"
src_skill="$HOME/.claude/skills/chief"
src_agents="$HOME/.claude/agents"

[ -d "$src_skill" ] || { echo "no $src_skill — run this on his Mac, not in the cloud" >&2; exit 1; }
git -C "$repo" rev-parse --show-toplevel >/dev/null

mkdir -p "$repo/.claude/skills/chief" "$repo/.claude/agents"
rsync -a --delete "$src_skill/" "$repo/.claude/skills/chief/"
for f in "$src_agents"/*.md; do
  case "$(basename "$f")" in README.md|servicenow.md) continue ;; esac  # servicenow: PDI repos only
  cp "$f" "$repo/.claude/agents/"
done

if [ -n "$(git -C "$repo" status --porcelain -- .claude/skills/chief .claude/agents)" ]; then
  echo "changed: commit .claude/skills/chief and .claude/agents"
else
  echo "up to date"
fi
