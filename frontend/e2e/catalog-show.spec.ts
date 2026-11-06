import type { Page } from '@playwright/test'
import { test, expect, readFixture } from './catalogFixture'

// String form: the e2e tsconfig has no DOM lib.
async function expectNoHScroll(page: Page) {
  const ok = await page.evaluate(`document.scrollingElement.scrollWidth <= document.scrollingElement.clientWidth`)
  expect(ok).toBe(true)
}

for (const [width, height] of [[390, 844], [1280, 800]]) {
  test.describe(`catalogue show page (${width}px)`, () => {
    test.use({ viewport: { width, height } })

    test('Show Boat renders its catalogue record', async ({ page }) => {
      const errors: string[] = []
      page.on('console', m => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', e => errors.push(String(e)))

      await page.goto('/show/show-boat')
      await expect(page.getByRole('heading', { level: 1, name: 'Show Boat' })).toBeVisible()
      const summary = page.getByRole('region', { name: 'From Wikipedia' }).locator('p').first()
      await expect(summary).toBeVisible()
      expect((await summary.innerText()).trim().length).toBeGreaterThan(0)
      await expect(page.getByRole('main').getByRole('link', { name: 'CC BY-SA 4.0' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Created by' }).getByText('Jerome Kern')).toBeVisible()
      await expect(page.getByRole('region', { name: 'Premiere' }).getByText('1927')).toBeVisible()
      const ibdb = page.getByRole('link', { name: 'IBDB', exact: true })
      expect(await ibdb.getAttribute('href')).toMatch(/^https:\/\/www\.ibdb\.com\/broadway-show\//)
      await expect(ibdb).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(page.getByText('Playing next')).toHaveCount(0)
      await expectNoHScroll(page)
      await page.screenshot({ path: test.info().outputPath(`catalog-show-boat-${width}.png`), fullPage: true })
      expect(errors).toEqual([])
    })

    test('The Robber Bridegroom has no IBDB link', async ({ page }) => {
      await page.goto('/show/the-robber-bridegroom')
      await expect(page.getByRole('heading', { level: 1, name: 'The Robber Bridegroom' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'IBDB', exact: true })).toHaveCount(0)
      await expectNoHScroll(page)
    })

    test('unknown slug is not found', async ({ page }) => {
      await page.goto('/show/no-such-show')
      await expect(page.getByRole('heading', { name: 'Show not found' })).toBeVisible()
    })

    test('prototype-named slug is not found, app survives', async ({ page }) => {
      await page.goto('/show/constructor')
      await expect(page.getByRole('heading', { name: 'Show not found' })).toBeVisible()
    })

    test('slug absent from an existing shard is not found', async ({ page }) => {
      // zz194 hashes to shard 065, the shard that holds show-boat.
      await page.goto('/show/zz194')
      await expect(page.getByRole('heading', { name: 'Show not found' })).toBeVisible()
    })

    test('flagship page is unchanged', async ({ page }) => {
      await page.goto('/show/hamilton')
      await expect(page.getByRole('heading', { level: 1, name: 'Hamilton' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Original cast' })).toBeVisible()
    })
  })
}

test('fetch error shows a retry button that recovers', async ({ page }) => {
  let fail = true
  await page.route('**/catalog/shows/*.json', route =>
    fail ? route.fulfill({ status: 500, body: 'boom' }) : route.fallback(),
  )
  await page.goto('/show/show-boat')
  await expect(page.getByText("Couldn't load this show. Try again.")).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Show Boat' })).toBeVisible()
})

test('a catalogue show page never requests the 1 MB index on load', async ({ page }) => {
  const indexRequests: string[] = []
  page.on('request', r => /\/catalog\/index\.json/.test(r.url()) && indexRequests.push(r.url()))
  await page.goto('/show/show-boat')
  await expect(page.getByRole('heading', { level: 1, name: 'Show Boat' })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('Sample data')
  expect(indexRequests).toEqual([])
})

test('the index is fetched only after a person card opens', async ({ page }) => {
  const indexRequests: string[] = []
  page.on('request', r => /\/catalog\/index\.json/.test(r.url()) && indexRequests.push(r.url()))
  // Wikimedia hosts are not reachable from e2e: the card degrades to the name and Known for.
  await page.route(/(wikidata|wikipedia)\.org/, route => route.abort())
  await page.goto('/show/show-boat')
  await expect(page.getByRole('heading', { level: 1, name: 'Show Boat' })).toBeVisible()
  expect(indexRequests).toEqual([])
  await page.getByRole('link', { name: 'Jerome Kern' }).focus()
  await expect(page.getByRole('group', { name: 'About Jerome Kern' })).toBeVisible()
  await expect.poll(() => indexRequests.length).toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('group')).toHaveCount(0)
})

test('a shard without `live` shows no sample-data note', async ({ page }) => {
  await page.route('**/catalog/shows/065.json', async route => {
    const shard = JSON.parse(readFixture('shows/065.json') ?? '{}')
    delete shard.live
    await route.fulfill({ json: shard })
  })
  await page.goto('/show/show-boat')
  await expect(page.getByRole('heading', { level: 1, name: 'Show Boat' })).toBeVisible()
  await expect(page.getByRole('note')).toHaveCount(0)
})

test('a summary with newlines renders as separate paragraphs', async ({ page }) => {
  await page.route('**/catalog/shows/065.json', async route => {
    const shard = JSON.parse(readFixture('shows/065.json') ?? '{}')
    shard.shows['show-boat'].summary.text = 'First paragraph.\nSecond paragraph.'
    await route.fulfill({ json: shard })
  })
  await page.goto('/show/show-boat')
  const paras = page.getByRole('region', { name: 'From Wikipedia' }).locator('p')
  await expect(paras.nth(0)).toHaveText('First paragraph.')
  await expect(paras.nth(1)).toHaveText('Second paragraph.')
})
