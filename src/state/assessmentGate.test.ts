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
    expect(
      canSubmitAssessmentFromProgress('complete', [
        { title: 'M1', description: 'd', progress: '100%' },
        { title: 'M2', description: 'd', progress: '100%' },
        { title: 'M3', description: 'd', progress: '100%' },
      ]),
    ).toBe(true);
  });

  it('allows assessment when 3 module progress entries reached 100%', () => {
    expect(
      canSubmitAssessmentFromProgress('not_started', [
        { title: 'M1', description: 'd', progress: '100%' },
        { title: 'M2', description: 'd', progress: '100%' },
        { title: 'M3', description: 'd', progress: '100%' },
      ]),
    ).toBe(true);
  });

  it('blocks when fewer than 3 modules are complete', () => {
    const eligibility = getAssessmentEligibilityFromProgress('not_started', [
      { title: 'M1', description: 'd', progress: '100%' },
      { title: 'M2', description: 'd', progress: '25%' },
      { title: 'M3', description: 'd', progress: '25%' },
    ]);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.reason).toContain('Complete all 3 modules');
  });
});
