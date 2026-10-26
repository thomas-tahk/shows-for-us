# Milestone report — `docs/milestones/M<n>.md`

He reads this before he plays the milestone. Write it for him: plain English, a thing's name before its number, every PR, issue, and commit linked. Sections in this order:

```markdown
# Milestone <n>: <what it is, in a few words>

**Done-gate:** "<the sentence from the plan>"

**Status:** <passes / partly passes — in what conditions; whether he has tried it yet>

- <evidence: what the gate run actually did, at which screen sizes, with numbers>
- Tests at the head: <what ran and passed>

**Scorecard so far:** [`docs/chief/scorecard.md`](../chief/scorecard.md) — first-pass reviews <x/y>, merged/planned <x/y> (stuck <k>); escaped bugs and guesses kept get filled in after he plays it.

## How to try it
<the URL or command, then the exact steps>

Watch for:
- <the things that changed, where to look>

## What was built (<k> issues, branch `<branch>`)
| Issue | Built |
|---|---|
| [#<n>](<url>) <name> | <one line> |

**Fixed along the way:** <bugs found and fixed, each with its commit link>

**Known, not fixed:** <gaps, with why>

**Stuck:** <issues that hit two retries, linked, or "none">

## Decisions that need you (most important first)
1. **<question>** <what I built in the meantime, and the alternative.>
…
<last item: merge order, if milestone branches are chained>

Every other interpretation is in [`docs/questions/M<n>.md`](../questions/M<n>.md).
```

Test it before sending: could he play the milestone and answer every decision with only this page and the PR open? If he would have to ask "what does that mean" or "where is that", fix the page.
