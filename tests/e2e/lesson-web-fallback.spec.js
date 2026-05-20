const { test, expect } = require('@playwright/test');

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test.describe('web lesson fallback', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL and E2E_PASSWORD are required for authenticated web flow.');

  test('text-first lesson flow renders and accepts learner input', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await page.getByPlaceholder('you@example.com').fill(E2E_EMAIL || '');
    await page.getByPlaceholder('Minimum 6 characters').fill(E2E_PASSWORD || '');
    await page.getByRole('button', { name: 'Sign in' }).click();

    const onboardingVisible = await page.getByText('Choose a language').first().isVisible().catch(() => false);
    if (onboardingVisible) {
      await Promise.all([
        page.waitForURL(/\/dashboard$/, { timeout: 15000 }),
        page.getByText('Generate course').first().click(),
      ]);
    } else {
      await page.waitForURL(/\/(dashboard|onboarding)$/, { timeout: 15000 });
      if (page.url().endsWith('/onboarding')) {
        await Promise.all([
          page.waitForURL(/\/dashboard$/, { timeout: 15000 }),
          page.getByText('Generate course').first().click(),
        ]);
      }
    }

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Course Modules')).toBeVisible({ timeout: 15000 });

    await clickVisibleByText(page, 'Start lesson');
    await expect(page.getByText('Web lesson mode. Text-first interaction with tutor-led step progression and interruption logic.')).toBeVisible();

    await clickVisibleByText(page, 'Start lesson');
    const learnerPrompt = 'How do you say hello in Tamil?';
    await page.getByPlaceholder('Type your response or follow-up question...').fill(learnerPrompt);
    await clickVisibleByText(page, 'Send response');
    await expect(page.getByText(learnerPrompt)).toBeVisible();
    await expect(page.getByPlaceholder('Type your response or follow-up question...')).toHaveValue('');
    await expect(page.getByText(/Voice follow-ups captured:\s+\d+/)).toBeVisible();
  });
});

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
