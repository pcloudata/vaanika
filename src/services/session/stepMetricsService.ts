import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';

export type StepEventType = 'practice_pass' | 'practice_retry' | 'followup' | 'unclear';

type RecordStepEventParams = {
  lessonSessionId: string;
  stepId: string;
  stepIndex: number;
  eventType: StepEventType;
  learnerText: string;
  tutorText: string;
};

export async function recordLessonStepEvent(params: RecordStepEventParams) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const payload = buildLessonStepEventInsert(params);
  const { error } = await supabase.from('lesson_step_events').insert(payload);

  if (error) {
    throw error;
  }
}

export function buildLessonStepEventInsert(params: RecordStepEventParams) {
  return {
    event_type: params.eventType,
    learner_text: params.learnerText,
    lesson_session_id: params.lessonSessionId,
    step_id: params.stepId,
    step_index: params.stepIndex,
    tutor_text: params.tutorText,
  };
}
