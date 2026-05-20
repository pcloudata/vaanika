import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

loadEnvLocal();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const E2E_EMAIL = process.env.E2E_EMAIL;
const VERIFY_MODE = process.env.DB_VERIFY_MODE ?? 'pass';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const learnerId = await resolveLearnerId();
  if (!learnerId) {
    console.error('Could not resolve learner id. Set E2E_EMAIL for scoped verification.');
    process.exit(1);
  }

  const checks = await Promise.all([
    verifyTable('lesson_sessions', 'started_at', learnerId),
    verifyTranscripts(learnerId),
    verifyStepEvents(learnerId),
    verifyAssessmentOutcome(learnerId, VERIFY_MODE),
    verifyBadgeAwards(learnerId, VERIFY_MODE),
  ]);

  const failed = checks.find((check) => !check.ok);
  if (failed) {
    console.error(`Verification failed: ${failed.name} -> ${failed.message}`);
    process.exit(1);
  }

  console.log('DB verification passed.');
  checks.forEach((check) => console.log(`- ${check.name}: ${check.message}`));
}

async function resolveLearnerId() {
  if (!E2E_EMAIL) {
    return null;
  }

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === E2E_EMAIL.toLowerCase())?.id ?? null;
}

async function verifyTable(table, orderColumn, learnerId) {
  const { data, error } = await supabase
    .from(table)
    .select('id', { count: 'exact' })
    .eq('learner_id', learnerId)
    .order(orderColumn, { ascending: false })
    .limit(1);

  if (error) {
    return { ok: false, name: table, message: error.message };
  }

  const count = data?.length ?? 0;
  return {
    ok: count > 0,
    name: table,
    message: count > 0 ? 'found learner-scoped rows' : 'no learner-scoped rows found',
  };
}

async function verifyTranscripts(learnerId) {
  const { data: sessions, error: sessionError } = await supabase
    .from('lesson_sessions')
    .select('id')
    .eq('learner_id', learnerId)
    .order('started_at', { ascending: false })
    .limit(10);

  if (sessionError) {
    return { ok: false, name: 'transcripts', message: sessionError.message };
  }

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (!sessionIds.length) {
    return { ok: false, name: 'transcripts', message: 'no lesson sessions found' };
  }

  const { data: transcripts, error } = await supabase
    .from('transcripts')
    .select('id')
    .in('lesson_session_id', sessionIds)
    .limit(1);

  if (error) {
    return { ok: false, name: 'transcripts', message: error.message };
  }

  return {
    ok: (transcripts?.length ?? 0) > 0,
    name: 'transcripts',
    message: (transcripts?.length ?? 0) > 0 ? 'found transcript rows' : 'no transcript rows found',
  };
}

async function verifyStepEvents(learnerId) {
  const { data: sessions, error: sessionError } = await supabase
    .from('lesson_sessions')
    .select('id')
    .eq('learner_id', learnerId)
    .order('started_at', { ascending: false })
    .limit(10);

  if (sessionError) {
    return { ok: false, name: 'lesson_step_events', message: sessionError.message };
  }

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (!sessionIds.length) {
    return { ok: false, name: 'lesson_step_events', message: 'no lesson sessions found' };
  }

  const { data: events, error } = await supabase
    .from('lesson_step_events')
    .select('event_type')
    .in('lesson_session_id', sessionIds)
    .limit(50);

  if (error) {
    return { ok: false, name: 'lesson_step_events', message: error.message };
  }

  const eventTypes = new Set((events ?? []).map((event) => event.event_type));
  return {
    ok: eventTypes.size > 0,
    name: 'lesson_step_events',
    message: eventTypes.size > 0 ? `event types: ${Array.from(eventTypes).join(', ')}` : 'no step events found',
  };
}

async function verifyAssessmentOutcome(learnerId, mode) {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('id, score, passed')
    .eq('learner_id', learnerId)
    .order('submitted_at', { ascending: false })
    .limit(1);

  if (error) {
    return { ok: false, name: 'assessment_attempts', message: error.message };
  }

  const latest = data?.[0];
  const modeMatches = mode === 'fail' ? latest?.passed === false : latest?.passed === true;
  return {
    ok: Boolean(latest) && modeMatches,
    name: 'assessment_attempts',
    message: latest
      ? `latest score=${latest.score}, passed=${latest.passed}, expected mode=${mode}`
      : 'no assessment attempts found',
  };
}

async function verifyBadgeAwards(learnerId, mode) {
  const { data: attempts, error: attemptsError } = await supabase
    .from('assessment_attempts')
    .select('id, passed')
    .eq('learner_id', learnerId)
    .order('submitted_at', { ascending: false })
    .limit(1);

  if (attemptsError) {
    return { ok: false, name: 'badge_awards', message: attemptsError.message };
  }

  const latestAttempt = attempts?.[0];
  if (!latestAttempt) {
    return { ok: false, name: 'badge_awards', message: 'no assessment attempt found for badge verification' };
  }

  const { data, error } = await supabase
    .from('badge_awards')
    .select('id, score, assessment_attempt_id')
    .eq('learner_id', learnerId)
    .order('issued_at', { ascending: false })
    .limit(1);

  if (error) {
    return { ok: false, name: 'badge_awards', message: error.message };
  }

  if (mode === 'fail') {
    const matchesFailConstraint = !data?.length || data[0].assessment_attempt_id !== latestAttempt.id;
    return {
      ok: matchesFailConstraint,
      name: 'badge_awards',
      message: matchesFailConstraint
        ? 'no badge award tied to latest failing attempt'
        : 'badge award incorrectly tied to failing attempt',
    };
  }

  const passValid = Boolean(data?.length) && data[0].assessment_attempt_id === latestAttempt.id;
  return {
    ok: passValid,
    name: 'badge_awards',
    message: passValid
      ? `latest score=${data[0].score}, linked attempt=${data[0].assessment_attempt_id}`
      : 'latest passing attempt is not linked to a badge award',
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}
