# Data sources research
_2026-10-25. Primary sources only; every claim cites a URL or a query I ran. "UNVERIFIED" = could not read the primary source._

## Bottom line
- **Only Wikidata + Wikipedia are clearly republishable at scale.** Wikidata is CC0; Wikipedia text is CC BY-SA 4.0 (attribute + share-alike on text we reuse).
- **Wikidata is rich for shows and creators, thin for productions and cast.** Production/cast history is the biggest gap vs. the vision. IBDB has it, but no license, no API, and its terms page was unreadable to me (Cloudflare 403).
- **Ticketmaster terms forbid caching Event Content beyond "reasonable periods"** and forbid deriving revenue. A static build of event data is therefore not safe; upcoming-performance data must be fetched live (or be non-Ticketmaster, manually curated).
- **The "Broadway API on GitHub" from the 2025 plan could not be found on GitHub.** Closest match is on Codeberg, closed-source, no hosted instance. Drop it.

## 1. Show, people, production history

### 1.1 Wikidata (SPARQL) — primary candidate
- License: structured data (main, Property, Lexeme, EntitySchema namespaces) is CC0; other namespaces CC BY-SA 4.0. https://www.wikidata.org/wiki/Wikidata:Licensing . No attribution required for CC0 data (still good practice).
- Access: SPARQL endpoint https://query.wikidata.org/sparql. Limits per the manual (https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual): 60 s query timeout; 60 s processing time per 60 s window per client (UA + IP); 30 failing queries/min; 5 parallel queries/IP; 429 + `Retry-After`; ignoring 429s risks a temp ban. Descriptive User-Agent required or you may be blocked (https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy : "contact info", include "bot").
- Fine for a build-time job: a few paged queries, nightly/weekly.

**Modelling findings (queries I ran 2026-10-25 against the live endpoint):**
- Musical class: `wd:Q58483083` "dramatico-musical work". (`wd:Q2743` "musical" returned 0 hits for Hamilton/Les Mis; items use the dramatico-musical class.) Label search for "Hamilton" without a class filter returns cities; always filter by class.
- Hamilton = `Q19320959`. Les Misérables = `Q830581` (original French 1980) and `Q111905785` (English 1985 "version, edition or translation" item). **One show can be several items** (per language/version) — needs merge logic.
- Hamilton item has: composer, lyricist, librettist, creator, choreographer (Andy Blankenbuehler), date/location of first performance (2015-02-17, The Public Theater), awards (Pulitzer, Tony Best Musical), based on, official website, duration, image (Commons), Wikipedia/Commons links, social handles, IBDB show ID P1219 (values 5340 and 499520 came back across the two sampled shows; per-show mapping not separated in my query), Playbill production ID `P5833` (e.g. `hamilton-richard-rodgers-theatre-vault-0000014104`), MusicBrainz IDs, Fandom IDs.
- Les Mis (Q830581) adds: ~30 `characters` values, awards (7), has-characteristic "sung-through", English version item with lyricists Herbert Kretzmer/James Fenton, premiere venue Barbican Centre 1985-09-28.
- **No cast (`P161`) and no productions linked from the Hamilton item.** Reverse lookup of items pointing at Hamilton found only: people with Hamilton as `notable work` (P800: Daveed Diggs, Taran Killam, Euan Morton…), a soundtrack, a category, a lighting designer link (Howell Binkley via P3919 "contributed to creative work"). No Broadway/West End production items.
- Corpus counts (SPARQL COUNT, 2026-10-25):

| Measure | Count |
|---|---|
| items of class dramatico-musical work | 14,369 |
| ...with en.wikipedia article | 5,940 |
| ...with composer (P86) | 4,007 |
| ...with librettist (P87) | 3,802 |
| ...with date of first performance (P1191) | 6,500 |
| ...with cast member (P161) | 693 |
| ...with IBDB show ID (P1219) | 1,263 |
| ...with Playbill production ID (P5833) | 105 |
| humans with IBDB person ID (P1220) | 25,102 |
| humans with Playbill person ID (P6132) | 1,480 |
| humans with BroadwayWorld person ID (P10895) | 1,033 |
| "theatrical production" items (Q7777570) | 17,578 (sample rows are German-language productions with no start/end dates) |
| items with IBDB venue ID (P1217) | 124 |

