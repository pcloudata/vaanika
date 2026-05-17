import { getProviderPlan } from '../providers/providerRouter';
import type { LanguageCode } from '../types/learning';
import { openAiTutorBrainProvider } from './tutor/mockTutorBrainProvider';
import type { TutorBrainProvider } from './tutor/TutorBrainProvider';
import { openAiRealtimeVoiceProvider, sarvamVoiceProvider } from './voice/mockVoiceProviders';
import type { VoiceProvider } from './voice/VoiceProvider';

export type RuntimeProviders = {
  voice: VoiceProvider;
  tutorBrain: TutorBrainProvider;
};

export function getRuntimeProviders(languageCode: LanguageCode): RuntimeProviders {
  const providerPlan = getProviderPlan(languageCode);

  return {
    voice: providerPlan.voiceProvider === 'Sarvam' ? sarvamVoiceProvider : openAiRealtimeVoiceProvider,
    tutorBrain: openAiTutorBrainProvider,
  };
}
