import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';
import type { AssessmentDimension, AssessmentResponses, AssessmentSubscores, LanguageCode } from '../../types/learning';

export type AssessmentOutcome = {
  assessmentId: string | null;
  attemptId: string | null;
  badgeAwardId: string | null;
  badgeTitle: string;
  feedback: string;
  passed: boolean;
  score: number;
  subscores: AssessmentSubscores;
};

type SubmitAssessmentParams = {
  courseId: string;
  languageCode: LanguageCode;
  learnerId: string;
  providerName: string;
  responsesByTask: AssessmentResponses;
};

type AssessmentComputation = {
  feedback: string;
  passed: boolean;
  score: number;
  subscores: AssessmentSubscores;
};

type AssessmentEligibilitySignals = {
  completedLessonCount: number;
  completedSessionCount: number;
};

const MODEL_NAME = 'gpt-4o-mini';
const PASS_THRESHOLD = 75;
const DIMENSIONS: AssessmentDimension[] = ['speaking', 'listening', 'vocabulary', 'reading', 'response'];

export async function submitAssessmentAttempt(params: SubmitAssessmentParams): Promise<AssessmentOutcome> {
  const computed = await computeAssessmentScore(params);
  const badgeTitle = getBadgeTitle(params.languageCode);

  if (!isSupabaseConfigured || !supabase) {
    return {
      assessmentId: null,
      attemptId: null,
      badgeAwardId: null,
      badgeTitle,
      feedback: computed.feedback,
      passed: computed.passed,
      score: computed.score,
      subscores: computed.subscores,
    };
  }

  const assessmentId = await ensureAssessment(params.courseId, badgeTitle);
  const payload = buildFeedbackPayload(computed);
  const { data: attempt, error: attemptError } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      feedback: JSON.stringify(payload),
      learner_id: params.learnerId,
      passed: computed.passed,
      score: computed.score,
    })
    .select('id')
    .single();

  if (attemptError) {
    throw attemptError;
  }

  let badgeAwardId: string | null = null;
  if (computed.passed) {
    const badgeId = await ensureBadgeForLanguage(params.languageCode, badgeTitle);
    const { data: award, error: awardError } = await supabase
      .from('badge_awards')
      .upsert(
        {
          assessment_attempt_id: attempt.id,
          badge_id: badgeId,
          learner_id: params.learnerId,
          score: computed.score,
        },
        { onConflict: 'badge_id,learner_id' },
      )
      .select('id')
      .single();

    if (awardError) {
      throw awardError;
    }

    badgeAwardId = award.id;
  }

  return {
    assessmentId,
    attemptId: attempt.id,
    badgeAwardId,
    badgeTitle,
    feedback: computed.feedback,
    passed: computed.passed,
    score: computed.score,
    subscores: computed.subscores,
  };
}

export function parseAssessmentFeedback(feedback: string): Partial<AssessmentSubscores> & { notes?: string } {
  try {
    const parsed = JSON.parse(feedback) as Partial<AssessmentSubscores> & { notes?: string };
    return parsed;
  } catch {
    return { notes: feedback };
  }
}

export function isEligibleForAssessment(signals: AssessmentEligibilitySignals): boolean {
  return signals.completedSessionCount >= 1 && signals.completedLessonCount >= 1;
}

export function computeWeightedOverall(subscores: Omit<AssessmentSubscores, 'overall' | 'notes'>): number {
  return Math.round(
    subscores.speaking * 0.25 +
      subscores.listening * 0.2 +
      subscores.vocabulary * 0.2 +
      subscores.reading * 0.15 +
      subscores.response * 0.2,
  );
}

async function computeAssessmentScore(params: SubmitAssessmentParams): Promise<AssessmentComputation> {
  if (!isSupabaseConfigured || !supabase) {
    return deterministicFallback(params.responsesByTask, params.languageCode, 'Local mode fallback scoring used.');
  }

  const signals = await readEligibilitySignals(params.learnerId, params.courseId);
  if (!isEligibleForAssessment(signals)) {
    throw new Error('Complete at least one lesson and one completed lesson session before submitting assessment.');
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return deterministicFallback(params.responsesByTask, params.languageCode, 'OpenAI key missing. Deterministic fallback scoring used.');
  }

  const grading = await gradeWithModel(apiKey, params.languageCode, params.responsesByTask).catch(() =>
    deterministicFallback(params.responsesByTask, params.languageCode, 'Model grading unavailable. Deterministic fallback scoring used.'),
  );

  const passed = grading.score >= PASS_THRESHOLD;
  const feedback = passed
    ? `${grading.subscores.notes} Passed with strong overall performance.`
    : `${grading.subscores.notes} More guided practice recommended before certification.`;

  return {
    feedback,
    passed,
    score: grading.score,
    subscores: grading.subscores,
  };
}

