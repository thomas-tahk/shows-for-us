# Deploying Shows For Us

These steps are for the repo owner. Nothing here is automated.

1. **Connect Vercel to this repo.** In Vercel, import the GitHub repo. Set Root Directory to `frontend/` and Framework Preset to Vite. `frontend/vercel.json` already handles the SPA fallback and keeps `/api/*` out of it.
2. **Add the Ticketmaster key.** Project Settings > Environment Variables: add `TICKETMASTER_API_KEY` for both Production and Preview. You can also add it on the import screen in step 1. Environment variables apply to new deployments only, so if you add the key after the first deploy, redeploy (Deployments > the latest > Redeploy).
3. **Let Actions open PRs.** GitHub repo Settings > Actions > General > Workflow permissions: tick "Allow GitHub Actions to create and approve pull requests". The weekly refresh needs this.
4. **Run the refresh once by hand after merge.** This is the first live pull of real Wikidata/Wikipedia data. Actions tab > "Refresh data" > Run workflow. It runs `npm run pull` in `frontend/` and opens a `data-refresh` PR only if `frontend/data/` changed. It also runs weekly, Mondays 06:17 UTC. Merging that PR redeploys the site.
   - To do the same locally, run plain `npm run pull` in `frontend/`. Never `npm run pull -- --record`: it overwrites the hand-built test fixtures in `frontend/fixtures/` and breaks `tests/pull.test.ts`.
   - Run it manually from the default branch only; the PR targets the branch the run is on.
   - Refresh PRs are opened with `GITHUB_TOKEN`, so GitHub runs no CI checks on them. The workflow runs typecheck, tests and build itself before opening the PR.
   - A failed refresh looks like a red run in the Actions tab, no PR, and the committed data untouched. Open the run log to see which show failed.
   - GitHub disables scheduled workflows after 60 days without repo activity. If the weekly run stops, re-enable it in the Actions tab.
   - A refresh that changes only `generated_at` opens no PR.
5. **Check the site.** Open `/`, a deep link such as `/show/hamilton` (should load the app), and `/api/events?show=hamilton` (should return JSON). An unknown `/api/foo` should 404, and so should `/api/events?show=made-up-show` (only the 15 flagship slugs are searched). After the first live pull, also click the IBDB link on `/show/hamilton` and check it opens the Hamilton show page on ibdb.com: the IBDB URL pattern is unverified (see `frontend/fixtures/README.md`).

The footer carries the Wikidata, Wikipedia (CC BY-SA 4.0) and Ticketmaster notices. Keep it on every page.
