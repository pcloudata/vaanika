import type { CourseModule, LessonContext, TutorBrainProviderName, TutorReply } from '../../types/learning';

export type AssessmentScore = {
  passed: boolean;
  score: number;
  feedback: string;
};

export type TutorBrainProvider = {
  name: TutorBrainProviderName;
  generateCourse(context: LessonContext): Promise<CourseModule[]>;
  answerQuestion(context: LessonContext, question: string): Promise<TutorReply>;
  scoreAssessment(context: LessonContext, attemptText: string): Promise<AssessmentScore>;
};
