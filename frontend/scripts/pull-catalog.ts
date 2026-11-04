// Usage (from frontend/):
//   npm run pull:catalog                 live: Wikidata SPARQL + Wikipedia API
//   npm run pull:catalog -- --record     live, and save every raw response to fixtures/
//   npm run pull:catalog -- --offline    replay fixtures/catalog/, no network
//   npm run pull:catalog -- --allow-shrink  one-off: skip the 90% shrink guard (logged)
// Exit code 1 (and nothing written) on any failed request, if the catalogue shrank by > 10%,
// or if --offline would overwrite a live catalogue.
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Flagship } from '../src/data/show.ts'
import { runCatalog } from './catalog-run.ts'
import { liveFetcher, offlineFetcher, recordingFetcher } from './fetchers.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const offline = args.includes('--offline')
const record = args.includes('--record')
const allowShrink = args.includes('--allow-shrink')
if (offline && record) throw new Error('--offline and --record are mutually exclusive')

const fixturesDir = join(root, 'fixtures')
// 65s per request: slightly over the 60s SPARQL server timeout.
const live = () => liveFetcher(1000, 5, 65_000)
const fetcher = offline ? offlineFetcher(fixturesDir) : record ? recordingFetcher(live(), fixturesDir) : live()

process.exitCode = await runCatalog({
  fetcher,
  flagships: JSON.parse(await readFile(join(root, 'data/flagships.json'), 'utf8')) as Flagship[],
  outDir: join(root, 'public/catalog'),
  mode: offline ? 'offline-fixtures' : record ? 'recorded-live' : 'live',
  now: () => new Date().toISOString(),
  log: (m) => console.log(m),
  allowShrink,
})
