# Curated show write-ups

One file per flagship: `content/shows/<slug>.yaml`. The slug must match `data/flagships.json`. Schema and validator: `src/data/writeup.ts` (`parseWriteup`). Pages read these files through `src/data/loadWriteups.ts` (`getWriteup(slug)`). `npm test` validates all of them.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `slug`, `title` | yes | Match `flagships.json`. |
| `status` | yes | `awaiting-owner-check` or `owner-checked`. See below. |
| `sources_opened` | yes (boolean) | `false` = the cited URLs were not opened when drafting. See below. |
| `creators[]` | yes (may be empty) | `name`, `role`, `source`. |
| `history[]` | yes, 2 to 4 | `text` (own words, short paragraph), `source`. Each paragraph has its own source. |
| `original_cast[]` | yes (may be empty) | `person`, `role`, `production?` (e.g. "Broadway 2015"), `source`. |
| `productions[]` | yes (may be empty) | `name`, `venue`, `city`, `opened?` (`YYYY`, `YYYY-MM` or `YYYY-MM-DD`), `note?`, `source`. |
| `awards[]` | yes (may be empty) | `name`, `year`, `source`. |
| `runs[]` | yes (may be empty) | Current or announced productions: `name`, `venue`, `city`, `start?`, `end?`, `ticket_url`, `source`, `checked` (`YYYY-MM-DD`). |
| `tickets` | no | `{ official_url, source }`: the show's official website. Omit if unsure. |

Every fact carries a `source` http(s) URL. A fact without one fails validation and is cut, not guessed.

## License rules

- Write in your own words. Do not paste or lightly reword text from Wikipedia. If you ever quote it, mark it as a quotation and keep the CC BY-SA 4.0 attribution (`source_url`, `license`, `modified`).
- IBDB, Playbill and BroadwayWorld: never copy their text, cast lists or tables, and never use them as a `source`. They are linked only, through Wikidata IDs, by the pull script.
- Sources should be the show's Wikipedia article, another page you actually opened, or the official site.
- Ticketmaster event data never goes in these files. `runs` come from the show's official site only; if the site lists no run, leave it out.
- Images come from Commons only (handled by the pull, not here).

## `status` and `sources_opened`

- `status: awaiting-owner-check` is set on every drafted file. Only the owner changes it, to `owner-checked`, after reading the file against its sources.
- `sources_opened: false` means the drafter wrote from memory and did not open the cited URLs. All 15 initial files are in this state. `runs: []` everywhere for the same reason: official sites could not be read, so Ticketmaster live dates cover "playing next" until runs are added.

## How the owner flips them

1. Open each `source` URL for the file and check every fact. Correct it or delete it. Add facts you can source.
2. Add `runs` from the official site, with `checked:` today's date.
3. When satisfied, set `sources_opened: true` and `status: owner-checked`.
4. Run `npm test` (from `frontend/`) and commit.
