import { canSubmitAssessmentFromProgress } from './assessmentGate';

describe('assessment gate', () => {
  it('blocks assessment when lesson is in progress', () => {
    expect(
      canSubmitAssessmentFromProgress('in_progress', [
        { title: 'M1', description: 'd', progress: '100%' },
      ]),
    ).toBe(false);
  });

  it('allows assessment when lesson is completed', () => {
    expect(canSubmitAssessmentFromProgress('complete', [])).toBe(true);
  });

  it('allows assessment when module progress already reached 100%', () => {
    expect(
      canSubmitAssessmentFromProgress('not_started', [
        { title: 'M1', description: 'd', progress: '100%' },
      ]),
    ).toBe(true);
  });
});
