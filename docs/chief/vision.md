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

## Depth decision (2026-10-25)
v1 hand-curates ~10–20 flagship shows in depth (agents draft from Wikipedia/Wikidata, owner spot-checks); every other show links out to IBDB via Wikidata IDs.

## Done-gate (confirmed 2026-10-25)
I search a musical I love, read its history and who wrote it and starred in it, see where it's playing next, and click through to buy tickets.

## Assumptions
- **Assumption (PARTLY VERIFIED 2026-10-25):** show history and people data can be sourced legally and at scale (Wikipedia/Wikidata, IBDB, Broadway APIs, etc.). Shows/creators/IDs: verified via Wikidata CC0 + Wikipedia CC BY-SA (14,369 musicals). Production + cast history at scale: refuted, Wikidata has cast on 693 shows and no production items for Hamilton; IBDB/Playbill/BWW have no API and terms unread or restrictive; the "Broadway API" is not on GitHub (Codeberg, closed code). Evidence: docs/chief/research/data-sources.md sections 1.1 to 1.6.
- **Assumption (PARTLY VERIFIED):** current and upcoming performances are available from Ticketmaster Discovery or similar, with ticket links allowed. API exists (5,000 calls/day, 5/s) and returns event URLs, but musical/touring coverage untested (no key) and terms bar caching Event Content beyond "reasonable periods". SeatGeek terms unreadable. Evidence: docs/chief/research/data-sources.md section 2.
- **Assumption (VERIFIED for show/people data; REFUTED for ticketing data):** static build works for Wikidata/Wikipedia/curated data. Ticketmaster event data must be fetched live (short-TTL), not baked into the build. Evidence: docs/chief/research/data-sources.md sections 2.1 and 3.
- **Assumption (VERIFIED, low risk):** start with musicals, widen later. Wikidata class dramatico-musical work (Q58483083) is queryable and broader theatre classes exist in the same graph; not studied beyond musicals. Evidence: docs/chief/research/data-sources.md section 1.1.
- **Assumption (STILL OPEN, leaning refuted for the backend):** v1 pipeline needs no Express/Postgres; React pages and the Ticketmaster client may be mined for the live-fetch piece. Not assessed against code this round. See docs/chief/research/data-sources.md section 3.
