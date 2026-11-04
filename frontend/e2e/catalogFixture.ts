import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test as base, expect } from '@playwright/test'

// The e2e specs never read public/catalog/: the weekly refresh replaces it with ~5,900 real shows.
// Every test serves e2e/fixtures/catalog/ instead (a copy of the sample catalogue),
// and gets a stub for Wikimedia images.
const FIXTURE_DIR = join(import.meta.dirname, 'fixtures', 'catalog')
// 1x1 transparent PNG: show images come from upload.wikimedia.org, which e2e must not depend on.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
const SPA_FALLBACK = '<!doctype html><html><head><title>Shows For Us</title></head><body><div id="root"></div></body></html>'

function readFixture(path: string): string | null {
  // Only the shapes the app requests; anything else is "missing".
  if (!/^(index|shows\/\d{3})\.json$/.test(path)) return null
  try {
    return readFileSync(join(FIXTURE_DIR, path), 'utf8')
  } catch {
    return null
  }
}

export const test = base.extend<{ catalogFixture: void }>({
  catalogFixture: [
    async ({ page }, use) => {
      await page.route('**/catalog/**', route => {
        const path = new URL(route.request().url()).pathname.replace(/^.*\/catalog\//, '')
        const body = readFixture(path)
        // Missing files are answered like vite preview / Vercel: index.html, 200, text/html.
        if (body === null) return route.fulfill({ status: 200, contentType: 'text/html', body: SPA_FALLBACK })
        return route.fulfill({ status: 200, contentType: 'application/json', body })
      })
      await page.route('https://upload.wikimedia.org/**', route =>
        route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect }
