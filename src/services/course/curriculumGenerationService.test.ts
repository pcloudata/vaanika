import { generateCurriculumFromBlueprint } from './curriculumGenerationService';

describe('curriculumGenerationService', () => {
  it('returns Telugu script + transliteration in generated payload', () => {
    const payload = generateCurriculumFromBlueprint({
      goal: 'Conversation',
      languageCode: 'te-IN',
      learnerNeed: 'I want to speak confidently with family.',
      level: 'A1',
      providerPlan: {
        tutorBrainProvider: 'OpenAI',
        voiceProvider: 'Sarvam',
      },
    });

    expect(payload.modules[0]?.steps[0]?.example.native.length).toBeGreaterThan(0);
    expect(payload.modules[0]?.steps[0]?.example.transliteration?.length).toBeGreaterThan(0);
  });
});

