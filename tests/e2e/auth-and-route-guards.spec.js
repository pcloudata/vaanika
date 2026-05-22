const { test, expect } = require('@playwright/test');

test('signed-out user is redirected to auth from protected routes', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText('Learner account', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

  await page.goto('/lesson');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText('Learner account', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

  await page.goto('/assessment');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText('Learner account', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

  await page.goto('/badge');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText('Learner account', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
});
