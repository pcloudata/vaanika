import type { CourseModule } from '../types/learning';

export type LessonStatus = 'not_started' | 'in_progress' | 'complete';
export type AssessmentEligibility = {
  allowed: boolean;
  reason: string | null;
};

export function canSubmitAssessmentFromProgress(
  lessonStatus: LessonStatus,
  modules: CourseModule[] | null | undefined,
): boolean {
  return getAssessmentEligibilityFromProgress(lessonStatus, modules).allowed;
}

export function getAssessmentEligibilityFromProgress(
  lessonStatus: LessonStatus,
  modules: CourseModule[] | null | undefined,
): AssessmentEligibility {
  if (lessonStatus === 'in_progress') {
    return {
      allowed: false,
      reason: 'Finish the active lesson before submitting the assessment.',
    };
  }

  const completedModules = modules?.reduce((count, module) => {
      const value = Number.parseInt(module.progress.replace('%', ''), 10);
      return !Number.isNaN(value) && value >= 100 ? count + 1 : count;
    }, 0) ?? 0;

  if (lessonStatus === 'complete' && completedModules >= 3) {
    return { allowed: true, reason: null };
  }

  if (completedModules < 3) {
    return {
      allowed: false,
      reason: 'Complete all 3 modules before submitting the assessment.',
    };
  }

  return { allowed: true, reason: null };
}
