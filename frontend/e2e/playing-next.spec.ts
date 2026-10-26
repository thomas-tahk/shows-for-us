import { test, expect, type Page } from '@playwright/test'

// String form: the e2e tsconfig has no DOM lib.
async function expectNoHScroll(page: Page) {
  const ok = await page.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`)
  expect(ok).toBe(true)
}

const EVENTS = [
  {
    id: 'tm1',
    name: 'Hamilton',
    date: '2026-11-14',
    time: '19:30:00',
    url: 'https://www.ticketmaster.com/event/tm1',
    venue: 'Richard Rodgers Theatre',
    city: 'New York',
    state: 'NY',
  },
  {
    id: 'tm2',
    name: 'Hamilton',
    date: '2026-12-02',
    time: null,
    url: 'https://www.ticketmaster.com/event/tm2',
    venue: 'Hobby Center',
    city: 'Houston',
    state: 'TX',
  },
]

for (const width of [390, 1280]) {
  test.describe(`Playing next (${width}px)`, () => {
    test.use({ viewport: { width, height: 900 } })

    let errors: string[]
    test.beforeEach(({ page }) => {
      errors = []
      page.on('console', m => {
        // The mocked 502 makes Chromium log the failed resource load; that is the case under test.
        if (m.type() === 'error' && !m.text().includes('502')) errors.push(m.text())
      })
      page.on('pageerror', e => errors.push(String(e)))
    })

    test('lists Ticketmaster dates before the official link, all opening off-site', async ({ page }) => {
      await page.route('**/api/events?show=hamilton*', route => route.fulfill({ json: { events: EVENTS } }))
      await page.goto('/show/hamilton')

      const section = page.getByRole('region', { name: 'Playing next' })
      await expect(section.getByText('Sat, Nov 14, 2026 · 7:30 PM')).toBeVisible()
      await expect(section.getByText('Wed, Dec 2, 2026', { exact: true })).toBeVisible()
      await expect(section.getByText('Dates from Ticketmaster')).toBeVisible()

      const links = section.getByRole('link')
      await expect(links).toHaveCount(3)
      await expect(links.nth(0)).toHaveAttribute('href', EVENTS[0].url)
      await expect(links.nth(1)).toHaveAttribute('href', EVENTS[1].url)
      await expect(links.nth(2)).toHaveAccessibleName(/Official tickets/)
      for (let i = 0; i < 3; i++) {
        await expect(links.nth(i)).toHaveAttribute('target', '_blank')
        await expect(links.nth(i)).toHaveAttribute('rel', /noopener/)
      }
      await expect(links.nth(0)).toHaveAccessibleName(/Tickets for Sat, Nov 14, 2026 at Richard Rodgers Theatre/)

      await expectNoHScroll(page)
      await section.scrollIntoViewIfNeeded()
      await page.screenshot({ path: test.info().outputPath(`playing-next-ok-${width}.png`), fullPage: true })
      expect(errors).toEqual([])
    })

    test('function error: official link stays, page says live dates are unavailable', async ({ page }) => {
      await page.route('**/api/events?show=hamilton*', route =>
        route.fulfill({ status: 502, json: { error: 'Ticketmaster is unavailable' } }),
      )
      await page.goto('/show/hamilton')
      const section = page.getByRole('region', { name: 'Playing next' })
      await expect(section.getByText('Live dates are unavailable right now.')).toBeVisible()
      await expect(section.getByText('Dates from Ticketmaster')).toHaveCount(0)
      const official = section.getByRole('link', { name: /Official tickets/ })
      await expect(official).toHaveAttribute('href', 'https://hamiltonmusical.com')
      await expect(official).toHaveAttribute('target', '_blank')
      await expect(official).toHaveAttribute('rel', /noopener/)
      await expectNoHScroll(page)
      await page.screenshot({ path: test.info().outputPath(`playing-next-502-${width}.png`), fullPage: true })
      expect(errors).toEqual([])
    })

    test('no API key (200 with a reason) reads as unavailable', async ({ page }) => {
      await page.route('**/api/events?show=hamilton*', route =>
        route.fulfill({ json: { events: [], reason: 'TICKETMASTER_API_KEY not set' } }),
      )
      await page.goto('/show/hamilton')
      const section = page.getByRole('region', { name: 'Playing next' })
      await expect(section.getByText('Live dates are unavailable right now.')).toBeVisible()
      await expect(section.getByRole('link', { name: /Official tickets/ })).toBeVisible()
      expect(errors).toEqual([])
    })
  })
}
