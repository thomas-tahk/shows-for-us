import { useCallback, useState } from 'react'
import { CATALOG_INDEX_URL, type CatalogIndex } from './catalogShow'
import type { SearchableEntry } from './search'

export type CatalogLoadState = 'idle' | 'loading' | 'ready' | 'failed'

/** Fetches the full catalogue index once, when `load` is first called. */
export function useCatalogIndex() {
  const [state, setState] = useState<CatalogLoadState>('idle')
  const [entries, setEntries] = useState<SearchableEntry[]>([])

  const load = useCallback(() => {
    if (state !== 'idle' && state !== 'failed') return
    setState('loading')
    fetch(CATALOG_INDEX_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<CatalogIndex>
      })
      .then(index => {
        if (!Array.isArray(index.shows)) throw new Error('bad index')
        setEntries(index.shows)
        setState('ready')
      })
      .catch(() => setState('failed'))
  }, [state])

  return { entries, state, load }
}
