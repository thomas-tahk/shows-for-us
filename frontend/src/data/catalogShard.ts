import { useCallback, useEffect, useState } from 'react'
import { loadCatalogIndex } from './catalogIndexCache'
import { shardUrl, type CatalogShard, type CatalogShow } from './catalogShow'

/**
 * The record for a slug, or null when there is none. A missing shard file is null too:
 * the host's SPA fallback answers it with index.html (200, text/html), or a plain 404.
 * Network failures, other non-2xx responses and malformed JSON throw.
 */
export async function fetchCatalogShow(slug: string, signal?: AbortSignal): Promise<CatalogShow | null> {
  const res = await fetch(shardUrl(slug), { signal })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`shard ${res.status}`)
  // A missing shard file is answered by the SPA fallback (index.html).
  if (res.headers.get('content-type')?.includes('text/html')) return null
  const shard = (await res.json()) as CatalogShard
  const shows = shard.shows ?? {}
  return Object.hasOwn(shows, slug) ? shows[slug] : null
}

/** meta.live of the index; undefined when it can't be read (the sample-data note is then skipped). */
export async function fetchCatalogLive(): Promise<boolean | undefined> {
  try {
    return (await loadCatalogIndex()).meta.live
  } catch {
    return undefined
  }
}

export type CatalogShowState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ok'; show: CatalogShow }

interface Keyed {
  key: string
  state: CatalogShowState
}

/** meta.live of the index, fetched in the background: undefined until it resolves (or if it can't be read). */
export function useCatalogLive(): boolean | undefined {
  const [live, setLive] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    let active = true
    void fetchCatalogLive().then(v => active && setLive(v))
    return () => {
      active = false
    }
  }, [])
  return live
}

export function useCatalogShow(slug: string): { state: CatalogShowState; retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const key = `${slug}#${attempt}`
  const [result, setResult] = useState<Keyed>({ key, state: { status: 'loading' } })

  useEffect(() => {
    const ctrl = new AbortController()
    fetchCatalogShow(slug, ctrl.signal)
      .then(show => setResult({ key, state: show ? { status: 'ok', show } : { status: 'missing' } }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ key, state: { status: 'error' } })
      })
    return () => ctrl.abort()
  }, [slug, key])

  const retry = useCallback(() => setAttempt(a => a + 1), [])
  // Navigating or retrying: show loading, never the previous result.
  return { state: result.key === key ? result.state : { status: 'loading' }, retry }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "1927" | "1927-12" | "1927-12-27" -> "1927" | "December 1927" | "27 December 1927". Unparseable input is returned as is. */
export function formatPremiereDate(date: string): string {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(date)
  if (!m) return date
  const [, year, month, day] = m
  if (!month) return year
  const name = MONTHS[Number(month) - 1]
  if (!name) return date
  return day ? `${Number(day)} ${name} ${year}` : `${name} ${year}`
}
