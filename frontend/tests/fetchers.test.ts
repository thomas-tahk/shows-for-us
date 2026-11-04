import { afterEach, describe, expect, it, vi } from 'vitest'
import { liveFetcher } from '../scripts/fetchers.ts'

const req = { path: 'x.json', url: 'https://example.org/x', accept: 'application/json' }

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('liveFetcher transient errors', () => {
  for (const status of [500, 502, 503, 504]) {
    it(`retries HTTP ${status} then succeeds`, async () => {
      vi.useFakeTimers()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('oops', { status }))
        .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      vi.stubGlobal('fetch', fetchMock)
      const p = liveFetcher(0, 3)(req)
      await vi.advanceTimersByTimeAsync(120_000)
      expect(await p).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  }

  it('does not retry a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('no', { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(liveFetcher(0, 3)(req)).rejects.toThrow(/404/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
