import { CATALOG_INDEX_URL, type CatalogIndex } from './catalogShow'

let pending: Promise<CatalogIndex> | null = null

async function fetchIndex(): Promise<CatalogIndex> {
  const res = await fetch(CATALOG_INDEX_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const index = (await res.json()) as CatalogIndex
  if (!Array.isArray(index.shows)) throw new Error('bad index')
  return index
}

/** The catalogue index, fetched once and shared by search and the catalogue page. A failure is forgotten so the next call refetches. */
export function loadCatalogIndex(): Promise<CatalogIndex> {
  if (pending) return pending
  const attempt = fetchIndex()
  pending = attempt
  attempt.catch(() => {
    if (pending === attempt) pending = null
  })
  return attempt
}

/** For tests: forget the cached index. */
export function resetCatalogIndexCache(): void {
  pending = null
}
