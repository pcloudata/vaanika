import { buildLessonStepEventInsert } from './stepMetricsService';

describe('stepMetricsService', () => {
  it('builds a stable insert payload for step metrics', () => {
    const payload = buildLessonStepEventInsert({
      eventType: 'practice_pass',
      learnerText: 'Vanakkam, en peyar Prashanth.',
      lessonSessionId: 'session-1',
      stepId: 'intro-name',
      stepIndex: 0,
      tutorText: 'Great response. Moving to next step.',
    });

    expect(payload).toEqual({
      event_type: 'practice_pass',
      learner_text: 'Vanakkam, en peyar Prashanth.',
      lesson_session_id: 'session-1',
      step_id: 'intro-name',
      step_index: 0,
      tutor_text: 'Great response. Moving to next step.',
    });
  });
});