- Useful property IDs: P1219 IBDB show, P1218 IBDB production, P1220 IBDB person, P1217 IBDB venue, P5833 Playbill production, P6132 Playbill person, P10895 BroadwayWorld person, P86 composer, P87 librettist, P676 lyricist, P1191 first performance date, P4647 location of first performance, P161 cast member, P3300 musical conductor.
- Verdict: use as the **backbone for shows, creators, IDs, images, awards**. Because it carries IBDB/Playbill/BWW IDs, it also gives **outbound links** to those sites (linking is not copying). It will not give us production-by-production casts.

### 1.2 Wikipedia / MediaWiki
- License: text CC BY-SA 4.0 ("Text is available under the Creative Commons Attribution-ShareAlike 4.0 License; additional terms may apply"). https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License
- Obligations if we publish Wikipedia text (3(a)/(b) of the license): keep attribution + link to source + license link; indicate modifications; adapted text must be released under CC BY-SA 4.0 or compatible, no extra restrictions. Applies to **text we reuse (synopses, history)**, not to the whole site's code or CC0 Wikidata facts. Practical: per-article "Text from Wikipedia, CC BY-SA 4.0" footer with page link; keep reused text flagged so it is not mixed into proprietary content. Images on Commons carry per-file licenses (check each).
- API: `https://en.wikipedia.org/api/rest_v1/page/summary/<title>` works (I ran it for Hamilton (musical): returns `wikibase_item` Q19320959, thumbnail, extract). Etiquette: descriptive User-Agent, serial requests, cache, use GET (https://www.mediawiki.org/wiki/API:Etiquette).
- Structure: cast/production info is prose and tables. Not reliably machine-parseable. Use for **intro summary + history section links**, not as a data source for cast.
- Linkage: Wikidata sitelinks give article titles; summary API returns the Q-id, so joins are free.

### 1.3 IBDB (Internet Broadway Database)
- Owner: Broadway League research department (per search result summary of https://www.ibdb.com/About — not fetched directly).
- Coverage: deepest Broadway data (productions, opening casts, replacements, creatives, venues, staff). Wikidata links 1,263 shows / 25,102 people to it.
- API: none found. License for reuse: **UNVERIFIED** — https://www.ibdb.com/terms and https://www.broadway.org/info/terms-of-use both return Cloudflare 403 to curl and WebFetch. Search snippet says Broadway League terms bind users of "automated or otherwise" access, which implies scraping is restricted; treat as **no scraping, no republishing**.
- robots.txt (https://www.ibdb.com/robots.txt) only disallows a few path prefixes (`/grosses-production/`, `/broadway-production-more/`, etc.). robots.txt is not the ToS.
- Verdict: **link out via Wikidata IDs only** until a human reads the terms in a browser and/or the Broadway League grants a license. Factual data isn't copyrightable in the US per se, but a database taken in breach of ToS is a contract/unfair-competition risk. Not a legal opinion.

### 1.4 Playbill
- Playbill Vault production IDs exist in Wikidata (P5833). No public API found.
- robots.txt: `Content-Signal: search=yes, ai-train=no, use=reference`, and disallows ClaudeBot/GPTBot/anthropic-ai/etc. https://playbill.com/robots.txt . Express reservation of rights under EU DSM Art. 4.
- Terms of use: **UNVERIFIED** (my guesses at /terms, /terms-of-use returned 404; not located).
- Verdict: link-only.

### 1.5 BroadwayWorld
- robots.txt allows `/` with a list of disallowed paths incl. `/people/xml.php`, `/partner-data/`. https://www.broadwayworld.com/robots.txt . Terms pages guessed returned 403/404: **UNVERIFIED**. Has "partner data" and an XML people endpoint hinting at commercial feeds; no public API found.
- Verdict: link-only (BWW person IDs in Wikidata: 1,033).

### 1.6 "Broadway API" on GitHub (from docs/api-research.md)
- Cannot be located on GitHub: https://github.com/Broadway-API 404; web search found nothing on GitHub.
- Closest: https://codeberg.org/protostar/broadway-api_public — open data API for Broadway shows, theaters, rush/lottery; early dev; **code proprietary, not distributed; docs MIT; data "License TBD, likely Creative Commons"; no hosted instance ("Coming soon")**; data hand-entered. Not usable today.
- The 2025 doc's claims ("open source, unlimited, cast + songs + production history") are **refuted** for anything I can find.

### 1.7 Others
- Theatricalia (UK/Ireland production database): https://theatricalia.com/about returned 403. **UNVERIFIED**; skip for v1.
- MusicBrainz (CC0 core data, work/release-group IDs already in Wikidata): possible later for cast albums; not fetched this round.
- CORGIS "Broadway" dataset (Broadway League grosses 1990s–2016), only seen via search result; license **UNVERIFIED**; grosses are out of scope anyway.
- Commons category per show (Wikidata `Commons category`) for images, per-file license.
- Manual curation / owner-authored entries: unrestricted, and is the answer for production/cast depth on a small seed set (see §3).

## 2. Current/upcoming performances and ticket links

### 2.1 Ticketmaster Discovery API
- Limits: default 5,000 calls/day, 5 req/s; deep paging capped (size x page < 1000). https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- Fields: events (name, id, `url`, dates, venues, attractions, priceRanges, classifications, images...), attractions (name, id, url, externalLinks), venues (address, lat/long...). Same page.
- **Terms** (https://developer.ticketmaster.com/support/terms-of-use/, read verbatim):
  - "You shall not... Cache or store any Event Content other than for reasonable periods in order to provide the service you are providing." Event Content = event name, dates, times, venue name, additional info (tickets, attendees, orders).
  - "Remove from your application within 24 hours any Event Content ... that the owner asks you to remove."
  - Must disclose data collection in privacy policy/footer; must comply with ticketmaster.com ToU.
  - "You shall not... Use the Ticketmaster API for any application that replicates or attempts to replace the unique essential user experience of Ticketmaster.com"; "Sell, lease, or sublicense ... or derive revenues from the use or provision of the Ticketmaster API, whether for direct commercial or monetary gain or otherwise, except as set forth below"; they may rate-limit apps whose calls "are not primarily in response to direct user actions".
- Consequences: (a) **baking events into a static build is not clearly allowed** ("reasonable periods" is undefined; a nightly rebuild = ~1 day is arguable, a long-lived archive is not); (b) bulk crawling to precompute pages conflicts with the "direct user actions" language; (c) ads/monetization on pages displaying TM data risks the revenue clause (the "except as set forth below" refers to a section I did not find in what I read; **UNVERIFIED** affiliate carve-out); (d) per-session live fetch from the visitor's browser or a serverless function is the intended pattern. A browser fetch needs the API key exposed (it's a free key but terms may forbid sharing — UNVERIFIED); a tiny serverless proxy adds an always-on-ish component (not a database; no idle-pause).
- Affiliate: separate Impact-network program; sign-up per country; Discovery FAQ says approved partners can get a feed (hourly refresh, JSON/CSV). https://developer.ticketmaster.com/partners/distribution-partners/affiliate-sign-up and https://developer.ticketmaster.com/support/faq/ (surfaced by search; deep-link format, commission and feed caching terms **UNVERIFIED**). Partner (transactional) API is not public.
- I did not call the API (no key in this environment). Coverage for musicals/touring unverified; existing code (backend/src/services/ticketmaster.ts) is the thing to test.

### 2.2 SeatGeek
- Platform portal https://developer.seatgeek.com/ (redirect from platform.seatgeek.com) is JS-rendered; terms unreadable (**UNVERIFIED**). Unauthenticated API call returned 403. Needs client_id; assume approval + terms similar to TM; not studied further.

### 2.3 TodayTix / Broadway.com / Telecharge / Broadway Direct
- TodayTix Group has a partner ticketing API for suppliers and resellers (https://developers.todaytixgroup.com , https://todaytixgroup.com/distributors) — transactional/inventory, partner-gated. Affiliate: FMTC lists TodayTix as a merchant with deeplinking allowed (last updated May 2024, https://account.fmtc.co/cp/program_directory/details/m/31591); FlexOffers listing says $4–$12 per sale, 30-day cookie but also "not currently offering" — **treat as unconfirmed**.
- Broadway.com, Telecharge: no public API or affiliate program found. (Broadway Direct's terms bar scrapers/robots, esp. ticket inventory/pricing, per search snippet: https://broadwaydirect.com/terms/.)
- Verdict: **plain outbound links** (to the show's official page or the venue) need no license. Affiliate tagging optional later.

### 2.4 Official show sites
- Wikidata `official website` (P856) present for both sampled shows (hamiltonmusical.com, lesmis.com). Touring dates on these pages are the freshest/most authoritative and legally the cleanest thing to deep link; scraping them is per-site ToS (UNVERIFIED, none read). Recommended: link to official "tickets/tour" page; hand-maintain a small `productions.yaml` of current runs for the seed list.

## 3. Recommended v1 pipeline

**Principle:** static site; split data by legal status.

| Layer | Source | When | Stored in build? |
|---|---|---|---|
| Shows, creators, awards, images, external IDs | Wikidata SPARQL (CC0) | weekly CI job | Yes (JSON in repo or build artifact) |
| Show intro/history text | Wikipedia REST summary (+ link to full article) (CC BY-SA) | weekly with above | Yes, with attribution block and BY-SA notice on that text |
| Production/cast history | Hand-curated seed (owner-authored) for ~dozens of flagship shows; Wikidata `P161` where present (693 shows) | as edited | Yes |
| Outbound links to IBDB / Playbill / BWW | Wikidata IDs -> URLs | weekly | Yes (just URLs) |
| Ticket buy links | Show's official site (P856) + venue/box-office link, optionally TM `event.url` | — | Official links yes; TM links live only |
| Upcoming performances (TM) | Ticketmaster Discovery API | **live fetch** per page view (client-side or tiny serverless function with short-TTL cache, minutes–hours, not stored in repo) | **No** |
| Upcoming runs (non-TM) | Curated `runs.yaml` from official sites | rebuild on edit | Yes |

- Hosting: static host (GitHub Pages/Vercel/Cloudflare Pages). Search = client-side index (e.g. Pagefind/Lunr) built at build time. No DB; the existing Postgres/Express backend is not needed for v1. Optional serverless function only for the TM proxy (no idle pausing; cold starts are fine).
- Refresh: GitHub Actions cron weekly for Wikidata/Wikipedia (identify via descriptive UA; sequential; honor 429). Rebuild on push. Pages with live-fetched TM data must degrade to a "see official site" link if the call fails.
- What forces live fetch: Ticketmaster "reasonable periods" caching clause + "direct user actions" rate language. Cache window on the proxy should be short (suggest <= 1 hour until TM clarifies in writing; **choose with their reply**, I could not find a defined number).
- What forces curation: IBDB/Playbill/BWW terms unreadable or restrictive; no open production-level dataset exists.
- Legal checklist for build: CC0 attribution optional but credit Wikidata; BY-SA notice + link per Wikipedia-derived text; TM privacy/footer disclosure; no ads next to TM data until the revenue clause is clarified; do not embed IBDB/Playbill/BWW content.
- Open questions needing the owner: (1) is curated-by-hand cast/production depth acceptable for v1 or does the vision need IBDB-scale data (needs a license ask to the Broadway League); (2) monetization plans (affects TM clause); (3) will he ask Ticketmaster support to define "reasonable periods".

## 4. Next verification steps (cheap)
1. Get a TM API key; run Hamilton/Les Mis/touring-musical queries; measure coverage and see whether `attractions` map to shows. (Existing backend already has the integration.)
2. Read IBDB/Broadway League and Playbill/BWW terms in a normal browser; paste clauses into this file.
3. Check TM FAQ (https://developer.ticketmaster.com/support/faq/) for the "except as set forth below" revenue exception and affiliate feed caching rules.
