import { useCallback, useEffect, useState } from 'react'
import { shardUrl, type CatalogShard, type CatalogShow } from './catalogShow'

/**
 * The record for a slug, or null when there is none. A missing shard file is null too:
 * the host's SPA fallback answers it with index.html (200, text/html), or a plain 404.
 * Network failures, other non-2xx responses and malformed JSON throw.
 */
export async function fetchCatalogShow(slug: string, signal?: AbortSignal): Promise<CatalogShowResult | null> {
  const res = await fetch(shardUrl(slug), { signal })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`shard ${res.status}`)
  if (res.headers.get('content-type')?.includes('text/html')) return null
  const shard = (await res.json()) as Partial<CatalogShard>
  const shows = shard.shows ?? {}
  if (!Object.hasOwn(shows, slug)) return null
  // Shards written before `live` existed are live data.
  return { show: shows[slug], live: shard.live !== false }
}

export interface CatalogShowResult {
  show: CatalogShow
  /** false = built from test fixtures (show the sample-data note). */
  live: boolean
}

export type CatalogShowState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ok'; show: CatalogShow; live: boolean }

interface Keyed {
  key: string
  state: CatalogShowState
}

export function useCatalogShow(slug: string): { state: CatalogShowState; retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const key = `${slug}#${attempt}`
  const [result, setResult] = useState<Keyed>({ key, state: { status: 'loading' } })

  useEffect(() => {
    const ctrl = new AbortController()
    fetchCatalogShow(slug, ctrl.signal)
      .then(found => setResult({ key, state: found ? { status: 'ok', ...found } : { status: 'missing' } }))
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
