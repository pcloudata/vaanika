import type { LanguageCode } from '../../types/learning';

export type LessonStep = {
  id: string;
  title: string;
  teachLine: string;
  practicePrompt: string;
  expectedKeywords: string[];
};

export type LessonPlan = {
  title: string;
  steps: LessonStep[];
};

export type PracticeEvaluation = {
  feedback: string;
  passed: boolean;
};

export function getLessonPlan(languageCode: LanguageCode): LessonPlan {
  if (languageCode === 'ta-IN') {
    return {
      title: 'Tamil Conversation Basics',
      steps: [
        {
          id: 'intro-name',
          title: 'Self-introduction',
          teachLine: 'Today we practice introducing yourself politely in Tamil.',
          practicePrompt: 'Say: Hello, what is your name?',
          expectedKeywords: ['vanakkam', 'peyar', 'enna'],
        },
        {
          id: 'dinner-check',
          title: 'Daily conversation',
          teachLine: 'Now we practice asking if someone finished dinner.',
          practicePrompt: 'Say: Did you finish your dinner?',
          expectedKeywords: ['iravu', 'unavu', 'mudith'],
        },
      ],
    };
  }

  if (languageCode === 'es-ES') {
    return {
      title: 'Spanish Conversation Basics',
      steps: [
        {
          id: 'intro-name',
          title: 'Self-introduction',
          teachLine: 'Today we practice greeting and asking someone their name.',
          practicePrompt: 'Say: Hello, what is your name?',
          expectedKeywords: ['hola', 'como', 'llamas'],
        },
        {
          id: 'dinner-check',
          title: 'Daily conversation',
          teachLine: 'Now we practice asking if someone finished dinner.',
          practicePrompt: 'Say: Did you finish your dinner?',
          expectedKeywords: ['terminaste', 'cena'],
        },
      ],
    };
  }

  if (languageCode === 'fr-FR') {
    return {
      title: 'French Conversation Basics',
      steps: [
        {
          id: 'intro-name',
          title: 'Self-introduction',
          teachLine: 'Today we practice greeting and asking someone their name.',
          practicePrompt: 'Say: Hello, what is your name?',
          expectedKeywords: ['bonjour', 'comment', 'appelles'],
        },
        {
          id: 'dinner-check',
          title: 'Daily conversation',
          teachLine: 'Now we practice asking if someone finished dinner.',
          practicePrompt: 'Say: Did you finish your dinner?',
          expectedKeywords: ['as', 'fini', 'diner'],
        },
      ],
    };
  }

  return {
    title: 'English Conversation Basics',
    steps: [
      {
        id: 'intro-name',
        title: 'Self-introduction',
        teachLine: 'Today we practice simple introductions.',
        practicePrompt: 'Say: Hello, what is your name?',
        expectedKeywords: ['hello', 'name'],
      },
      {
        id: 'dinner-check',
        title: 'Daily conversation',
        teachLine: 'Now we practice asking a daily routine question.',
        practicePrompt: 'Say: Did you finish your dinner?',
        expectedKeywords: ['finish', 'dinner'],
      },
    ],
  };
}

export function buildStepGuidance(step: LessonStep, languageName: string): string {
  return `${step.teachLine} In ${languageName}, practice now: ${step.practicePrompt}`;
}

