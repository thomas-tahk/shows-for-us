import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CatalogIndex, CatalogShow } from '../src/data/catalogShow.ts'
import type { Flagship } from '../src/data/show.ts'
import { buildIndex, groupShards, pullCatalog } from './catalog-lib.ts'
import type { Fetcher } from './pull-lib.ts'

export const SHRINK_FLOOR = 0.9

export interface RunOptions {
  fetcher: Fetcher
  flagships: Flagship[]
  outDir: string
  mode: CatalogIndex['meta']['mode']
  now: () => string
  log: (msg: string) => void
  /** Skip the 90% shrink guard (one-off, e.g. after narrowing the listing query). */
  allowShrink?: boolean
}

async function committedMeta(outDir: string): Promise<Partial<CatalogIndex['meta']> | null> {
  try {
    return (JSON.parse(await readFile(join(outDir, 'index.json'), 'utf8')) as CatalogIndex).meta
  } catch {
    return null
  }
}

/** Fixture data must never replace a real catalogue. */
async function offlineProblem(o: RunOptions): Promise<string | null> {
  if (o.mode !== 'offline-fixtures') return null
  if (!(await committedMeta(o.outDir))?.live) return null
  return `refusing offline run: ${o.outDir}/index.json is live data; fixtures would replace it. Nothing written`
}

/** Message if this run must not overwrite the committed catalogue, else null. Offline runs are exempt. */
async function shrinkProblem(o: RunOptions, count: number): Promise<string | null> {
  if (o.mode === 'offline-fixtures') return null
  if (o.allowShrink) {
    o.log('--allow-shrink: shrink guard skipped')
    return null
  }
  const before = (await committedMeta(o.outDir))?.count
  if (typeof before !== 'number' || count >= before * SHRINK_FLOOR) return null
  return `shrink guard: this run found ${count} shows, under 90% of the ${before} in ${o.outDir}/index.json; nothing written`
}

const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n'

async function writeCatalog(o: RunOptions, shows: CatalogShow[]): Promise<void> {
  const shardDir = join(o.outDir, 'shows')
  await mkdir(shardDir, { recursive: true })
  const live = o.mode !== 'offline-fixtures'
  const shards = groupShards(shows, live)
  for (const [key, shard] of shards) await writeFile(join(shardDir, `${key}.json`), json(shard))
  for (const f of await readdir(shardDir)) {
    if (/^\d{3}\.json$/.test(f) && !shards.has(f.slice(0, 3))) await rm(join(shardDir, f))
  }
  const meta = { generated_at: o.now(), mode: o.mode, live, count: shows.length }
  await writeFile(join(o.outDir, 'index.json'), json({ meta, shows: buildIndex(shows) }))
}

/** Pull, check, then write. Returns the process exit code; writes nothing unless every request succeeded. */
export async function runCatalog(o: RunOptions): Promise<number> {
  const refused = await offlineProblem(o)
  if (refused) {
    o.log(refused)
    return 1
  }
  let shows: CatalogShow[]
  try {
    shows = await pullCatalog(o.flagships, o.fetcher, { log: o.log })
  } catch (e) {
    o.log(`FAILED: ${(e as Error).message}; nothing written`)
    return 1
  }
  const problem = await shrinkProblem(o, shows.length)
  if (problem) {
    o.log(problem)
    return 1
  }
  await writeCatalog(o, shows)
  o.log(`wrote ${o.outDir}: ${shows.length} shows, mode ${o.mode}`)
  return 0
}
