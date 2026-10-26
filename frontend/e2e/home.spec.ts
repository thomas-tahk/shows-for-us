import { test, expect } from '@playwright/test'

test('home page loads and shows the site title', async ({ page }) => {
  // The backend is not part of this suite: answer every API call with empty data.
  await page.route('**/api/search/popular', route =>
    route.fulfill({ json: { success: true, data: { popularMusicals: [], genres: [] } } }),
  )
  await page.route('**/api/musicals**', route =>
    route.fulfill({ json: { success: true, data: [] } }),
  )

  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Shows For Us' })).toBeVisible()
})
