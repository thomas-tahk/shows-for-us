import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({ ok, status, json: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('api.getMusicals', () => {
  it('returns the data of a successful response', async () => {
    mockFetch({ success: true, data: [{ id: 1 }] })
    await expect(api.getMusicals()).resolves.toEqual([{ id: 1 }])
  })

  it('url-encodes the genre filter', async () => {
    const fetchMock = mockFetch({ success: true, data: [] })
    await api.getMusicals('sci fi')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/musicals?genre=sci%20fi')
  })

  it('throws when the server answers with an error status', async () => {
    mockFetch({}, false, 500)
    await expect(api.getMusicals()).rejects.toThrow('API error: 500')
  })
})
