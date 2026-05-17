export type BackendEntity =
  | 'users'
  | 'learner_profiles'
  | 'courses'
  | 'course_modules'
  | 'lessons'
  | 'lesson_sessions'
  | 'transcripts'
  | 'mastery_scores'
  | 'assessments'
  | 'assessment_attempts'
  | 'badges'
  | 'badge_awards';

export const backendSchemaPlan: Record<BackendEntity, string> = {
  users: 'Supabase auth-owned user identity and account metadata.',
  learner_profiles: 'Target language, native language, learning goal, consent flags, and onboarding preferences.',
  courses: 'Generated adaptive course per learner and language.',
  course_modules: 'Ordered module groups inside a generated course.',
  lessons: 'Lesson objective, scenario, vocabulary targets, grammar targets, and completion rules.',
  lesson_sessions: 'Each tutor session with provider route, start/end timestamps, status, and completion events.',
  transcripts: 'Optional learner/tutor transcript messages tied to a lesson session.',
  mastery_scores: 'Skill-level progress for speaking, listening, vocabulary, reading, and confidence.',
  assessments: 'Badge assessment definitions and rubrics.',
  assessment_attempts: 'Learner answers, spoken task transcript, model score, human-readable feedback, and pass/fail result.',
  badges: 'Internal skill badge definitions such as Tamil Conversation Basics.',
  badge_awards: 'Issued badge records with learner, language, score, and issue timestamp.',
};

export const edgeFunctionPlan = [
  'create-realtime-session-token',
  'generate-adaptive-course',
  'record-lesson-event',
  'score-assessment-attempt',
  'issue-skill-badge',
] as const;
