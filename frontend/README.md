# Shows For Us

A site about touring and Broadway musicals: for each of 15 flagship shows, who made it, the original cast, productions and awards, and where to get tickets. Facts come from Wikidata and Wikipedia plus hand-checked write-ups; "Playing next" dates come live from Ticketmaster through a Vercel function.

## Commands

Run from this directory (`frontend/`).

- `npm run dev` start the Vite dev server
- `npm test` unit tests (vitest), including the content schema check
- `npm run e2e` Playwright tests against a production build
- `npm run pull` fetch Wikidata/Wikipedia data into `data/shows.json` (live; do not use `-- --record`, see `fixtures/README.md`)
- `npm run typecheck`, `npm run lint`, `npm run build`

## Layout

- `src/` the React app
- `api/` the Vercel function `/api/events` (Ticketmaster dates)
- `scripts/` the data pull (`pull.ts`) and `smoke-vercel.sh`
- `data/` generated `shows.json` and the `flagships.json` list
- `content/` hand-written show write-ups (YAML) and their schema, see `content/README.md`
- `fixtures/` hand-built test fixtures, see `fixtures/README.md`

Deploying and the first data pull: see `../docs/deploy.md`.
