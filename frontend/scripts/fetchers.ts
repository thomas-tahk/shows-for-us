import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { FixtureMissing, USER_AGENT, type Fetcher } from './pull-lib.ts'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Live fetcher: descriptive UA, strictly sequential (>= 1s apart), honours 429 + Retry-After. */
export function liveFetcher(minGapMs = 1000, maxRetries = 5): Fetcher {
  let last = 0
  return async (req) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const wait = last + minGapMs - Date.now()
      if (wait > 0) await sleep(wait)
      const res = await fetch(req.url, { headers: { 'User-Agent': USER_AGENT, Accept: req.accept } })
      last = Date.now()
      if (res.status === 429 || res.status === 503) {
        const ra = Number(res.headers.get('retry-after'))
        await sleep((Number.isFinite(ra) && ra > 0 ? ra : 60) * 1000)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${req.url.slice(0, 120)}`)
      return res.json()
    }
    throw new Error(`gave up after ${maxRetries} retries (429/503): ${req.url.slice(0, 120)}`)
  }
}

/** Replays fixtures/<path>; throws FixtureMissing when absent. Never touches the network. */
export function offlineFetcher(fixturesDir: string): Fetcher {
  return async (req) => {
    try {
      return JSON.parse(await readFile(join(fixturesDir, req.path), 'utf8'))
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new FixtureMissing(req.path)
      throw e
    }
  }
}

/** Wraps another fetcher and saves every raw response under fixtures/<path>. */
export function recordingFetcher(inner: Fetcher, fixturesDir: string): Fetcher {
  return async (req) => {
    const body = await inner(req)
    const file = join(fixturesDir, req.path)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(body, null, 2) + '\n')
    return body
  }
}
