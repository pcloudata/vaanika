import type { LanguageCode, ProviderPlan } from '../types/learning';

const GLOBAL_LANGUAGE_PLAN: ProviderPlan = {
  voiceProvider: 'OpenAI Realtime',
  tutorBrainProvider: 'OpenAI',
  rationale:
    'Use realtime speech-to-speech for natural turn-taking, interruptions, transcripts, and lesson progress tool calls.',
};

const TAMIL_LANGUAGE_PLAN: ProviderPlan = {
  voiceProvider: 'Sarvam',
  tutorBrainProvider: 'OpenAI',
  rationale:
    'Use Sarvam for Tamil speech recognition and synthesis experiments while keeping lesson reasoning and scoring provider-independent.',
};

export function getProviderPlan(languageCode: LanguageCode): ProviderPlan {
  if (languageCode === 'ta-IN') {
    return TAMIL_LANGUAGE_PLAN;
  }

  return GLOBAL_LANGUAGE_PLAN;
}
