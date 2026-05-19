import { canSubmitAssessmentFromProgress, getAssessmentEligibilityFromProgress } from './assessmentGate';

describe('assessment gate', () => {
  it('blocks assessment when lesson is in progress', () => {
    expect(
      canSubmitAssessmentFromProgress('in_progress', [
        { title: 'M1', description: 'd', progress: '100%' },
      ]),
    ).toBe(false);
  });

  it('returns explicit block reason for in-progress lesson', () => {
    const eligibility = getAssessmentEligibilityFromProgress('in_progress', [
      { title: 'M1', description: 'd', progress: '100%' },
    ]);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.reason).toContain('Finish the active lesson');
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

  it('returns explicit block reason when no lesson/module completion exists', () => {
    const eligibility = getAssessmentEligibilityFromProgress('not_started', [
      { title: 'M1', description: 'd', progress: '25%' },
    ]);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.reason).toContain('Complete at least one module');
  });
});
