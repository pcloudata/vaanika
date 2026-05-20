const { test, expect } = require('@playwright/test');
const { clickVisibleByText, signInAndEnsureDashboard } = require('./helpers');

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const E2E_FAIL_MODE = process.env.EXPO_PUBLIC_E2E_MODE === 'true' && process.env.EXPO_PUBLIC_E2E_ASSESSMENT_FORCE_FAIL === 'true';

const LONG_RESPONSES = [
  'I would greet politely, ask a question, and respond with confidence in the target language.',
  'I understood the tutor question and can restate the intent clearly in my own words.',
  'I can use three target words naturally in one sentence with correct meaning and context.',
  'This passage means the speaker is checking understanding and asking for a practical response.',
  'I can answer this conversational prompt with clear structure, relevant vocabulary, and correct intent.',
];

test.describe('assessment fail path web flow', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL and E2E_PASSWORD are required for assessment fail-path flow.');
  test.skip(!E2E_FAIL_MODE, 'Fail-path spec runs only when E2E fail-mode flags are enabled.');

  test('forced-fail submission shows retry state and no pass badge messaging', async ({ page }) => {
    await signInAndEnsureDashboard(page, E2E_EMAIL || '', E2E_PASSWORD || '');
    await page.getByRole('button', { name: 'Assessment' }).first().click();
    await expect(page).toHaveURL(/\/assessment$/);

    const isLocked = await page.getByText(/Locked:/).first().isVisible().catch(() => false);
    if (isLocked) {
      await clickVisibleByText(page, 'Home');
      await expect(page).toHaveURL(/\/dashboard$/);
      await clickVisibleByText(page, 'Start lesson');
      await clickVisibleByText(page, 'Start lesson');
      await clickVisibleByText(page, 'Complete lesson');
      await expect(page).toHaveURL(/\/dashboard$/);
      await page.getByRole('button', { name: 'Assessment' }).first().click();
      await expect(page).toHaveURL(/\/assessment$/);
    }

    const answerFields = page.locator('textarea[placeholder="Type your response..."]:visible');
    for (let index = 0; index < LONG_RESPONSES.length; index += 1) {
      await expect(answerFields.nth(index)).toBeVisible({ timeout: 10000 });
      await answerFields.nth(index).fill(LONG_RESPONSES[index]);
    }

    await clickVisibleByText(page, 'Submit assessment');
    await expect(page).toHaveURL(/\/badge$/, { timeout: 30000 });
    await expect(page.getByText('Assessment submitted')).toBeVisible();
    await expect(page.getByText('Retry')).toBeVisible();
    await expect(page.getByText('Skill badge earned')).toHaveCount(0);
  });
});
