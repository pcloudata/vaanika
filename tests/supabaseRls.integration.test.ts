import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
const describeIfConfigured = hasConfig ? describe : describe.skip;

describeIfConfigured('supabase RLS integration', () => {
  const cleanupUserIds: string[] = [];

  afterAll(async () => {
    if (!hasConfig) {
      return;
    }
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    for (const id of cleanupUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  it('isolates lesson_step_events rows across two authenticated users', async () => {
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const alphaEmail = `rls-alpha-${Date.now()}@vaanika.app`;
    const betaEmail = `rls-beta-${Date.now()}@vaanika.app`;
    const password = `Pass-${randomUUID()}`;

    const alpha = await admin.auth.admin.createUser({
      email: alphaEmail,
      password,
      email_confirm: true,
    });
    if (alpha.error || !alpha.data.user) {
      throw alpha.error ?? new Error('Could not create alpha test user.');
    }
    cleanupUserIds.push(alpha.data.user.id);

    const beta = await admin.auth.admin.createUser({
      email: betaEmail,
      password,
      email_confirm: true,
    });
    if (beta.error || !beta.data.user) {
      throw beta.error ?? new Error('Could not create beta test user.');
    }
    cleanupUserIds.push(beta.data.user.id);

    const alphaClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const betaClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const alphaSignIn = await alphaClient.auth.signInWithPassword({ email: alphaEmail, password });
    if (alphaSignIn.error) {
      throw alphaSignIn.error;
    }
    const betaSignIn = await betaClient.auth.signInWithPassword({ email: betaEmail, password });
    if (betaSignIn.error) {
      throw betaSignIn.error;
    }

    const alphaProfileInsert = await alphaClient.from('learner_profiles').insert({
      id: alpha.data.user.id,
      display_name: 'RLS Alpha',
      goal: 'Conversation',
      target_language: 'ta-IN',
    });
    if (alphaProfileInsert.error) {
      throw alphaProfileInsert.error;
    }

    const betaProfileInsert = await betaClient.from('learner_profiles').insert({
      id: beta.data.user.id,
      display_name: 'RLS Beta',
      goal: 'Conversation',
      target_language: 'ta-IN',
    });
    if (betaProfileInsert.error) {
      throw betaProfileInsert.error;
    }

    const alphaCourse = await alphaClient
      .from('courses')
      .insert({ learner_id: alpha.data.user.id, title: 'Alpha Course', goal: 'Conversation', language_code: 'ta-IN' })
      .select('id')
      .single();
    if (alphaCourse.error || !alphaCourse.data) {
      throw alphaCourse.error ?? new Error('Could not create alpha course.');
    }

    const alphaModule = await alphaClient
      .from('course_modules')
      .insert({
        course_id: alphaCourse.data.id,
        position: 1,
        title: 'Module 1',
        description: 'RLS test module',
      })
      .select('id')
      .single();
    if (alphaModule.error || !alphaModule.data) {
      throw alphaModule.error ?? new Error('Could not create alpha module.');
    }

    const alphaLesson = await alphaClient
      .from('lessons')
      .insert({
        module_id: alphaModule.data.id,
        position: 1,
        title: 'Lesson 1',
        objective: 'RLS objective',
      })
      .select('id')
      .single();
    if (alphaLesson.error || !alphaLesson.data) {
      throw alphaLesson.error ?? new Error('Could not create alpha lesson.');
    }

    const alphaSession = await alphaClient
      .from('lesson_sessions')
      .insert({
        learner_id: alpha.data.user.id,
        lesson_id: alphaLesson.data.id,
        tutor_brain_provider: 'OpenAI',
        voice_provider: 'Sarvam',
      })
      .select('id')
      .single();
    if (alphaSession.error || !alphaSession.data) {
      throw alphaSession.error ?? new Error('Could not create alpha session.');
    }

    const alphaStepEvent = await alphaClient.from('lesson_step_events').insert({
      lesson_session_id: alphaSession.data.id,
      step_id: 'intro-name',
      step_index: 0,
      event_type: 'followup',
      learner_text: 'How do you say this in Tamil?',
      tutor_text: 'Brief answer. Back to class step 1.',
      active_phase: 'PRACTICE',
    });
    expect(alphaStepEvent.error).toBeNull();

    const betaRead = await betaClient
      .from('lesson_step_events')
      .select('id')
      .eq('lesson_session_id', alphaSession.data.id);
    expect(betaRead.error).toBeNull();
    expect(betaRead.data?.length ?? 0).toBe(0);
  });
});

