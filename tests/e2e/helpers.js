const { expect } = require('@playwright/test');

async function clickVisibleByText(page, text) {
  const locator = page.getByText(text);
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }
  throw new Error(`No visible node found for text: ${text}`);
}

async function signInAndEnsureDashboard(page, email, password) {
  await page.goto('/auth');
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Minimum 6 characters').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  const onboardingVisible = await page.getByText('Choose a language').first().isVisible().catch(() => false);
  if (onboardingVisible) {
    await Promise.all([
      page.waitForURL(/\/dashboard$/, { timeout: 15000 }),
      clickVisibleByText(page, 'Generate course'),
    ]);
  } else {
    await page.waitForURL(/\/(dashboard|onboarding)$/, { timeout: 15000 });
    if (page.url().endsWith('/onboarding')) {
      await Promise.all([
        page.waitForURL(/\/dashboard$/, { timeout: 15000 }),
        clickVisibleByText(page, 'Generate course'),
      ]);
    }
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Course Modules')).toBeVisible({ timeout: 15000 });
}

module.exports = {
  clickVisibleByText,
  signInAndEnsureDashboard,
};
