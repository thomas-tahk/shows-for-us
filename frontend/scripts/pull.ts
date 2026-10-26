// Usage (from frontend/):
//   npm run pull                 live: Wikidata + Wikipedia + Commons
//   npm run pull -- --record     live, and save every raw response to fixtures/
//   npm run pull -- --offline    replay fixtures/, no network
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Flagship, ShowsFile } from '../src/data/show.ts'
import { liveFetcher, offlineFetcher, recordingFetcher } from './fetchers.ts'
import { pullShows } from './pull-lib.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const offline = args.includes('--offline')
const record = args.includes('--record')
if (offline && record) throw new Error('--offline and --record are mutually exclusive')

const fixturesDir = join(root, 'fixtures')
const fetcher = offline
  ? offlineFetcher(fixturesDir)
  : record
    ? recordingFetcher(liveFetcher(), fixturesDir)
    : liveFetcher()

const flagships = JSON.parse(await readFile(join(root, 'data/flagships.json'), 'utf8')) as Flagship[]
const { shows, skipped } = await pullShows(flagships, fetcher, (m) => console.log(m))

const out: ShowsFile = {
  meta: {
    generated_at: new Date().toISOString(),
    mode: offline ? 'offline-fixtures' : record ? 'recorded-live' : 'live',
    live: !offline,
    skipped: skipped.map((s) => s.slug),
  },
  shows,
}
const failed = skipped.some((s) => s.reason.startsWith('FAILED'))
// A run with failures must not clobber the committed data.
const target = failed ? 'data/shows.partial.json' : 'data/shows.json'
await writeFile(join(root, target), JSON.stringify(out, null, 2) + '\n')
console.log(`\nwrote ${target}: ${shows.length} shows, ${skipped.length} skipped`)
for (const s of skipped) console.log(`  ${s.reason.startsWith('FAILED') ? 'FAILED ' : ''}${s.slug}: ${s.reason}`)
if (failed) process.exitCode = 1
