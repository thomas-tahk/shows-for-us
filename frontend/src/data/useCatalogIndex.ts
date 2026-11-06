import { useCallback, useState } from 'react'
import { loadCatalogIndex } from './catalogIndexCache'
import type { SearchableEntry } from './search'

export type CatalogLoadState = 'idle' | 'loading' | 'ready' | 'failed'

/** Loads the full catalogue index on demand. */
export function useCatalogIndex() {
  const [state, setState] = useState<CatalogLoadState>('idle')
  const [entries, setEntries] = useState<SearchableEntry[]>([])

  const start = useCallback(() => {
    setState('loading')
    loadCatalogIndex()
      .then(index => {
        setEntries(index.shows)
        setState('ready')
      })
      .catch(() => setState('failed'))
  }, [])

  /** First use only (e.g. a keystroke): never retries a failure. */
  const load = useCallback(() => {
    if (state === 'idle') start()
  }, [state, start])

  /** Search box focus: also retries after a failure. */
  const loadOrRetry = useCallback(() => {
    if (state === 'idle' || state === 'failed') start()
  }, [state, start])

  return { entries, state, load, loadOrRetry }
}
