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

  if (lessonStatus === 'complete') {
    return { allowed: true, reason: null };
  }

  const hasCompletedModule = Boolean(
    modules?.some((module) => {
      const value = Number.parseInt(module.progress.replace('%', ''), 10);
      return !Number.isNaN(value) && value >= 100;
    }),
  );

  if (!hasCompletedModule) {
    return {
      allowed: false,
      reason: 'Complete at least one module or one full lesson before assessment.',
    };
  }

  return { allowed: true, reason: null };
}
