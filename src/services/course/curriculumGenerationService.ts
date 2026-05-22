import type { DisplayText, LanguageCode, LearningGoal } from '../../types/learning';

export type CurriculumGenerationInput = {
  languageCode: LanguageCode;
  goal: LearningGoal;
  learnerNeed: string;
  level: 'A1' | 'A2' | 'B1';
  providerPlan: {
    voiceProvider: string;
    tutorBrainProvider: string;
  };
};

export type GeneratedLessonPayload = {
  title: string;
  modules: Array<{
    title: string;
    steps: Array<{
      id: string;
      teach: DisplayText;
      example: DisplayText;
      practice: DisplayText;
      rubricKeywords: string[];
    }>;
  }>;
};

export function generateCurriculumFromBlueprint(input: CurriculumGenerationInput): GeneratedLessonPayload {
  const baseTitle =
    input.languageCode === 'te-IN'
      ? 'Telugu Guided Conversation'
      : input.languageCode === 'ta-IN'
        ? 'Tamil Guided Conversation'
        : 'Guided Conversation';

  const needsTravel = input.goal === 'Travel' || input.learnerNeed.toLowerCase().includes('travel');
  const moduleTitle = needsTravel ? 'Travel Greetings and Requests' : 'First Contact and Daily Basics';

  return {
    title: `${baseTitle} (${input.level})`,
    modules: [
      {
        title: moduleTitle,
        steps: buildLanguageSteps(input.languageCode),
      },
    ],
  };
}

function buildLanguageSteps(languageCode: LanguageCode): GeneratedLessonPayload['modules'][number]['steps'] {
  if (languageCode === 'te-IN') {
    return [
      {
        id: 'te-intro',
        teach: { native: 'Introduce yourself politely in Telugu.' },
        example: {
          native: 'తెలుగు: నమస్కారం, మీ పేరు ఏమిటి?',
          transliteration: 'Namaskaram, mee peru emiti?',
        },
        practice: {
          native: 'Say in Telugu: Hello, what is your name?',
          transliteration: 'Mee peru emiti?',
        },
        rubricKeywords: ['namaskaram', 'peru', 'emiti'],
      },
      {
        id: 'te-daily',
        teach: { native: 'Ask if someone finished dinner in Telugu.' },
        example: {
          native: 'తెలుగు: మీరు భోజనం ముగించారా?',
          transliteration: 'Meeru bhojanam muginchara?',
        },
        practice: {
          native: 'Say in Telugu: Did you finish your dinner?',
          transliteration: 'Bhojanam muginchara?',
        },
        rubricKeywords: ['bhojanam', 'mugin', 'meeru'],
      },
    ];
  }

  return [
    {
      id: 'generic-intro',
      teach: { native: 'Introduce yourself politely in the target language.' },
      example: { native: 'Hello, what is your name?' },
      practice: { native: 'Say: Hello, what is your name?' },
      rubricKeywords: ['hello', 'name'],
    },
  ];
}

