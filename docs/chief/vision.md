# Shows For Us — Vision
_Shape round 1, 2026-10-25_

## Intent
A public wiki for musicals and the performing arts: each show's history, the people who made and performed it, what's playing now and soon, and where to go buy tickets.

## Goals
- Browse and search shows, productions, and people (creators, production team, cast).
- See current and upcoming productions/performances.
- Link out to wherever tickets are sold. The site never sells tickets.
- Public, no accounts in the first version.

## Non-goals (for now)
- Ticket sales or checkout.
- Accounts, favorites, personalized feed, proximity alerts (the 2025 tracker plan). Possible later layer.
- Reviews.

## Done-gate (draft, unconfirmed)
I search a musical I love, read its history and who wrote it and starred in it, see where it's playing next, and click through to buy tickets.

## Assumptions
- **Assumption:** show history and people data can be sourced legally and at scale (Wikipedia/Wikidata, IBDB, Broadway APIs, etc.).
- **Assumption:** current and upcoming performances are available from Ticketmaster Discovery or similar, with ticket links allowed.
- **Assumption:** the wiki can be mostly static, built from data at build time, with a periodic refresh, so no always-on backend or pausing free tier.
- **Assumption:** start with musicals, widen to other performing arts later.
- **Assumption:** the existing Express API, schema and React pages are worth keeping or mining.
