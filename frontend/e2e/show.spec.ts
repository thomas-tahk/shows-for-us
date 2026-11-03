import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { load } from 'js-yaml'

// Read the committed data so these tests survive the owner's sign-off edits and the first live pull.
const writeup = load(readFileSync('content/shows/hamilton.yaml', 'utf8')) as {
  status: string
  sources_opened: boolean
  original_cast: { person: string }[]
}
const isDraft = !writeup.sources_opened || writeup.status !== 'owner-checked'
const dataLive = (JSON.parse(readFileSync('data/shows.json', 'utf8')) as { meta: { live: boolean } }).meta.live

// String form: the e2e tsconfig has no DOM lib.
async function expectNoHScroll(page: Page) {
  const ok = await page.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`)
  expect(ok).toBe(true)
}

for (const width of [390, 1280]) {
  test(`search Hamilton, read its page (${width}px)`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', e => errors.push(String(e)))

    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main a[href^="/show/"]')).toHaveCount(15)
    await expectNoHScroll(page)

    await page.getByLabel('Search shows').fill('hamil')
    await expect(page.locator('main a[href^="/show/"]')).toHaveCount(1)
    await expectNoHScroll(page)
    await page.screenshot({ path: test.info().outputPath(`home-results-${width}.png`), fullPage: true })

    await page.locator('main a[href="/show/hamilton"]').click()
    await expect(page).toHaveURL(/\/show\/hamilton$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Hamilton' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'History' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Created by' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Original cast' })).toBeVisible()
    await expect(page.getByText('Lin-Manuel Miranda').first()).toBeVisible()
    await expect(page.getByText(writeup.original_cast[0].person).first()).toBeVisible()
    const banner = page.getByText("Draft: these facts haven't been checked")
    if (isDraft) await expect(banner).toBeVisible()
    else await expect(banner).toHaveCount(0)

    const attr = page.getByTestId('wikipedia-attribution')
    await expect(attr).toBeVisible()
    await expect(attr.getByRole('link', { name: 'Hamilton (musical)' })).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Hamilton_(musical)',
    )
    await expect(attr.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-sa/4.0/',
    )
    if (dataLive) {
      // Real pull: the IBDB link must point at a show page.
      const ibdb = page.locator('main a[href*="ibdb.com"]')
      await expect(ibdb).toHaveCount(1)
      expect(await ibdb.getAttribute('href')).toMatch(/^https:\/\/www\.ibdb\.com\/broadway-show\//)
    } else {
      // data/shows.json is fixture-built (meta.live false): its IBDB/Playbill URLs are not real.
      await expect(page.locator('main a[href*="ibdb.com"], main a[href*="playbill.com"]')).toHaveCount(0)
    }
    await expectNoHScroll(page)
    await page.screenshot({ path: test.info().outputPath(`show-hamilton-${width}.png`), fullPage: true })

    expect(errors).toEqual([])
  })
}

test('no-match query says so', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search shows').fill('zzzzqq')
  await expect(page.getByText(/No show matches/)).toBeVisible()
})

test('unknown show shows a not-found page with a link home', async ({ page }) => {
  await page.goto('/show/not-a-show')
  await expect(page.getByRole('heading', { name: 'Show not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to all shows' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('unknown route shows a not-found page', async ({ page }) => {
  await page.goto('/nope/at/all')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back to all shows' })).toBeVisible()
})
