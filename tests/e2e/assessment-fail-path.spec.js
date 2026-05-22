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
const LESSON_AUTOPILOT_RESPONSE =
  'practice namaskaram mee peru emiti enna bhojanam muginchara from hyderabad repeat slowly learning thank tomorrow morning evening example water hungry kitchen bus left right straight map help road found goodbye';

test.describe('assessment fail path web flow', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL and E2E_PASSWORD are required for assessment fail-path flow.');
  test.skip(!E2E_FAIL_MODE, 'Fail-path spec runs only when E2E fail-mode flags are enabled.');
  test.setTimeout(90000);

  test('forced-fail submission shows retry state and no pass badge messaging', async ({ page }) => {
    await signInAndEnsureDashboard(page, E2E_EMAIL || '', E2E_PASSWORD || '');
    await openAssessmentRoute(page);

    const isLocked = await page.getByText(/Locked:/).first().isVisible().catch(() => false);
    if (isLocked) {
      await completeThreeModules(page);
      await openAssessmentRoute(page);
    }

    await ensureAssessmentFormReady(page);
    const answerFields = page.locator('textarea[placeholder="Type your response..."]:visible');
    await expect(answerFields).toHaveCount(5, { timeout: 15000 });
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

async function completeThreeModules(page) {
  for (let index = 0; index < 3; index += 1) {
    await clickVisibleByText(page, 'Home');
    await expect(page).toHaveURL(/\/dashboard$/);
    await clickVisibleByText(page, 'Start lesson');
    await clickVisibleByText(page, 'Start lesson');
    await completeGuidedLesson(page);
    await clickVisibleByText(page, 'Complete lesson');
    await expect(page).toHaveURL(/\/dashboard$/);

    await openAssessmentRoute(page);
    const stillLocked = await page.getByText(/Locked:/).first().isVisible().catch(() => false);
    if (!stillLocked) {
      return;
    }
  }
  throw new Error('Assessment remained locked after repeated module completions.');
}

async function openAssessmentRoute(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const assessmentButton = page.getByRole('button', { name: 'Assessment' });
    const hasDashboardAssessment = await assessmentButton.isVisible().catch(() => false);
    if (hasDashboardAssessment) {
      await assessmentButton.click().catch(() => {});
    } else {
      await page.goto('/assessment');
    }
    if (await ensureAssessmentFormReady(page)) {
      return;
    }
    await page.goto('/assessment');
    if (await ensureAssessmentFormReady(page)) {
      return;
    }
    await signInAndEnsureDashboard(page, E2E_EMAIL || '', E2E_PASSWORD || '');
  }
  throw new Error('Could not reach assessment form after repeated auth recovery.');
}

async function completeGuidedLesson(page) {
  const responseBox = page.getByPlaceholder('Type your response or follow-up question...');
  await expect(responseBox).toBeVisible({ timeout: 15000 });

  for (let step = 0; step < 60; step += 1) {
    const lessonReady = await page.getByText('You completed this lesson. Tap Complete lesson to finish.').first().isVisible().catch(() => false);
    if (lessonReady) {
      return;
    }

    await responseBox.fill(LESSON_AUTOPILOT_RESPONSE);
    const sendButton = page.getByRole('button', { name: 'Send response' });
    await expect(sendButton).toBeEnabled({ timeout: 10000 });
    await sendButton.click();
  }

  throw new Error('Guided lesson did not finish within expected step limit.');
}

async function ensureAssessmentFormReady(page) {
  const onAuthScreen = await page.getByPlaceholder('you@example.com').isVisible().catch(() => false);
  if (onAuthScreen) {
    return false;
  }

  const taskMarker = await page.getByText('Task 1').first().isVisible().catch(() => false);
  if (taskMarker) {
    await expect(page).toHaveURL(/\/assessment$/);
    return true;
  }

  const fields = page.locator('textarea[placeholder="Type your response..."]:visible');
  const fieldCount = await fields.count();
  if (fieldCount >= 1) {
    await expect(page).toHaveURL(/\/assessment$/);
    return true;
  }

  return false;
}
