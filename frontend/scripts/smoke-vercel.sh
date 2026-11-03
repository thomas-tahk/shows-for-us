#!/usr/bin/env bash
# Offline smoke test of the Vercel deploy: runs `vercel build` (no account, no login,
# no deploy) on a scratch copy of frontend/, then checks the routing table and calls
# the built /api/events function. Re-run from anywhere: bash frontend/scripts/smoke-vercel.sh
set -euo pipefail

FRONTEND="$(cd "$(dirname "$0")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

# Tracked and untracked-but-not-ignored files (no dist/, no stale .vercel), plus node_modules.
git -C "$FRONTEND" ls-files -z --cached --others --exclude-standard . | (cd "$FRONTEND" && xargs -0 -I{} cp --parents {} "$SCRATCH")
ln -s "$FRONTEND/node_modules" "$SCRATCH/node_modules"
mkdir -p "$SCRATCH/.vercel"
echo '{"projectId":"_","orgId":"_","settings":{"framework":"vite"}}' > "$SCRATCH/.vercel/project.json"

cd "$SCRATCH"
npx -y vercel@65.3.1 build --yes

echo "--- routes in .vercel/output/config.json"
node -e '
const c = JSON.parse(require("fs").readFileSync(".vercel/output/config.json", "utf8"));
console.log(JSON.stringify(c.routes, null, 1));
const r = c.routes || [];
const spa = r.find(x => x.dest === "/index.html" && x.src && x.src !== "/(.*)");
if (!spa) { console.error("FAIL: no SPA fallback route found"); process.exit(1); }
const re = new RegExp(spa.src);
const hit = p => re.test(p);
for (const [p, want] of [["/", true], ["/show/hamilton", true], ["/api/foo", false]]) {
  if (hit(p) !== want) { console.error("FAIL: fallback match for " + p + " expected " + want); process.exit(1); }
  console.log("fallback " + p + " -> " + (hit(p) ? "index.html" : "not swallowed (404 / function)"));
}
'
test -f .vercel/output/static/index.html && echo "static index.html present"

echo "--- invoke built function (no TICKETMASTER_API_KEY)"
FUNC_DIR=".vercel/output/functions/api/events.func"
(cd "$FUNC_DIR" && ls)
unset TICKETMASTER_API_KEY
node --input-type=module -e "
const m = await import('$SCRATCH/$FUNC_DIR/api/events.js');
const res = await m.GET(new Request('http://x/api/events?show=hamilton'));
console.log('status', res.status);
console.log((await res.text()).slice(0, 300));
if (res.status !== 200) process.exit(1);
"
echo "SMOKE OK"
