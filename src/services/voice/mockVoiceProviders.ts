import type { LanguageCode, TranscriptResult } from '../../types/learning';
import type { VoiceProvider, VoiceSession, VoiceSessionConfig } from './VoiceProvider';

export const openAiRealtimeVoiceProvider: VoiceProvider = {
  name: 'OpenAI Realtime',
  async startSession(config: VoiceSessionConfig): Promise<VoiceSession> {
    return createMockSession(config, 'OpenAI Realtime', true);
  },
  async transcribe(_audioUri: string, languageCode: LanguageCode): Promise<TranscriptResult> {
    return createMockTranscript(languageCode);
  },
  async synthesize(text: string, languageCode: LanguageCode): Promise<{ audioUri: string }> {
    return {
      audioUri: `mock://openai-realtime/${languageCode}/${encodeURIComponent(text.slice(0, 24))}`,
    };
  },
};

export const sarvamVoiceProvider: VoiceProvider = {
  name: 'Sarvam',
  async startSession(config: VoiceSessionConfig): Promise<VoiceSession> {
    return createMockSession(config, 'Sarvam', false);
  },
  async transcribe(_audioUri: string, languageCode: LanguageCode): Promise<TranscriptResult> {
    return createMockTranscript(languageCode);
  },
  async synthesize(text: string, languageCode: LanguageCode): Promise<{ audioUri: string }> {
    return {
      audioUri: `mock://sarvam/${languageCode}/${encodeURIComponent(text.slice(0, 24))}`,
    };
  },
};

function createMockSession(
  config: VoiceSessionConfig,
  provider: VoiceSession['provider'],
  supportsInterruptions: boolean,
): VoiceSession {
  return {
    id: `${provider.toLowerCase().replaceAll(' ', '-')}-${config.learnerId}-${config.lessonId}`,
    provider,
    supportsInterruptions,
    transcriptEnabled: true,
  };
}

function createMockTranscript(languageCode: LanguageCode): TranscriptResult {
  return {
    confidence: languageCode === 'ta-IN' ? 0.87 : 0.92,
    detectedLanguage: languageCode,
    text: languageCode === 'ta-IN' ? 'Vanakkam, I want to practice Tamil conversation.' : 'I want to practice conversation.',
  };
}
