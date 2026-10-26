# Deploying Shows For Us

These steps are for the repo owner. Nothing here is automated.

1. **Connect Vercel to this repo.** In Vercel, import the GitHub repo. Set Root Directory to `frontend/` and Framework Preset to Vite. `frontend/vercel.json` already handles the SPA fallback and keeps `/api/*` out of it.
2. **Add the Ticketmaster key.** Project Settings > Environment Variables: add `TICKETMASTER_API_KEY` for both Production and Preview.
3. **Let Actions open PRs.** GitHub repo Settings > Actions > General > Workflow permissions: tick "Allow GitHub Actions to create and approve pull requests". The weekly refresh needs this.
4. **Run the refresh once by hand after merge.** Actions tab > "Refresh data" > Run workflow. It runs `npm run pull` in `frontend/` and opens a `data-refresh` PR only if `frontend/data/` changed. It also runs weekly, Mondays 06:17 UTC. Merging that PR redeploys the site.
5. **Check the site.** Open `/`, a deep link such as `/show/hamilton` (should load the app), and `/api/events?show=hamilton` (should return JSON). An unknown `/api/foo` should 404.

The footer carries the Wikidata, Wikipedia (CC BY-SA 4.0) and Ticketmaster notices. Keep it on every page.
