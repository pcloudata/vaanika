import { COURSE_MODULES } from '../../data/learning';
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
