import {
  canHandleFollowUp,
  classifyLearnerUtterance,
  getLessonPlan,
  restoreFromInterruption,
  transitionAfterPracticeEvaluation,
} from './lessonOrchestrator';

describe('lessonOrchestrator utterance classification', () => {
  it('treats explicit translation prompt as follow-up even with practice keywords', () => {
    const step = getLessonPlan('ta-IN').steps[1];
    const classification = classifyLearnerUtterance(
      'Tell me how do you say did you finish your dinner in Tamil?',
      step,
      'ta-IN',
    );

    expect(classification).toBe('followup');
  });

  it('treats step-intent answer as practice', () => {
    const step = getLessonPlan('ta-IN').steps[0];
    const classification = classifyLearnerUtterance('Vanakkam, ungal peyar enna?', step, 'ta-IN');

    expect(classification).toBe('practice');
  });

  it('treats too-short responses as unclear', () => {
    const step = getLessonPlan('ta-IN').steps[0];
    const classification = classifyLearnerUtterance('ok', step, 'ta-IN');

    expect(classification).toBe('unclear');
  });

  it('keeps same step in PRACTICE when rubric fails', () => {
    const next = transitionAfterPracticeEvaluation(
      { activePhase: 'RUBRIC_CHECK', activeStepId: 'intro-name', stepIndex: 0 },
      false,
      15,
      'greet-2',
    );

    expect(next).toEqual({
      activePhase: 'PRACTICE',
      activeStepId: 'intro-name',
      stepIndex: 0,
    });
  });

  it('moves to next step practice phase when rubric passes', () => {
    const next = transitionAfterPracticeEvaluation(
      { activePhase: 'RUBRIC_CHECK', activeStepId: 'intro-name', stepIndex: 0 },
      true,
      15,
      'greet-2',
    );

    expect(next).toEqual({
      activePhase: 'PRACTICE',
      activeStepId: 'greet-2',
      stepIndex: 1,
    });
  });

  it('restores exact step and phase from interruption snapshot', () => {
    const restored = restoreFromInterruption({
      phase: 'PRACTICE',
      stepId: 'dinner-check',
      stepIndex: 1,
    });

    expect(restored).toEqual({
      activePhase: 'PRACTICE',
      activeStepId: 'dinner-check',
      stepIndex: 1,
    });
  });

  it('provides Telugu script and transliteration fields', () => {
    const teluguPlan = getLessonPlan('te-IN');
    const firstStep = teluguPlan.steps[0];

    expect(firstStep.exampleLine.native.length).toBeGreaterThan(0);
    expect(firstStep.exampleLine.transliteration?.length).toBeGreaterThan(0);
    expect(firstStep.practicePrompt.transliteration?.length).toBeGreaterThan(0);
  });

  it('returns 15+ steps per Tamil and Telugu module lesson', () => {
    const tamilModuleOne = getLessonPlan('ta-IN', 0);
    const teluguModuleTwo = getLessonPlan('te-IN', 1);

    expect(tamilModuleOne.steps.length).toBeGreaterThanOrEqual(15);
    expect(teluguModuleTwo.steps.length).toBeGreaterThanOrEqual(15);
  });

  it('treats Telugu script practice question as practice for dinner step', () => {
    const step = getLessonPlan('te-IN').steps[1];
    const classification = classifyLearnerUtterance('మీరు భోజనం ముగించారా?', step, 'te-IN');

    expect(classification).toBe('practice');
  });

  it('caps follow-up interruptions at 2 per step', () => {
    expect(canHandleFollowUp(0, 2)).toBe(true);
    expect(canHandleFollowUp(1, 2)).toBe(true);
    expect(canHandleFollowUp(2, 2)).toBe(false);
  });
});
