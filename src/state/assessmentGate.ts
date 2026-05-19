import type { CourseModule } from '../types/learning';

export type LessonStatus = 'not_started' | 'in_progress' | 'complete';

export function canSubmitAssessmentFromProgress(
  lessonStatus: LessonStatus,
  modules: CourseModule[] | null | undefined,
): boolean {
  if (lessonStatus === 'in_progress') {
    return false;
  }

  if (lessonStatus === 'complete') {
    return true;
  }

  return Boolean(
    modules?.some((module) => {
      const value = Number.parseInt(module.progress.replace('%', ''), 10);
      return !Number.isNaN(value) && value >= 100;
    }),
  );
}
