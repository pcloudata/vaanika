import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';
import type { ProviderPlan } from '../../types/learning';

type StartSessionParams = {
  courseId: string;
  learnerId: string;
  providerPlan: ProviderPlan;
};

export async function startTrackedLessonSession(params: StartSessionParams): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const lessonId = await ensureLessonForCourse(params.courseId);
  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert({
      lesson_id: lessonId,
      learner_id: params.learnerId,
      voice_provider: params.providerPlan.voiceProvider,
      tutor_brain_provider: params.providerPlan.tutorBrainProvider,
      status: 'started',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function appendTranscriptTurn(params: {
  sessionId: string;
  speaker: 'learner' | 'tutor';
  text: string;
  provider: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from('transcripts').insert({
    lesson_session_id: params.sessionId,
    speaker: params.speaker,
    text: params.text,
    provider: params.provider,
  });

  if (error) {
    throw error;
  }
}

export async function completeTrackedLessonSession(sessionId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { data: updatedSession, error: sessionError } = await supabase
    .from('lesson_sessions')
    .update({
      ended_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', sessionId)
    .select('lesson_id')
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const { error: lessonError } = await supabase
    .from('lessons')
    .update({ completion_status: 'completed' })
    .eq('id', updatedSession.lesson_id);

  if (lessonError) {
    throw lessonError;
  }

  const { data: lesson, error: lessonReadError } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', updatedSession.lesson_id)
    .single();

  if (lessonReadError) {
    throw lessonReadError;
  }

  const { error: moduleProgressError } = await supabase
    .from('course_modules')
    .update({ progress_percent: 100 })
    .eq('id', lesson.module_id);

  if (moduleProgressError) {
    throw moduleProgressError;
  }
}

async function ensureLessonForCourse(courseId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is unavailable.');
  }

  const { data: module, error: moduleError } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (moduleError) {
    throw moduleError;
  }

  if (!module) {
    throw new Error('No course module found. Generate a course first.');
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', module.id)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lessonError) {
    throw lessonError;
  }

  if (lesson) {
    return lesson.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('lessons')
    .insert({
      module_id: module.id,
      position: 1,
      title: 'Conversation practice',
      objective: 'Practice interruption-driven spoken tutoring.',
      scenario: 'Interactive voice coaching',
      completion_status: 'in_progress',
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id;
}
