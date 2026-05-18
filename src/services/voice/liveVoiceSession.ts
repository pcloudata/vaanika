import { requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import type { LanguageCode } from '../../types/learning';
import type { VoiceProviderName } from '../../types/learning';

const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';
const SARVAM_BASE_URL = process.env.EXPO_PUBLIC_SARVAM_BASE_URL ?? 'https://api.sarvam.ai';
const SARVAM_TIMEOUT_MS = 12000;

export async function prepareVoiceRuntime() {
  console.log('[voice] prepareVoiceRuntime: requesting microphone permission');
  const permission = await requestRecordingPermissionsAsync();
  console.log('[voice] prepareVoiceRuntime: permission status', permission.status);
  if (!permission.granted) {
    throw new Error('Microphone permission is required for voice interruptions.');
  }

  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

export async function speakTutorLine(text: string, languageCode: LanguageCode, providerName?: VoiceProviderName) {
  console.log('[voice] speakTutorLine: start', { languageCode, providerName, preview: text.slice(0, 80) });
  await stopTutorSpeech(providerName);

  try {
    if (providerName === 'Sarvam' && languageCode === 'ta-IN') {
      await speakWithSarvamTts(text);
      return;
    }
    await speakWithOptions(text, languageCode);
  } catch (error) {
    console.log('[voice] speakTutorLine: primary language speak failed, retrying default voice');
    await speakWithOptions(text);
    console.log('[voice] speakTutorLine: fallback voice completed after primary failure', getErrorMessage(error));
  }
}

export async function stopTutorSpeech(_providerName?: VoiceProviderName) {
  console.log('[voice] stopTutorSpeech: stopping speech');
  Speech.stop();
}

export async function transcribeRecordedAudio(
  uri: string | null,
  languageCode: LanguageCode,
  providerName?: VoiceProviderName,
): Promise<string> {
  console.log('[voice] stopRecordingAndTranscribe: uri available', Boolean(uri));

  if (!uri) {
    throw new Error('No audio captured.');
  }

  if (providerName === 'Sarvam' && languageCode === 'ta-IN') {
    try {
      const sarvamTranscript = await transcribeWithSarvam(uri);
      if (sarvamTranscript) {
        console.log('[voice] stopRecordingAndTranscribe: used sarvam transcript');
        return sarvamTranscript;
      }
    } catch (error) {
      console.log('[voice] stopRecordingAndTranscribe: sarvam failed, falling back', getErrorMessage(error));
    }
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  console.log('[voice] stopRecordingAndTranscribe: has API key', Boolean(apiKey));
  if (!apiKey) {
    console.log('[voice] stopRecordingAndTranscribe: using fallback transcript');
    return fallbackTranscript(languageCode);
  }

  const formData = new FormData();
  formData.append('model', TRANSCRIBE_MODEL);
  formData.append('language', toWhisperLanguage(languageCode));
  formData.append('file', {
    uri,
    name: 'interruption.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[voice] stopRecordingAndTranscribe: transcription failed', response.status);
    throw new Error(`Transcription failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as { text?: string };
  console.log('[voice] stopRecordingAndTranscribe: payload text present', Boolean(payload.text));
  if (!payload.text) {
    throw new Error('Transcription returned no text.');
  }

  return payload.text.trim();
}

export async function buildFollowUpReply(learnerText: string, languageCode: LanguageCode): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackFollowUpReply(learnerText, languageCode);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise language tutor. Answer learner follow-ups directly. Include one short example in the target language and its English meaning. Keep answer under 55 words.',
        },
        {
          role: 'user',
          content: `Target language: ${languageLabel(languageCode)}. Learner asked: ${learnerText}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.log('[voice] buildFollowUpReply: completion failed', response.status);
    return fallbackFollowUpReply(learnerText, languageCode);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return fallbackFollowUpReply(learnerText, languageCode);
  }

  return content;
}

export async function buildSpokenFollowUpReply(
  learnerText: string,
  languageCode: LanguageCode,
  displayReply: string,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackSpokenReply(displayReply, languageCode);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Convert tutor content to a spoken answer. Keep only the direct answer plus one short example. Avoid labels like Example/Translation, avoid brackets/romanization, under 28 words.',
        },
        {
          role: 'user',
          content: `Target language: ${languageLabel(languageCode)}. Learner asked: ${learnerText}. Tutor display reply: ${displayReply}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return fallbackSpokenReply(displayReply, languageCode);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return fallbackSpokenReply(displayReply, languageCode);
  }

  return normalizeSpokenReply(content, languageCode);
}

function toWhisperLanguage(languageCode: LanguageCode): string {
  if (languageCode === 'ta-IN') {
    return 'ta';
  }

  if (languageCode === 'es-ES') {
    return 'es';
  }

  if (languageCode === 'fr-FR') {
    return 'fr';
  }

  return 'en';
}

function fallbackTranscript(languageCode: LanguageCode): string {
  if (languageCode === 'ta-IN') {
    return 'Konjam medhuva sollunga please.';
  }

  return 'Can you repeat that more slowly?';
}

function getInterruptionPhrase(languageCode: LanguageCode): string {
  if (languageCode === 'ta-IN') {
    return 'Nalla kelvi.';
  }

  if (languageCode === 'es-ES') {
    return 'Buena pregunta.';
  }

  if (languageCode === 'fr-FR') {
    return 'Bonne question.';
  }

  return 'Great question.';
}

function languageLabel(languageCode: LanguageCode): string {
  if (languageCode === 'ta-IN') {
    return 'Tamil';
  }

  if (languageCode === 'es-ES') {
    return 'Spanish';
  }

  if (languageCode === 'fr-FR') {
    return 'French';
  }

  return 'English';
}

function fallbackFollowUpReply(learnerText: string, languageCode: LanguageCode): string {
  const normalized = learnerText.toLowerCase();
  const asksNameQuestion =
    normalized.includes('name') || normalized.includes('what is your name') || normalized.includes('how do you say');

  if (languageCode === 'ta-IN') {
    if (asksNameQuestion) {
      return 'In Tamil, "What is your name?" is "Ungal peyar enna?" Example: "Vanakkam, ungal peyar enna?" means "Hello, what is your name?"';
    }
    return 'Tamil example: "Naan innum kathukkiren" means "I am still learning." Now let us continue.';
  }

  if (languageCode === 'es-ES') {
    return 'Spanish example: "Como te llamas?" means "What is your name?" Now let us continue.';
  }

  if (languageCode === 'fr-FR') {
    return 'French example: "Comment tu t appelles ?" means "What is your name?" Now let us continue.';
  }

  return `${getInterruptionPhrase(languageCode)} I can explain that with a short example: "Could you repeat that?" is a polite clarification request.`;
}

function fallbackSpokenReply(displayReply: string, languageCode: LanguageCode): string {
  const short = normalizeSpokenReply(displayReply, languageCode);

  if (short.length > 0) {
    return short;
  }

  return languageCode === 'ta-IN'
    ? 'Tamil phrase ready. Shall we continue?'
    : 'Answer ready. Shall we continue?';
}

function normalizeSpokenReply(text: string, languageCode: LanguageCode): string {
  const noQuotes = text.replace(/["']/g, '');
  const noParens = noQuotes.replace(/\([^)]*\)/g, '');
  const noLabels = noParens.replace(/Example:|Translation:|It means|For instance|You asked:/gi, '');
  const noNewlines = noLabels.replace(/\n+/g, ' ');
  const condensed = noNewlines.replace(/\s+/g, ' ').trim();
  const firstTwoSentences = condensed.split(/[.!?]/).filter(Boolean).slice(0, 2).join('. ').trim();
  const base = firstTwoSentences.length > 0 ? `${firstTwoSentences}.` : condensed;
  const words = base.split(/\s+/).filter(Boolean);

  if (words.length <= 30) {
    return base;
  }

  const truncated = words.slice(0, 30).join(' ');
  if (languageCode === 'ta-IN') {
    return `${truncated}.`;
  }

  return `${truncated}.`;
}

async function transcribeWithSarvam(uri: string): Promise<string> {
  const sarvamKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
  if (!sarvamKey) {
    throw new Error('Sarvam API key is missing.');
  }

  const formData = new FormData();
  formData.append('model', 'saaras:v3');
  formData.append('with_diarization', 'false');
  formData.append('file', {
    uri,
    name: 'interruption.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const response = await fetchWithTimeout(`${SARVAM_BASE_URL}/speech-to-text-translate`, {
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sarvam STT failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { transcript?: string };
  if (!payload.transcript || !payload.transcript.trim()) {
    throw new Error('Sarvam STT returned empty transcript.');
  }

  return payload.transcript.trim();
}

async function speakWithSarvamTts(text: string): Promise<void> {
  const sarvamKey = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
  if (!sarvamKey) {
    throw new Error('Sarvam API key is missing.');
  }

  const response = await fetchWithTimeout(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'bulbul:v2',
      speaker: 'anushka',
      target_language_code: 'ta-IN',
      pace: 0.9,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sarvam TTS failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    audio?: string;
    audio_base64?: string;
    audios?: string[];
  };
  const audioBase64 = payload.audio_base64 ?? payload.audio ?? payload.audios?.[0];
  if (!audioBase64) {
    throw new Error('Sarvam TTS returned no audio payload.');
  }
  console.log('[voice] speakWithSarvamTts: received audio payload', { length: audioBase64.length });
  // For this iteration we validate Sarvam TTS response and use platform playback for reliability.
  await speakWithOptions(text, 'ta-IN');
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function speakWithOptions(text: string, languageCode?: LanguageCode): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language: languageCode,
      pitch: languageCode === 'ta-IN' ? 1.0 : 1.05,
      rate: languageCode === 'ta-IN' ? 0.88 : 0.96,
      onDone: () => {
        console.log('[voice] speakTutorLine: done');
        resolve();
      },
      onStopped: () => {
        console.log('[voice] speakTutorLine: stopped');
        resolve();
      },
      onError: (error) => {
        console.log('[voice] speakTutorLine: onError', JSON.stringify(error));
        reject(new Error('Tutor speech playback failed.'));
      },
    });
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}
