import type { DisplayText, LanguageCode, LessonPhase } from '../../types/learning';

export type LessonStep = {
  id: string;
  title: string;
  teachLine: DisplayText;
  exampleLine: DisplayText;
  practicePrompt: DisplayText;
  expectedKeywords: string[];
};

export type LessonPlan = {
  title: string;
  moduleTitle?: string;
  steps: LessonStep[];
};

export type PracticeEvaluation = {
  feedback: string;
  passed: boolean;
};

export type LessonRuntimeState = {
  activePhase: LessonPhase;
  activeStepId: string;
  stepIndex: number;
};

type RegionalModule = {
  title: string;
  steps: LessonStep[];
};

export function getLessonPlan(languageCode: LanguageCode, moduleIndex = 0): LessonPlan {
  if (languageCode === 'ta-IN') {
    const modules = buildRegionalDailyLifeModules('ta-IN');
    const active = modules[Math.max(0, Math.min(moduleIndex, modules.length - 1))];
    return {
      title: 'Tamil Guided Tutorial',
      moduleTitle: active.title,
      steps: active.steps,
    };
  }

  if (languageCode === 'te-IN') {
    const modules = buildRegionalDailyLifeModules('te-IN');
    const active = modules[Math.max(0, Math.min(moduleIndex, modules.length - 1))];
    return {
      title: 'Telugu Guided Tutorial',
      moduleTitle: active.title,
      steps: active.steps,
    };
  }

  if (languageCode === 'es-ES') {
    return {
      title: 'Spanish Conversation Basics',
      steps: [
        {
          id: 'intro-name',
          title: 'Self-introduction',
          teachLine: { native: 'Today we practice greeting and asking someone their name.' },
          exampleLine: { native: 'Spanish: "Hola, como te llamas?"' },
          practicePrompt: { native: 'Say in Spanish: Hello, what is your name?' },
          expectedKeywords: ['hola', 'como', 'llamas'],
        },
        {
          id: 'dinner-check',
          title: 'Daily conversation',
          teachLine: { native: 'Now we practice asking if someone finished dinner.' },
          exampleLine: { native: 'Spanish: "Terminaste la cena?"' },
          practicePrompt: { native: 'Say in Spanish: Did you finish your dinner?' },
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
          teachLine: { native: 'Today we practice greeting and asking someone their name.' },
          exampleLine: { native: 'French: "Bonjour, comment tu t appelles ?"' },
          practicePrompt: { native: 'Say in French: Hello, what is your name?' },
          expectedKeywords: ['bonjour', 'comment', 'appelles'],
        },
        {
          id: 'dinner-check',
          title: 'Daily conversation',
          teachLine: { native: 'Now we practice asking if someone finished dinner.' },
          exampleLine: { native: 'French: "Tu as fini le diner ?"' },
          practicePrompt: { native: 'Say in French: Did you finish your dinner?' },
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
        teachLine: { native: 'Today we practice simple introductions.' },
        exampleLine: { native: 'English: "Hello, what is your name?"' },
        practicePrompt: { native: 'Say: Hello, what is your name?' },
        expectedKeywords: ['hello', 'name'],
      },
      {
        id: 'dinner-check',
        title: 'Daily conversation',
        teachLine: { native: 'Now we practice asking a daily routine question.' },
        exampleLine: { native: 'English: "Did you finish your dinner?"' },
        practicePrompt: { native: 'Say: Did you finish your dinner?' },
        expectedKeywords: ['finish', 'dinner'],
      },
    ],
  };
}

export function buildStepGuidance(step: LessonStep, languageName: string): string {
  return `${step.teachLine.native} Example: ${step.exampleLine.native} In ${languageName}, practice now: ${step.practicePrompt.native}`;
}

function buildRegionalDailyLifeModules(languageCode: 'ta-IN' | 'te-IN'): RegionalModule[] {
  const languageLabel = languageCode === 'ta-IN' ? 'Tamil' : 'Telugu';
  const phraseSet =
    languageCode === 'ta-IN'
      ? {
          greeting: { native: 'வணக்கம்', translit: 'Vanakkam' },
          nameQuestion: { native: 'உங்கள் பெயர் என்ன?', translit: 'Ungal peyar enna?' },
          thanks: { native: 'Nandri', translit: 'Nandri' },
        }
      : {
          greeting: { native: 'నమస్కారం', translit: 'Namaskaram' },
          nameQuestion: { native: 'మీ పేరు ఏమిటి?', translit: 'Mee peru emiti?' },
          thanks: { native: 'ధన్యవాదాలు', translit: 'Dhanyavaadalu' },
        };

  const buildModuleSteps = (
    moduleSlug: string,
    moduleTitle: string,
    prompts: Array<{ prompt: string; keywords: string[] }>,
  ): LessonStep[] =>
    prompts.map((entry, idx) => ({
      id: `${moduleSlug}-${idx + 1}`,
      title: moduleTitle,
      teachLine: {
        native: idx < 5 ? `Class teaching point: ${entry.prompt}` : `Practice checkpoint: ${entry.prompt}`,
      },
      exampleLine: {
        native:
          idx % 2 === 0
            ? `${languageLabel}: "${phraseSet.greeting.native}, ${phraseSet.nameQuestion.native}"`
            : `${languageLabel}: "${phraseSet.thanks.native}"`,
        transliteration:
          idx % 2 === 0
            ? `${phraseSet.greeting.translit}, ${phraseSet.nameQuestion.translit}`
            : phraseSet.thanks.translit,
      },
      practicePrompt: {
        native: `Say in ${languageLabel}: ${entry.prompt}`,
        transliteration: entry.prompt,
      },
      expectedKeywords: entry.keywords,
    }));

  const greetingsPrompts = [
    { prompt: 'Hello, what is your name?', keywords: ['name', 'peru', 'peyar', 'enna', 'emiti'] },
    { prompt: 'My name is Prashanth.', keywords: ['my name', 'naa peru', 'en peyar'] },
    { prompt: 'Nice to meet you.', keywords: ['meet', 'santhosham', 'magizhchi'] },
    { prompt: 'Where are you from?', keywords: ['from', 'enga', 'ekkada'] },
    { prompt: 'I am from Hyderabad.', keywords: ['from', 'hyderabad'] },
    { prompt: 'Can you repeat your name?', keywords: ['repeat', 'malli', 'thirumba'] },
    { prompt: 'Please speak slowly.', keywords: ['slowly', 'mellaga', 'medhuva'] },
    { prompt: 'I am learning Telugu/Tamil.', keywords: ['learning', 'nerchukuntunna', 'kathukkiren'] },
    { prompt: 'Thank you for helping me.', keywords: ['thank', 'dhany', 'nandri'] },
    { prompt: 'See you tomorrow.', keywords: ['tomorrow', 'repu', 'naalai'] },
    { prompt: 'Good morning, teacher.', keywords: ['morning', 'good', 'teacher'] },
    { prompt: 'Good evening, friend.', keywords: ['evening', 'friend'] },
    { prompt: 'What should I practice today?', keywords: ['practice', 'today'] },
    { prompt: 'I understand this sentence.', keywords: ['understand', 'ardham', 'puriyuthu'] },
    { prompt: 'I need one more example.', keywords: ['example', 'inka', 'innum'] },
  ];

  const homePrompts = [
    { prompt: 'Did you finish your dinner?', keywords: ['dinner', 'bhojanam', 'unavu'] },
    { prompt: 'What time is dinner?', keywords: ['time', 'samayam', 'neram'] },
    { prompt: 'I am at home now.', keywords: ['home', 'illu', 'veedu'] },
    { prompt: 'Please give me water.', keywords: ['water', 'neellu', 'thanni'] },
    { prompt: 'I am hungry now.', keywords: ['hungry', 'akali', 'pasikkuthu'] },
    { prompt: 'This food is tasty.', keywords: ['food', 'ruchi', 'suvai'] },
    { prompt: 'Can I get tea?', keywords: ['tea', 'chai'] },
    { prompt: 'Please sit here.', keywords: ['sit', 'ikkada', 'inge'] },
    { prompt: 'I will come in five minutes.', keywords: ['five', 'minutes'] },
    { prompt: 'Where is the kitchen?', keywords: ['kitchen'] },
    { prompt: 'Open the door please.', keywords: ['door', 'open'] },
    { prompt: 'Close the window please.', keywords: ['window', 'close'] },
    { prompt: 'I am cleaning the table.', keywords: ['table', 'clean'] },
    { prompt: 'Let us eat together.', keywords: ['eat', 'kalisi', 'serndhu'] },
    { prompt: 'Dinner is ready now.', keywords: ['ready', 'dinner'] },
  ];

  const directionPrompts = [
    { prompt: 'Where is the bus stop?', keywords: ['bus', 'stop', 'ekkada', 'enge'] },
    { prompt: 'Is it on the left side?', keywords: ['left', 'side'] },
    { prompt: 'Please turn right.', keywords: ['right', 'turn'] },
    { prompt: 'Go straight for two blocks.', keywords: ['straight', 'two', 'blocks'] },
    { prompt: 'Can you show me on map?', keywords: ['show', 'map'] },
    { prompt: 'I did not understand. Repeat please.', keywords: ['understand', 'repeat'] },
    { prompt: 'Speak a little slower.', keywords: ['slower', 'slowly'] },
    { prompt: 'How far is the station?', keywords: ['far', 'station'] },
    { prompt: 'I need help with directions.', keywords: ['help', 'directions'] },
    { prompt: 'Is this the correct road?', keywords: ['correct', 'road'] },
    { prompt: 'Thank you for your help.', keywords: ['thank', 'help'] },
    { prompt: 'Can you say that again?', keywords: ['again', 'say'] },
    { prompt: 'I will ask someone else too.', keywords: ['ask', 'someone'] },
    { prompt: 'I found the place.', keywords: ['found', 'place'] },
    { prompt: 'Goodbye, have a nice day.', keywords: ['goodbye', 'day'] },
  ];

  return [
    { title: 'Greetings + Identity', steps: buildModuleSteps('greet', 'Greetings + Identity', greetingsPrompts) },
    { title: 'Home, Food, Time', steps: buildModuleSteps('home', 'Home, Food, Time', homePrompts) },
    {
      title: 'Directions, Requests, Recovery',
      steps: buildModuleSteps('direction', 'Directions, Requests, Recovery', directionPrompts),
    },
  ];
}

export function buildPhasePrompt(
  step: LessonStep,
  phase: LessonPhase,
  languageName: string,
): string {
  if (phase === 'TEACH') {
    return step.teachLine.native;
  }
  if (phase === 'EXAMPLE') {
    return step.exampleLine.transliteration
      ? `${step.exampleLine.native} (${step.exampleLine.transliteration})`
      : step.exampleLine.native;
  }
  if (phase === 'PRACTICE') {
    return step.practicePrompt.transliteration
      ? `${step.practicePrompt.native} (${step.practicePrompt.transliteration})`
      : step.practicePrompt.native;
  }
  return `Evaluating your response for this ${languageName} step now.`;
}

export function transitionAfterPracticeEvaluation(
  current: LessonRuntimeState,
  evaluationPassed: boolean,
  totalSteps: number,
  nextStepId: string | null,
): LessonRuntimeState {
  if (!evaluationPassed) {
    return {
      ...current,
      activePhase: 'PRACTICE',
    };
  }

  const isLastStep = current.stepIndex >= totalSteps - 1;
  if (isLastStep || !nextStepId) {
    return {
      ...current,
      activePhase: 'RUBRIC_CHECK',
    };
  }

  return {
    // We emit teach+example+practice messages immediately for the next step,
    // so learner input should be accepted right away in PRACTICE phase.
    activePhase: 'PRACTICE',
    activeStepId: nextStepId,
    stepIndex: current.stepIndex + 1,
  };
}

export function restoreFromInterruption(snapshot: {
  phase: LessonPhase;
  stepId: string;
  stepIndex: number;
}): LessonRuntimeState {
  return {
    activePhase: snapshot.phase,
    activeStepId: snapshot.stepId,
    stepIndex: snapshot.stepIndex,
  };
}

export function canHandleFollowUp(currentStepFollowUpCount: number, maxPerStep = 2): boolean {
  return currentStepFollowUpCount < maxPerStep;
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
    return enforceRegionalEvidence(fallbackEvaluation(learnerText, step), learnerText, step, languageCode);
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
          content: `Language code: ${languageCode}. Exercise: ${step.practicePrompt.native}. Expected keywords: ${step.expectedKeywords.join(
            ', ',
          )}. Learner said: ${learnerText}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return enforceRegionalEvidence(fallbackEvaluation(learnerText, step), learnerText, step, languageCode);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) {
    return enforceRegionalEvidence(fallbackEvaluation(learnerText, step), learnerText, step, languageCode);
  }

  try {
    const parsed = JSON.parse(raw) as { passed?: boolean; feedback?: string };
    const evaluated = {
      passed: Boolean(parsed.passed),
      feedback: parsed.feedback?.trim() || 'Good attempt. Let us continue.',
    };
    return enforceRegionalEvidence(evaluated, learnerText, step, languageCode);
  } catch {
    return enforceRegionalEvidence(fallbackEvaluation(learnerText, step), learnerText, step, languageCode);
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
  const inferredLanguage = inferRegionalLanguage(step);
  const score = countStepIntentHits(learnerText, step, inferredLanguage);
  const minimumHits =
    inferredLanguage === 'ta-IN' || inferredLanguage === 'te-IN'
      ? 1
      : Math.max(1, Math.ceil(step.expectedKeywords.length / 2));
  if (score >= minimumHits) {
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

function matchesStepIntent(normalizedText: string, step: LessonStep, _languageCode: LanguageCode): boolean {
  const keywordHits = countStepIntentHits(normalizedText, step, _languageCode);
  if (keywordHits >= 1) {
    return true;
  }

  return false;
}

function evaluateWithHeuristics(
  learnerText: string,
  step: LessonStep,
  languageCode: LanguageCode,
): PracticeEvaluation | null {
  const normalized = learnerText.trim().toLowerCase();
  const keywordHits = countStepIntentHits(normalized, step, languageCode);
  const minimumHits =
    languageCode === 'ta-IN' || languageCode === 'te-IN'
      ? 1
      : Math.max(1, Math.ceil(step.expectedKeywords.length / 2));
  if (keywordHits >= Math.max(1, Math.ceil(step.expectedKeywords.length / 2))) {
    return enforceRegionalEvidence(
      {
        passed: true,
        feedback: 'Strong response. Correct meaning and key phrase use. Let us continue to the next step.',
      },
      learnerText,
      step,
      languageCode,
    );
  }

  if (
    keywordHits > 0 &&
    keywordHits < minimumHits &&
    (languageCode !== 'ta-IN' && languageCode !== 'te-IN')
  ) {
    return enforceRegionalEvidence(
      {
        passed: false,
        feedback: 'Good meaning. Include more of the target phrase and try once more.',
      },
      learnerText,
      step,
      languageCode,
    );
  }

  return null;
}

function enforceRegionalEvidence(
  evaluation: PracticeEvaluation,
  learnerText: string,
  step: LessonStep,
  languageCode: LanguageCode,
): PracticeEvaluation {
  if (languageCode !== 'ta-IN' && languageCode !== 'te-IN') {
    return evaluation;
  }

  const hasEvidence = hasRegionalLanguageEvidence(learnerText, languageCode, step);
  if (evaluation.passed && !hasEvidence) {
    return {
      passed: false,
      feedback:
        languageCode === 'te-IN'
          ? 'Meaning is close. Please say the answer with Telugu words or script for this step.'
          : 'Meaning is close. Please say the answer with Tamil words or script for this step.',
    };
  }

  return evaluation;
}

function hasRegionalLanguageEvidence(
  learnerText: string,
  languageCode: 'ta-IN' | 'te-IN',
  step: LessonStep,
): boolean {
  if (containsRegionalScript(learnerText, languageCode)) {
    return true;
  }

  const normalized = learnerText.toLowerCase();
  const regionalTokens = languageCode === 'te-IN' ? TELUGU_ROMANIZED_TOKENS : TAMIL_ROMANIZED_TOKENS;
  const hasRegionalToken = regionalTokens.some((token) => normalized.includes(token));
  if (!hasRegionalToken) {
    return false;
  }

  return countStepIntentHits(normalized, step, languageCode) > 0;
}

function containsRegionalScript(learnerText: string, languageCode: 'ta-IN' | 'te-IN'): boolean {
  if (languageCode === 'te-IN') {
    return /[\u0C00-\u0C7F]/u.test(learnerText);
  }
  return /[\u0B80-\u0BFF]/u.test(learnerText);
}

const TELUGU_ROMANIZED_TOKENS = [
  'namaskaram',
  'nenu',
  'meeru',
  'mee',
  'peru',
  'emiti',
  'ekkada',
  'bhojanam',
  'muginchara',
  'dhany',
  'cheppandi',
  'mellaga',
  'nundi',
  'vastunnanu',
  'nerchukuntunna',
];

const TAMIL_ROMANIZED_TOKENS = [
  'vanakkam',
  'ungal',
  'peyar',
  'enna',
  'saapadu',
  'unavu',
  'nandri',
  'thirumba',
  'medhuva',
  'enga',
  'irukkiren',
  'kathukkiren',
  'naalai',
  'serndhu',
];

function inferRegionalLanguage(step: LessonStep): LanguageCode {
  const prompt = step.practicePrompt.native.toLowerCase();
  if (prompt.includes('say in telugu')) {
    return 'te-IN';
  }
  if (prompt.includes('say in tamil')) {
    return 'ta-IN';
  }
  return 'en-US';
}

function countStepIntentHits(learnerText: string, step: LessonStep, languageCode: LanguageCode): number {
  const normalized = learnerText.toLowerCase();
  const anchors = new Set(step.expectedKeywords.map((keyword) => keyword.toLowerCase()));

  if (languageCode === 'te-IN') {
    for (const keyword of step.expectedKeywords) {
      const mapped = TELUGU_INTENT_ANCHORS[keyword.toLowerCase()];
      if (mapped) {
        for (const entry of mapped) {
          anchors.add(entry.toLowerCase());
        }
      }
    }
  }

  if (languageCode === 'ta-IN') {
    for (const keyword of step.expectedKeywords) {
      const mapped = TAMIL_INTENT_ANCHORS[keyword.toLowerCase()];
      if (mapped) {
        for (const entry of mapped) {
          anchors.add(entry.toLowerCase());
        }
      }
    }
  }

  let hits = 0;
  anchors.forEach((anchor) => {
    if (anchor && normalized.includes(anchor)) {
      hits += 1;
    }
  });
  return hits;
}

const TELUGU_INTENT_ANCHORS: Record<string, string[]> = {
  name: ['పేరు', 'mee peru'],
  peru: ['పేరు'],
  emiti: ['ఏమిటి', 'emiti'],
  from: ['నుంచి', 'nundi'],
  where: ['ఎక్కడ', 'ekkada'],
  dinner: ['భోజనం', 'bhojanam'],
  bhojanam: ['భోజనం'],
  muginchara: ['ముగించారా'],
  water: ['నీళ్లు', 'neellu'],
  home: ['ఇల్లు', 'illu'],
  hungry: ['ఆకలి', 'akali'],
  tea: ['టీ', 'chai'],
  right: ['కుడి', 'kudi'],
  left: ['ఎడమ', 'edama'],
  repeat: ['మళ్ళీ', 'malli'],
  slowly: ['మెల్లగా', 'mellaga'],
  thank: ['ధన్యవాదాలు', 'dhanyavadalu'],
};

const TAMIL_INTENT_ANCHORS: Record<string, string[]> = {
  name: ['பெயர்', 'peyar'],
  enna: ['என்ன', 'enna'],
  from: ['இருந்து', 'irundhu'],
  where: ['எங்கே', 'enge'],
  dinner: ['சாப்பாடு', 'saapadu', 'unavu'],
  water: ['தண்ணீர்', 'thanni'],
  home: ['வீடு', 'veedu'],
  hungry: ['பசிக்குது', 'pasikkuthu'],
  tea: ['தேநீர்', 'tea'],
  right: ['வலது', 'valathu'],
  left: ['இடது', 'idathu'],
  repeat: ['திரும்ப', 'thirumba'],
  slowly: ['மெதுவா', 'medhuva'],
  thank: ['நன்றி', 'nandri'],
};
