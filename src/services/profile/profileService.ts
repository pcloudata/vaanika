import { isSupabaseConfigured, supabase } from '../../backend/supabaseClient';
import type { LearnerProfile } from '../../types/learning';

export async function getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('learner_profiles')
    .select('id, display_name, goal, native_language, target_language')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    displayName: data.display_name,
    goal: data.goal,
    nativeLanguage: data.native_language,
    targetLanguage: data.target_language,
  };
}

export async function saveLearnerProfile(profile: LearnerProfile): Promise<LearnerProfile> {
  if (!isSupabaseConfigured || !supabase) {
    return profile;
  }

  const { error } = await supabase.from('learner_profiles').upsert({
    id: profile.id,
    display_name: profile.displayName,
    goal: profile.goal,
    native_language: profile.nativeLanguage,
    target_language: profile.targetLanguage,
  });

  if (error) {
    throw error;
  }

  return profile;
}