async function gradeWithModel(
  apiKey: string,
  languageCode: LanguageCode,
  responsesByTask: AssessmentResponses,
): Promise<{ score: number; subscores: AssessmentSubscores }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an assessment grader. Return JSON with integer keys speaking,listening,vocabulary,reading,response (0-100) and notes (<=24 words).',
        },
        {
          role: 'user',
          content: `Language: ${languageCode}. Responses: ${JSON.stringify(responsesByTask)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Model grading failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Model grading returned empty content.');
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const speaking = normalizeScore(parsed.speaking);
  const listening = normalizeScore(parsed.listening);
  const vocabulary = normalizeScore(parsed.vocabulary);
  const reading = normalizeScore(parsed.reading);
  const responseScore = normalizeScore(parsed.response);
  const notes = typeof parsed.notes === 'string' && parsed.notes.trim().length > 0 ? parsed.notes.trim() : 'Balanced performance across assessment dimensions.';

  const overall = computeWeightedOverall({
    speaking,
    listening,
    vocabulary,
    reading,
    response: responseScore,
  });

  return {
    score: overall,
    subscores: {
      speaking,
      listening,
      vocabulary,
      reading,
      response: responseScore,
      overall,
      notes,
    },
  };
}

export const assessmentServiceTesting = {
  deterministicFallback,
  gradeWithModel,
};

async function readEligibilitySignals(learnerId: string, courseId: string): Promise<AssessmentEligibilitySignals> {
  if (!supabase) {
    return { completedLessonCount: 0, completedSessionCount: 0 };
  }

  const [sessionsResult, lessonsResult] = await Promise.all([
    supabase
      .from('lesson_sessions')
      .select('id')
      .eq('learner_id', learnerId)
      .eq('status', 'completed'),
    supabase
      .from('lessons')
      .select('id')
      .eq('completion_status', 'completed')
      .in(
        'module_id',
        (
          await supabase.from('course_modules').select('id').eq('course_id', courseId)
        ).data?.map((row) => row.id) ?? [],
      ),
  ]);

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  if (lessonsResult.error) {
    throw lessonsResult.error;
  }

  return {
    completedLessonCount: lessonsResult.data?.length ?? 0,
    completedSessionCount: sessionsResult.data?.length ?? 0,
  };
}

function deterministicFallback(
  responsesByTask: AssessmentResponses,
  languageCode: LanguageCode,
  note: string,
): AssessmentComputation {
  const lengthScore = Math.min(
    90,
    Math.max(
      45,
      Math.round(
        DIMENSIONS.reduce((sum, key) => sum + responsesByTask[key].trim().split(/\s+/).filter(Boolean).length, 0) /
          DIMENSIONS.length *
          6,
      ),
    ),
  );

  const base = languageCode === 'ta-IN' ? lengthScore + 2 : lengthScore;
  const speaking = clamp(base, 40, 95);
  const listening = clamp(base - 4, 35, 92);
  const vocabulary = clamp(base - 2, 35, 93);
  const reading = clamp(base - 5, 30, 90);
  const response = clamp(base - 1, 35, 94);
  const overall = computeWeightedOverall({ speaking, listening, vocabulary, reading, response });

  const subscores: AssessmentSubscores = {
    speaking,
    listening,
    vocabulary,
    reading,
    response,
    overall,
    notes: note,
  };

  return {
    feedback: `${note} Continue regular tutor-led practice for stronger outcomes.`,
    passed: overall >= PASS_THRESHOLD,
    score: overall,
    subscores,
  };
}

function buildFeedbackPayload(computed: AssessmentComputation) {
  return {
    ...computed.subscores,
    narrative: computed.feedback,
  };
}

async function ensureAssessment(courseId: string, badgeTitle: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const { data: existing, error: readError } = await supabase
    .from('assessments')
    .select('id')
    .eq('course_id', courseId)
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('assessments')
    .insert({
      badge_title: badgeTitle,
      course_id: courseId,
      rubric: {
        listening: 20,
        reading: 15,
        response: 20,
        speaking: 25,
        vocabulary: 20,
      },
      title: 'Mixed assessment',
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return created.id;
}

async function ensureBadgeForLanguage(languageCode: LanguageCode, badgeTitle: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const { data: existing, error: readError } = await supabase
    .from('badges')
    .select('id')
    .eq('language_code', languageCode)
    .eq('title', badgeTitle)
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('badges')
    .insert({
      description: `${badgeTitle} certificate issued after passing mixed assessment.`,
      language_code: languageCode,
      level: 'basics',
      title: badgeTitle,
    })
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return created.id;
}

function getBadgeTitle(languageCode: LanguageCode): string {
  if (languageCode === 'ta-IN') {
    return 'Tamil Conversation Basics';
  }

  if (languageCode === 'es-ES') {
    return 'Spanish Conversation A1: Travel Basics';
  }

  if (languageCode === 'fr-FR') {
    return 'French Conversation Basics';
  }

  return 'English Conversation Basics';
}

function normalizeScore(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return 60;
  }

  return clamp(Math.round(parsed), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
