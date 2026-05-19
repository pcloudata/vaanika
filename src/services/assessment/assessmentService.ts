import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';
import type { LanguageCode } from '../../types/learning';

export type AssessmentOutcome = {
  assessmentId: string | null;
  attemptId: string | null;
  badgeAwardId: string | null;
  badgeTitle: string;
  feedback: string;
  passed: boolean;
  score: number;
};

type SubmitAssessmentParams = {
  courseId: string;
  languageCode: LanguageCode;
  learnerId: string;
  providerName: string;
};

export async function submitAssessmentAttempt(params: SubmitAssessmentParams): Promise<AssessmentOutcome> {
  const computed = await computeAssessmentScore(params);
  const score = computed.score;
  const passed = computed.passed;
  const feedback = computed.feedback;
  const badgeTitle = getBadgeTitle(params.languageCode);

  if (!isSupabaseConfigured || !supabase) {
    return {
      assessmentId: null,
      attemptId: null,
      badgeAwardId: null,
      badgeTitle,
      feedback,
      passed,
      score,
    };
  }

  const assessmentId = await ensureAssessment(params.courseId, badgeTitle);
  const { data: attempt, error: attemptError } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: assessmentId,
      feedback: `${feedback} Scored by ${params.providerName}.`,
      learner_id: params.learnerId,
      passed,
      score,
    })
    .select('id')
    .single();

  if (attemptError) {
    throw attemptError;
  }

  let badgeAwardId: string | null = null;
  if (passed) {
    const badgeId = await ensureBadgeForLanguage(params.languageCode, badgeTitle);
    const { data: award, error: awardError } = await supabase
      .from('badge_awards')
      .upsert(
        {
          assessment_attempt_id: attempt.id,
          badge_id: badgeId,
          learner_id: params.learnerId,
          score,
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
    feedback,
    passed,
    score,
  };
}

async function computeAssessmentScore(params: SubmitAssessmentParams): Promise<{
  feedback: string;
  passed: boolean;
  score: number;
}> {
  if (!isSupabaseConfigured || !supabase) {
    const fallbackScore = params.languageCode === 'ta-IN' ? 76 : 78;
    return {
      feedback: 'Baseline scoring used in local mode. Complete more lessons for stronger confidence.',
      passed: fallbackScore >= 75,
      score: fallbackScore,
    };
  }

  const [masteryResult, sessionsResult] = await Promise.all([
    supabase
      .from('mastery_scores')
      .select('score')
      .eq('learner_id', params.learnerId)
      .eq('course_id', params.courseId),
    supabase
      .from('lesson_sessions')
      .select('id')
      .eq('learner_id', params.learnerId)
      .eq('status', 'completed'),
  ]);

  if (masteryResult.error) {
    throw masteryResult.error;
  }

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const masteryScores = masteryResult.data ?? [];
  const completedSessionCount = sessionsResult.data?.length ?? 0;
  if (completedSessionCount < 1) {
    throw new Error('Complete at least one lesson session before submitting assessment.');
  }
  const masteryAverage =
    masteryScores.length > 0
      ? masteryScores.reduce((sum, row) => sum + row.score, 0) / masteryScores.length
      : 62;

  const sessionBonus = Math.min(12, completedSessionCount * 3);
  const score = clamp(Math.round(masteryAverage * 0.85 + sessionBonus), 40, 98);
  const passed = score >= 75;

  return {
    feedback: passed
      ? `Strong overall performance with ${completedSessionCount} completed lesson session${
          completedSessionCount === 1 ? '' : 's'
        }.`
      : 'Assessment result indicates more guided practice is needed before certification.',
    passed,
    score,
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
        pronunciation: 20,
        reading: 20,
        response: 20,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
