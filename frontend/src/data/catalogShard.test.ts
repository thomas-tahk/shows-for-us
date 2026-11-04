import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCatalogShow } from './catalogShard'

function respond(body: string, init: { status?: number; type?: string } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(body, { status: init.status ?? 200, headers: { 'content-type': init.type ?? 'application/json' } })),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchCatalogShow', () => {
  it('returns the record with the shard live flag', async () => {
    respond('{"live":false,"shows":{"a":{"slug":"a"}}}')
    expect(await fetchCatalogShow('a')).toEqual({ show: { slug: 'a' }, live: false })
  })

  it('treats a shard without live as live', async () => {
    respond('{"shows":{"a":{"slug":"a"}}}')
    expect(await fetchCatalogShow('a')).toEqual({ show: { slug: 'a' }, live: true })
  })

  it('treats prototype names as missing', async () => {
    respond('{"shows":{}}')
    expect(await fetchCatalogShow('constructor')).toBeNull()
    expect(await fetchCatalogShow('__proto__')).toBeNull()
  })

  it('treats a 404 and the SPA html fallback as missing', async () => {
    respond('nope', { status: 404 })
    expect(await fetchCatalogShow('a')).toBeNull()
    respond('<!doctype html>', { type: 'text/html; charset=utf-8' })
    expect(await fetchCatalogShow('a')).toBeNull()
  })

  it('treats broken JSON in a JSON response as an error', async () => {
    respond('{"shows":')
    await expect(fetchCatalogShow('a')).rejects.toThrow()
  })
})
