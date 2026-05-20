import { assessmentServiceTesting, computeWeightedOverall, isE2EFailModeEnabled, isEligibleForAssessment, parseAssessmentFeedback } from './assessmentService';
import type { AssessmentResponses } from '../../types/learning';

const SAMPLE_RESPONSES: AssessmentResponses = {
  speaking: 'Vanakkam, en peyar Prashanth.',
  listening: 'I understood the tutor asked my name and greeting.',
  vocabulary: 'vanakkam, peyar, sapadu',
  reading: 'The sentence asks whether you finished dinner.',
  response: 'Naan iravu unavu mudithen.',
};

describe('assessmentService helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_E2E_MODE;
    delete process.env.EXPO_PUBLIC_E2E_ASSESSMENT_FORCE_FAIL;
  });

  it('enforces assessment eligibility requirements', () => {
    expect(isEligibleForAssessment({ completedLessonCount: 0, completedSessionCount: 1 })).toBe(false);
    expect(isEligibleForAssessment({ completedLessonCount: 1, completedSessionCount: 0 })).toBe(false);
    expect(isEligibleForAssessment({ completedLessonCount: 1, completedSessionCount: 1 })).toBe(true);
  });

  it('computes weighted overall score deterministically', () => {
    const score = computeWeightedOverall({
      speaking: 80,
      listening: 70,
      vocabulary: 90,
      reading: 60,
      response: 75,
    });

    expect(score).toBe(76);
  });

  it('parses structured feedback payload safely', () => {
    const parsed = parseAssessmentFeedback(
      JSON.stringify({
        speaking: 78,
        listening: 74,
        vocabulary: 80,
        reading: 70,
        response: 76,
        overall: 76,
        notes: 'Consistent responses with good clarity.',
      }),
    );

    expect(parsed.overall).toBe(76);
    expect(parsed.notes).toContain('Consistent responses');
  });

  it('maps valid model grading output to weighted score', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                speaking: 90,
                listening: 80,
                vocabulary: 85,
                reading: 75,
                response: 88,
                notes: 'Strong practical usage with minor listening misses.',
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);
    const result = await assessmentServiceTesting.gradeWithModel('test-key', 'ta-IN', SAMPLE_RESPONSES);

    expect(result.subscores.speaking).toBe(90);
    expect(result.subscores.response).toBe(88);
    expect(result.score).toBe(84);
    expect(result.subscores.notes).toContain('Strong practical usage');
  });

  it('uses deterministic fallback when model grading fails upstream', () => {
    const fallback = assessmentServiceTesting.deterministicFallback(
      SAMPLE_RESPONSES,
      'ta-IN',
      'Model grading unavailable. Deterministic fallback scoring used.',
    );

    expect(fallback.score).toBeGreaterThanOrEqual(40);
    expect(fallback.subscores.overall).toBe(fallback.score);
    expect(fallback.feedback).toContain('Deterministic fallback');
  });

  it('enables forced fail mode only with both E2E flags', () => {
    expect(isE2EFailModeEnabled()).toBe(false);

    process.env.EXPO_PUBLIC_E2E_MODE = 'true';
    expect(isE2EFailModeEnabled()).toBe(false);

    process.env.EXPO_PUBLIC_E2E_ASSESSMENT_FORCE_FAIL = 'true';
    expect(isE2EFailModeEnabled()).toBe(true);
  });
});
