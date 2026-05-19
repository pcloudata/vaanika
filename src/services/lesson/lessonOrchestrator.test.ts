import { classifyLearnerUtterance, getLessonPlan } from './lessonOrchestrator';

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
});
