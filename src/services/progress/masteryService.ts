import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';

type PracticeOutcomeParams = {
  courseId: string;
  learnerId: string;
  passed: boolean;
};

const BASELINE_SCORE = 50;
const PASS_DELTA = 6;
const FAIL_DELTA = -2;

export async function recordPracticeOutcome(params: PracticeOutcomeParams) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  await Promise.all([
    upsertSkillScore(params, 'speaking'),
    upsertSkillScore(params, 'confidence'),
  ]);
}

async function upsertSkillScore(
  params: PracticeOutcomeParams,
  skill: 'speaking' | 'confidence',
) {
  if (!supabase) {
    return;
  }

  const { data: existing, error: readError } = await supabase
    .from('mastery_scores')
    .select('score')
    .eq('learner_id', params.learnerId)
    .eq('course_id', params.courseId)
    .eq('skill', skill)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  const current = existing?.score ?? BASELINE_SCORE;
  const next = clamp(current + (params.passed ? PASS_DELTA : FAIL_DELTA), 0, 100);

  const { error: upsertError } = await supabase.from('mastery_scores').upsert(
    {
      learner_id: params.learnerId,
      course_id: params.courseId,
      skill,
      score: next,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'learner_id,course_id,skill',
    },
  );

  if (upsertError) {
    throw upsertError;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
