create table if not exists public.lesson_step_events (
  id uuid primary key default gen_random_uuid(),
  lesson_session_id uuid not null references public.lesson_sessions(id) on delete cascade,
  step_id text not null,
  step_index integer not null check (step_index >= 0),
  event_type text not null check (event_type in ('practice_pass', 'practice_retry', 'followup', 'unclear')),
  learner_text text not null,
  tutor_text text not null,
  created_at timestamptz not null default now()
);

alter table public.lesson_step_events enable row level security;

create policy "Learners manage step events for own sessions"
on public.lesson_step_events
for all
using (
  exists (
    select 1 from public.lesson_sessions
    where lesson_sessions.id = lesson_step_events.lesson_session_id
    and lesson_sessions.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.lesson_sessions
    where lesson_sessions.id = lesson_step_events.lesson_session_id
    and lesson_sessions.learner_id = auth.uid()
  )
);
