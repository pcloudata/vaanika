import { COURSE_MODULES } from '../../data/learning';
import type { LessonContext, TutorReply } from '../../types/learning';
import type { AssessmentScore, TutorBrainProvider } from './TutorBrainProvider';

export const openAiTutorBrainProvider: TutorBrainProvider = {
  name: 'OpenAI',
  async generateCourse(): Promise<typeof COURSE_MODULES> {
    return COURSE_MODULES;
  },
  async answerQuestion(context: LessonContext, question: string): Promise<TutorReply> {
    return {
      text: `Let's pause ${context.lessonTitle} and answer that: ${question}`,
      suggestedNextAction: 'answer_followup',
    };
  },
  async scoreAssessment(_context: LessonContext, attemptText: string): Promise<AssessmentScore> {
    const score = Math.min(95, 60 + attemptText.trim().length);

    return {
      feedback: score >= 75 ? 'Ready for the conversation basics badge.' : 'Practice one more roleplay before retrying.',
      passed: score >= 75,
      score,
    };
  },
};
