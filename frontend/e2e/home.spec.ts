import { test, expect } from './catalogFixture'

test('home page loads and shows the site title', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Shows For Us' })).toBeVisible()
})
