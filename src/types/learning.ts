export type LanguageCode = 'es-ES' | 'en-US' | 'fr-FR' | 'ta-IN';
export type LearningGoal = 'Conversation' | 'Travel' | 'Work';

export type LearningLanguage = {
  code: LanguageCode;
  name: string;
  focus: string;
};

export type CourseModule = {
  title: string;
  description: string;
  progress: `${number}%`;
};

export type TutorMessage = {
  role: 'tutor' | 'learner';
  text: string;
};

export type VoiceProviderName = 'OpenAI Realtime' | 'Grok Voice' | 'Sarvam';
export type TutorBrainProviderName = 'OpenAI' | 'Sarvam';

export type ProviderPlan = {
  voiceProvider: VoiceProviderName;
  tutorBrainProvider: TutorBrainProviderName;
  rationale: string;
};

export type LearnerProfile = {
  id: string;
  displayName: string;
  targetLanguage: LanguageCode;
  goal: LearningGoal;
  nativeLanguage?: string;
};

export type LessonContext = {
  learner: LearnerProfile;
  lessonId: string;
  lessonTitle: string;
  objective: string;
  weakAreas: string[];
};

export type TutorReply = {
  text: string;
  suggestedNextAction: 'continue_lesson' | 'practice_pronunciation' | 'answer_followup';
};

export type TranscriptResult = {
  text: string;
  confidence: number;
  detectedLanguage: LanguageCode;
};

export type AssessmentDimension = 'speaking' | 'listening' | 'vocabulary' | 'reading' | 'response';

export type AssessmentResponses = Record<AssessmentDimension, string>;

export type AssessmentSubscores = Record<AssessmentDimension, number> & {
  notes: string;
  overall: number;
};
