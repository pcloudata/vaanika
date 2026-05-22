import type { CourseModule, LanguageCode, LearningLanguage, TutorMessage } from '../types/learning';

export const LANGUAGES: LearningLanguage[] = [
  {
    code: 'ta-IN',
    name: 'Tamil',
    focus: 'Regional Indian language validation',
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    focus: 'Regional Indian language conversational fluency',
  },
  {
    code: 'es-ES',
    name: 'Spanish',
    focus: 'Travel and everyday conversation',
  },
  {
    code: 'en-US',
    name: 'English',
    focus: 'Workplace and daily fluency',
  },
  {
    code: 'fr-FR',
    name: 'French',
    focus: 'Beginner conversation basics',
  },
];

export const LEARNER_GOALS = ['Conversation', 'Travel', 'Work'] as const;

export const COURSE_MODULES: CourseModule[] = [
  {
    title: 'First Contact',
    description: 'Greetings, names, polite phrases, and tutor-led pronunciation checks.',
    progress: '86%',
  },
  {
    title: 'Everyday Needs',
    description: 'Ordering food, asking for directions, and recovering when you forget a word.',
    progress: '58%',
  },
  {
    title: 'Confident Exchange',
    description: 'Short back-and-forth roleplays with adaptive vocabulary and listening checks.',
    progress: '24%',
  },
];

export const tutorMessages: Record<LanguageCode, TutorMessage[]> = {
  'ta-IN': [
    {
      role: 'tutor',
      text: 'Vanakkam. Today we will practice introducing yourself in Tamil, then we will try a short cafe roleplay.',
    },
    {
      role: 'learner',
      text: 'Can I ask in English if I do not know the Tamil word?',
    },
    {
      role: 'tutor',
      text: 'Yes. I will understand the code-mix, teach the Tamil phrase, and then help you repeat it naturally.',
    },
  ],
  'te-IN': [
    {
      role: 'tutor',
      text: 'Namaskaram. Today we practice simple Telugu introductions and a short daily conversation exchange.',
    },
    {
      role: 'learner',
      text: 'Can I ask in English if I do not know the Telugu word?',
    },
    {
      role: 'tutor',
      text: 'Yes. I will accept code-mix, teach the Telugu phrase, and bring you back to the active class step.',
    },
  ],
  'es-ES': [
    {
      role: 'tutor',
      text: 'Hola. We will practice greeting someone, asking how they are, and answering with confidence.',
    },
    {
      role: 'learner',
      text: 'What is the difference between estoy bien and soy bueno?',
    },
    {
      role: 'tutor',
      text: 'Great interruption. Use estoy bien for how you feel. Soy bueno means you are good at something or morally good.',
    },
  ],
  'en-US': [
    {
      role: 'tutor',
      text: 'Let us rehearse a short workplace introduction with a clear, relaxed speaking pace.',
    },
    {
      role: 'learner',
      text: 'Can you make it sound less formal?',
    },
    {
      role: 'tutor',
      text: 'Absolutely. I will give you a warmer version, then we will practice it sentence by sentence.',
    },
  ],
  'fr-FR': [
    {
      role: 'tutor',
      text: 'Bonjour. Today we will practice a simple hotel check-in conversation.',
    },
    {
      role: 'learner',
      text: 'Can you slow down the pronunciation?',
    },
    {
      role: 'tutor',
      text: 'Of course. I will slow the pace, mark the liaison, and let you repeat after each phrase.',
    },
  ],
};
