import { test, expect } from '@playwright/test'

test('footer credits Wikidata/Wikipedia and discloses Ticketmaster data', async ({ page }) => {
  // The backend is not part of this suite: answer every API call with empty data.
  await page.route('**/api/search/popular', route =>
    route.fulfill({ json: { success: true, data: { popularMusicals: [], genres: [] } } }),
  )
  await page.route('**/api/musicals**', route =>
    route.fulfill({ json: { success: true, data: [] } }),
  )

  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')

  const footer = page.getByTestId('site-footer')
  await expect(footer.getByRole('link', { name: 'Wikidata' })).toHaveAttribute(
    'href',
    'https://www.wikidata.org',
  )
  await expect(footer).toContainText('CC0')
  await expect(footer.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by-sa/4.0/',
  )
  await expect(footer).toContainText('Wikipedia')
  await expect(footer).toContainText('links the article')
  await expect(footer).toContainText("Ticketmaster's Discovery API")
  await expect(footer).toContainText('not stored by this site')
  await expect(footer).toContainText("We don't sell tickets; links go to the sellers.")

  // The footer itself must fit a 390px screen. (The home page hero button already overflows
  // to 428px; that is pre-existing and not this footer's.) String form: no DOM lib in e2e tsconfig.
  const noHScroll = await page.evaluate(
    `(() => { const e = document.querySelector('[data-testid=site-footer]'); return e.scrollWidth <= e.clientWidth && e.getBoundingClientRect().right <= 390 })()`,
  )
  expect(noHScroll).toBe(true)
})
