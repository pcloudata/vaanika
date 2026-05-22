const { test, expect } = require('@playwright/test');
const { clickVisibleByText, signInAndEnsureDashboard } = require('./helpers');

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test.describe('web lesson fallback', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL and E2E_PASSWORD are required for authenticated web flow.');

  test('text-first lesson flow renders and accepts learner input', async ({ page }) => {
    await signInAndEnsureDashboard(page, E2E_EMAIL || '', E2E_PASSWORD || '');

    await clickVisibleByText(page, 'Start lesson');
    await expect(page.getByText('Web lesson mode. Text-first interaction with tutor-led step progression and interruption logic.')).toBeVisible();

    await clickVisibleByText(page, 'Start lesson');
    const learnerPrompt = 'How do you say hello in Tamil?';
    await page.getByPlaceholder('Type your response or follow-up question...').fill(learnerPrompt);
    await clickVisibleByText(page, 'Send response');
    await expect(page.getByText(learnerPrompt)).toBeVisible();
    await expect(page.getByText(/Back to class step/)).toBeVisible();
    await expect(page.getByPlaceholder('Type your response or follow-up question...')).toHaveValue('');
    await expect(page.getByText(/Voice follow-ups captured:\s+\d+/)).toBeVisible();
  });
});
