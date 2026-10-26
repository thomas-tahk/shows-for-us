# Cloud — running a build with his computer off

You are in a cloud session if `~/.claude/skills/chief` does not exist (this skill loaded from the repo's `.claude/skills/chief`). His `~/.claude` — global `CLAUDE.md`, user skills, user agents — is not here; the specialists in `.claude/agents/` are. Follow `build.md` with these changes.

## Scope

Cloud runs **Build** (and fix-Builds after Review) only. If `docs/chief/STATE.md` says Shape, Research or Plan, or the plan isn't approved, stop: write in STATE.md that the next phase needs him at his Mac, and end.

Run until the milestone ends or nothing in the queue can proceed without him. Then do Review's write-up (report, scorecard row, PR), update STATE.md, push, and stop.

## Workers stay in your turn

The session can be reclaimed when it looks idle, and background agents die with it. So never end your turn while work remains: dispatch up to 3 workers as **parallel Agent calls in one message, without `run_in_background`**, wait for all of them, merge, dispatch the next batch.

## GitHub: `gh api`, never `gh issue` / `gh pr`

The cloud's GitHub proxy blocks GraphQL, so `gh issue …` and `gh pr …` fail. Use the REST API (`gh` picks up auth itself):

| Need | Command |
|---|---|
| List milestone issues | `gh api "repos/{owner}/{repo}/issues?milestone=<n>&state=open&per_page=100"` |
| Issue + comments | `gh api repos/{owner}/{repo}/issues/<n>` and `…/issues/<n>/comments` |
| Comment | `gh api repos/{owner}/{repo}/issues/<n>/comments -f body='…'` |
| Close | `gh api -X PATCH repos/{owner}/{repo}/issues/<n> -f state=closed` |
| Open the milestone PR | `gh api repos/{owner}/{repo}/pulls -f title='…' -f head=<branch> -f base=<base> -f body='…'` |
| List PRs | `gh api "repos/{owner}/{repo}/pulls?state=open"` |

`{owner}/{repo}` is filled in by `gh` from the git remote.

## Main is his

The cloud lets a session push to any branch, `main` included. Never push to, merge into, or reset `main`. The milestone PR is the hand-off; he merges.

## Browser checks

If Playwright's browser is missing, run `npx playwright install --with-deps chromium`. If the download is blocked, do not fake the UI gate: mark that done check "not exercised — cloud couldn't install the browser" in the report and the mocked list, and keep building.
