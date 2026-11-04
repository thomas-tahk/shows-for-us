import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCatalogIndex, resetCatalogIndexCache } from './catalogIndexCache'

const index = { meta: { live: true }, shows: [] }
const ok = () => new Response(JSON.stringify(index), { status: 200 })

beforeEach(resetCatalogIndexCache)
afterEach(() => vi.unstubAllGlobals())

describe('loadCatalogIndex', () => {
  it('fetches once for concurrent and later callers', async () => {
    const fetchMock = vi.fn(async () => ok())
    vi.stubGlobal('fetch', fetchMock)
    const [a, b] = await Promise.all([loadCatalogIndex(), loadCatalogIndex()])
    await loadCatalogIndex()
    expect(a).toBe(b)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('forgets a failure so the next call refetches', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('no', { status: 500 })).mockResolvedValue(ok())
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadCatalogIndex()).rejects.toThrow('HTTP 500')
    await expect(loadCatalogIndex()).resolves.toEqual(index)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects an index without a shows array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    await expect(loadCatalogIndex()).rejects.toThrow('bad index')
  })
})
