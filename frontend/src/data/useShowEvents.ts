import { useEffect, useState } from 'react'
import type { ShowEvent } from './events'

export type EventsState = 'loading' | 'ok' | 'unavailable'
interface Result {
  slug: string
  state: EventsState
  events: ShowEvent[]
}

/** Fetches live Ticketmaster dates for a show. Any failure (non-2xx, bad JSON, `reason`) is "unavailable". */
export function useShowEvents(slug: string): Result {
  const [result, setResult] = useState<Result>({ slug, state: 'loading', events: [] })

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/events?show=${encodeURIComponent(slug)}`, { signal: ctrl.signal })
      .then(async res => {
        if (!res.ok) throw new Error(`events ${res.status}`)
        const body: unknown = await res.json()
        const b = body as { events?: unknown; reason?: unknown } | null
        if (!b || !Array.isArray(b.events) || b.reason !== undefined) throw new Error('unavailable')
        setResult({ slug, state: 'ok', events: b.events as ShowEvent[] })
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ slug, state: 'unavailable', events: [] })
      })
    return () => ctrl.abort()
  }, [slug])

  // Navigating between shows: don't flash the previous show's dates.
  return result.slug === slug ? result : { slug, state: 'loading', events: [] }
}
