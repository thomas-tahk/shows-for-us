# Build — running the fleet on one milestone

You are the coordinator. Workers write the code; you dispatch, review, merge into the milestone branch, and keep STATE.md current. You never sit idle waiting for him.

## Setup

1. Create the milestone branch from `main` (e.g. `m4-app-flow`), or from the previous unmerged milestone branch if this one builds on it. Push it.
2. Read the repo's `CLAUDE.md`, `DECISIONS.md` (if any) and the milestone's issues **with their comments**. A comment that redirects an issue overrides its body.
3. List the issues that are unblocked right now. That list is the queue.

## Fleet rules

- **At most 3 workers at once.** Start the next one only when one finishes.
- Don't pass `model` or `effort` when dispatching a specialist — its file sets them (builders: Sonnet, low/medium effort; `code-reviewer`: Opus, high effort), and a per-call value overrides the file. Exception: pass `model: "haiku"` for repetitive bulk work (data entry, text batches, one-file-per-item mapping). The main session (you) only plans and reviews, on Opus at medium effort or higher.
- Set `subagent_type` on every Agent call to the issue's specialist (`~/.claude/agents/`): `backend-engineer` (logic, APIs, engine), `frontend-engineer` (anything on screen), `database-engineer` (schema, migrations, queries), `qa-engineer` (done-check tests, bug repros, breaking a finished feature), `servicenow` (PDI work). Reviewers are always `code-reviewer`. A project specialist in the repo's `.claude/agents/` wins over the global role it narrows. An issue spanning layers goes to the specialist for its done check; `general-build-helper` only when none fits.
- Every worker gets `isolation: "worktree"` and its own branch off the milestone branch.
- Every dispatch prompt uses this brief, filled in, and nothing else (never this file):
  ```
  Goal: <the issue's intent — what is true afterwards> (issue: <url>)
  Done check: <the failing test to make pass, or the exact command / click path>
  Branch: <worker branch>, off <milestone branch>
  Start from: <the files and existing patterns to read first>
  Out of scope: <what not to touch, incl. neighbouring issues being built in parallel>
  Report back: what is now true, real test + done-check output, the mocked list, every guess you made
  ```
- A worker that stops on its turn cap (`maxTurns` in its agent file) without passing its done check counts as one retry.
- Worktrees share git refs. Workers never `git reset` or force-push `origin/*` refs, and never touch another worker's branch.
- Design for parallel work: when several issues would edit the same file, give each its own file (e.g. one file per batch, registered in an `init()`) instead of serializing them.

## Per issue

1. **Worker** builds it on its branch and makes the done check pass.
2. **Reviewer**: a fresh agent that did not write the code checks it against the issue (does it do what was asked) and the repo's standards. Fix what it raises.
3. **Quality gate** (below) passes → you merge the worker branch into the milestone branch, close the issue with a one-line summary, and dispatch the next unblocked issue.
4. Gate fails → the worker fixes and retries. **Two retries, then mark the issue stuck**: write in the issue what it was trying to make true, the real error, what was tried, and 2–3 options with your pick. Move on to other issues.

## The decision line

**Record for him** (a numbered decision in the milestone report, never a stop): anything a user sees — flow, visuals, wording, scope · anything that costs money or adds an outside service · hard-to-undo data or schema changes · auth and security · removing features or data.

For those, build your best guess anyway, and make it easy to change.

**Decide alone:** internal implementation, file layout, tests, refactors, choosing between equivalent libraries, fixing your own bugs.

Every interpretation you made either way goes in one line in `docs/questions/M<n>.md`:

```
#103 · bot keeps the 2-type limit unless its picks can't fill 20 · deckbuild does the same for humans
```

Stop the whole milestone only if **nothing** in the queue can proceed without him — then send one message with every blocker.

## Quality gate — all four, or the issue does not merge

1. **Build and tests pass.** Run them; keep the real output.
2. **The done check is exercised for real.** UI: drive it with Playwright against a locally started server and take a screenshot. CLI or API: run the actual command or request.
3. **The reviewer approves.**
4. **The mocked list is written:** everything still mocked, stubbed, or hardcoded on the done check's path. An empty list means look again.

## Milestone end

When every issue is merged or stuck:

1. Run the full test suite on the milestone branch.
2. Dispatch a fresh `qa-engineer` (not you, not a builder from this milestone) to exercise the **milestone's** done-gate end to end, the way he will (phone and desktop sizes for UI), and to try to break it. Its evidence goes in the report; anything it breaks is fixed or listed as known before you hand over.
3. Run a reviewer over the whole milestone diff, not just single issues.
4. Go to Review in `SKILL.md`.
