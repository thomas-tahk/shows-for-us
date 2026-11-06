import { test, expect } from './catalogFixture'

const links = 'main a[href^="/show/"]'

for (const width of [390, 1280]) {
  test.describe(`catalogue search (${width}px)`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('robber brid -> The Robber Bridegroom', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Featured shows' })).toBeVisible()
      await page.getByLabel('Search shows').fill('robber brid')
      await page.getByRole('link', { name: /The Robber Bridegroom/ }).click()
      await expect(page).toHaveURL(/\/show\/the-robber-bridegroom$/)
    })

    test('hamiltn (typo) puts Hamilton first', async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('Search shows').fill('hamiltn')
      await expect(page.locator(links).first()).toContainText('Hamilton')
      await page.screenshot({ path: test.info().outputPath(`search-typo-${width}.png`), fullPage: true })
    })

    test('catalogue 500 still leaves flagship search and says so', async ({ page }) => {
      await page.route('**/catalog/index.json', r => r.fulfill({ status: 500, body: 'nope' }))
      await page.goto('/')
      await page.getByLabel('Search shows').fill('hamil')
      await expect(page.locator(links).first()).toContainText('Hamilton')
      await expect(page.getByText(/full catalogue couldn.t load/i)).toBeVisible()
      await page.screenshot({ path: test.info().outputPath(`search-error-${width}.png`), fullPage: true })
    })
  })
}

test('with the index down, typing does not refetch; the next focus does', async ({ page }) => {
  let requests = 0
  await page.route('**/catalog/index.json', r => {
    requests++
    return r.fulfill({ status: 500, body: 'nope' })
  })
  await page.goto('/')
  const box = page.getByLabel('Search shows')
  await box.click()
  await box.pressSequentially('chicago')
  await expect(page.getByText(/full catalogue couldn.t load/i)).toBeVisible()
  expect(requests).toBe(1)
  await box.blur()
  await box.focus()
  await expect.poll(() => requests).toBe(2)
})

test('catalogue-only show and result count', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search shows').fill('1927')
  await expect(page.locator(links)).toHaveCount(1)
  await expect(page.locator(links).first()).toContainText('Show Boat')
  await expect(page.locator(links).first()).toContainText('1927')
  await expect(page.getByRole('status')).toContainText('1 show found')
})
