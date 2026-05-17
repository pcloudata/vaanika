import type { LanguageCode, TranscriptResult, VoiceProviderName } from '../../types/learning';

export type VoiceSessionConfig = {
  learnerId: string;
  languageCode: LanguageCode;
  lessonId: string;
};

export type VoiceSession = {
  id: string;
  provider: VoiceProviderName;
  supportsInterruptions: boolean;
  transcriptEnabled: boolean;
};

export type VoiceProvider = {
  name: VoiceProviderName;
  startSession(config: VoiceSessionConfig): Promise<VoiceSession>;
  transcribe(audioUri: string, languageCode: LanguageCode): Promise<TranscriptResult>;
  synthesize(text: string, languageCode: LanguageCode): Promise<{ audioUri: string }>;
};
