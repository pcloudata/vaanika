const { test, expect } = require('@playwright/test');
const { clickVisibleByText, signInAndEnsureDashboard } = require('./helpers');

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

const LONG_RESPONSES = [
  'I would greet politely, ask a question, and respond with confidence in the target language.',
  'I understood the tutor question and can restate the intent clearly in my own words.',
  'I can use three target words naturally in one sentence with correct meaning and context.',
  'This passage means the speaker is checking understanding and asking for a practical response.',
  'I can answer this conversational prompt with clear structure, relevant vocabulary, and correct intent.',
];

test.describe('assessment and badge web flow', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL and E2E_PASSWORD are required for assessment web flow.');

  test('learner sees lock reason before completion, then can submit and reach badge', async ({ page }) => {
    await signInAndEnsureDashboard(page, E2E_EMAIL || '', E2E_PASSWORD || '');

    await clickVisibleByText(page, 'Assessment');
    await expect(page).toHaveURL(/\/assessment$/);

    const isLocked = await page.getByText(/Locked:/).first().isVisible().catch(() => false);
    if (isLocked) {
      await expect(page.getByText(/Locked:/)).toBeVisible();
      await clickVisibleByText(page, 'Home');
      await expect(page).toHaveURL(/\/dashboard$/);
      await clickVisibleByText(page, 'Start lesson');
      await clickVisibleByText(page, 'Start lesson');
      await clickVisibleByText(page, 'Complete lesson');
      await expect(page).toHaveURL(/\/dashboard$/);
      await clickVisibleByText(page, 'Assessment');
      await expect(page).toHaveURL(/\/assessment$/);
    }

    await fillAssessmentResponses(page, LONG_RESPONSES);

    await clickVisibleByText(page, 'Submit assessment');
    await expect(page).toHaveURL(/\/badge$/, { timeout: 30000 });
    await expect(page.getByText(/Assessment submitted|Skill badge earned/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Score/)).toBeVisible();
  });
});

async function fillAssessmentResponses(page, responses) {
  const answerFields = page.locator('textarea[placeholder="Type your response..."]:visible');
  const fieldCount = await answerFields.count();
  if (fieldCount < responses.length) {
    throw new Error(`Expected at least ${responses.length} assessment fields, found ${fieldCount}.`);
  }

  for (let index = 0; index < responses.length; index += 1) {
    const field = answerFields.nth(index);
    await expect(field).toBeVisible({ timeout: 10000 });
    await field.fill(responses[index]);
  }
}
