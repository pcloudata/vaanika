import { COURSE_MODULES } from '../../data/learning';
import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';
import type { CourseModule, LearnerProfile } from '../../types/learning';

export type GeneratedCourse = {
  id: string;
  learnerId: string;
  modules: CourseModule[];
};

export async function generateMockCourse(profile: LearnerProfile): Promise<GeneratedCourse> {
  return {
    id: `${profile.id}-${profile.targetLanguage}-conversation-basics`,
    learnerId: profile.id,
    modules: COURSE_MODULES,
  };
}

export async function saveGeneratedCourse(
  profile: LearnerProfile,
  generatedCourse: GeneratedCourse,
): Promise<GeneratedCourse> {
  if (!isSupabaseConfigured || !supabase) {
    return generatedCourse;
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      goal: profile.goal,
      language_code: profile.targetLanguage,
      learner_id: profile.id,
      title: `${profile.targetLanguage} Conversation Basics`,
    })
    .select('id')
    .single();

  if (courseError) {
    throw courseError;
  }

  const modules = generatedCourse.modules.map((module, index) => ({
    course_id: course.id,
    description: module.description,
    position: index + 1,
    progress_percent: Number.parseInt(module.progress.replace('%', ''), 10),
    title: module.title,
  }));

  const { error: modulesError } = await supabase.from('course_modules').insert(modules);

  if (modulesError) {
    throw modulesError;
  }

  return {
    ...generatedCourse,
    id: course.id,
  };
}

export async function getLatestCourseForLearner(learnerId: string): Promise<GeneratedCourse | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, learner_id')
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (courseError) {
    throw courseError;
  }

  if (!course) {
    return null;
  }

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('title, description, progress_percent')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  if (modulesError) {
    throw modulesError;
  }

  return {
    id: course.id,
    learnerId: course.learner_id,
    modules: (modules ?? []).map((module) => ({
      description: module.description,
      progress: `${module.progress_percent}%`,
      title: module.title,
    })),
  };
}