export async function evaluatePracticeResponse(
  learnerText: string,
  step: LessonStep,
  languageCode: LanguageCode,
): Promise<PracticeEvaluation> {
  const heuristic = evaluateWithHeuristics(learnerText, step, languageCode);
  if (heuristic) {
    return heuristic;
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackEvaluation(learnerText, step);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a language tutor evaluator. Accept transliteration and code-mixed attempts as valid progress when meaning is correct. Return JSON with keys: passed(boolean) and feedback(string <=24 words).',
        },
        {
          role: 'user',
          content: `Language code: ${languageCode}. Exercise: ${step.practicePrompt}. Expected keywords: ${step.expectedKeywords.join(
            ', ',
          )}. Learner said: ${learnerText}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return fallbackEvaluation(learnerText, step);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    return fallbackEvaluation(learnerText, step);
  }

  try {
    const parsed = JSON.parse(raw) as { passed?: boolean; feedback?: string };
    return {
      passed: Boolean(parsed.passed),
      feedback: parsed.feedback?.trim() || 'Good attempt. Let us continue.',
    };
  } catch {
    return fallbackEvaluation(learnerText, step);
  }
}

export function isLikelyFollowUpQuestion(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes('?') ||
    normalized.startsWith('how') ||
    normalized.startsWith('what') ||
    normalized.startsWith('can') ||
    normalized.startsWith('why') ||
    normalized.startsWith('when') ||
    normalized.startsWith('where')
  );
}

export function classifyLearnerUtterance(
  text: string,
  step: LessonStep,
  languageCode: LanguageCode,
): 'practice' | 'followup' | 'unclear' {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 4) {
    return 'unclear';
  }

  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  if (tokenCount <= 1) {
    return 'unclear';
  }

  const hasQuestionShape = isLikelyFollowUpQuestion(normalized);
  const hasExplicitFollowUpCue =
    normalized.startsWith('tell me') ||
    normalized.includes('how do you say') ||
    normalized.includes('what does') ||
    normalized.includes('meaning of') ||
    normalized.includes('in tamil') ||
    normalized.includes('translate') ||
    normalized.includes('how to say');
  const matchesPracticeIntent = matchesStepIntent(normalized, step, languageCode);

  if (hasExplicitFollowUpCue) {
    return 'followup';
  }

  if (matchesPracticeIntent) {
    return 'practice';
  }

  if (hasQuestionShape) {
    return 'followup';
  }

  return 'practice';
}

function fallbackEvaluation(learnerText: string, step: LessonStep): PracticeEvaluation {
  const normalized = learnerText.toLowerCase();
  const score = step.expectedKeywords.reduce((count, keyword) => (normalized.includes(keyword.toLowerCase()) ? count + 1 : count), 0);
  if (score >= Math.max(1, Math.ceil(step.expectedKeywords.length / 2))) {
    return {
      passed: true,
      feedback: 'Nice delivery. That was understandable and natural.',
    };
  }

  return {
    passed: false,
    feedback: 'Good try. Repeat once with the key phrase more clearly.',
  };
}

function matchesStepIntent(normalizedText: string, step: LessonStep, languageCode: LanguageCode): boolean {
  if (step.id === 'intro-name') {
    if (languageCode === 'ta-IN') {
      return (
        normalizedText.includes('name') ||
        normalizedText.includes('peyar') ||
        normalizedText.includes('enna') ||
        normalizedText.includes('your name')
      );
    }
    return normalizedText.includes('name') || normalizedText.includes('your name');
  }

  if (step.id === 'dinner-check') {
    if (languageCode === 'ta-IN') {
      return (
        normalizedText.includes('dinner') ||
        normalizedText.includes('iravu') ||
        normalizedText.includes('unavu') ||
        normalizedText.includes('saapadu')
      );
    }
    return normalizedText.includes('dinner') || normalizedText.includes('finish');
  }

  return false;
}

function evaluateWithHeuristics(
  learnerText: string,
  step: LessonStep,
  languageCode: LanguageCode,
): PracticeEvaluation | null {
  const normalized = learnerText.trim().toLowerCase();

  if (languageCode === 'ta-IN' && step.id === 'intro-name') {
    const hasTamilGreeting =
      normalized.includes('vanakkam') || normalized.includes('வணக்கம்') || normalized.includes('greetings') || normalized.includes('hello');
    const hasNameIntent =
      normalized.includes('name') ||
      normalized.includes('peyar') ||
      normalized.includes('per') ||
      normalized.includes('enna') ||
      normalized.includes('what is your name');

    if (hasTamilGreeting && hasNameIntent) {
      return {
        passed: true,
        feedback: 'Great meaning. Next time add more Tamil words: "Vanakkam, ungal peyar enna?"',
      };
    }
  }

  if (languageCode === 'ta-IN' && step.id === 'dinner-check') {
    const hasDinnerIntent =
      normalized.includes('dinner') ||
      normalized.includes('iravu unavu') ||
      normalized.includes('saapadu') ||
      normalized.includes('சாப்பாடு');
    const hasFinishIntent =
      normalized.includes('finish') || normalized.includes('mudich') || normalized.includes('mudith');

    if (hasDinnerIntent && hasFinishIntent) {
      return {
        passed: true,
        feedback: 'Good intent and structure. Try the full Tamil phrase once for fluency.',
      };
    }
  }

  return null;
}
