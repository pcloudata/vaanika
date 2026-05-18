create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.learner_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  target_language text not null,
  native_language text,
  goal text not null,
  transcript_storage_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  title text not null,
  language_code text not null,
  goal text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null,
  title text not null,
  description text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  position integer not null,
  title text not null,
  objective text not null,
  scenario text,
  vocabulary_targets text[] not null default '{}',
  grammar_targets text[] not null default '{}',
  completion_status text not null default 'not_started' check (completion_status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table if not exists public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  voice_provider text not null,
  tutor_brain_provider text not null,
  status text not null default 'started' check (status in ('started', 'paused', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  lesson_session_id uuid not null references public.lesson_sessions(id) on delete cascade,
  speaker text not null check (speaker in ('learner', 'tutor')),
  text text not null,
  provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery_scores (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  skill text not null check (skill in ('speaking', 'listening', 'vocabulary', 'reading', 'confidence')),
  score integer not null default 0 check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (learner_id, course_id, skill)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  badge_title text not null,
  passing_score integer not null default 75 check (passing_score between 0 and 100),
  rubric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  passed boolean not null,
  feedback text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  language_code text not null,
  level text not null default 'basics',
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.badge_awards (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references public.badges(id) on delete cascade,
  learner_id uuid not null references public.learner_profiles(id) on delete cascade,
  assessment_attempt_id uuid references public.assessment_attempts(id) on delete set null,
  score integer not null check (score between 0 and 100),
  issued_at timestamptz not null default now(),
  unique (badge_id, learner_id)
);

create trigger set_learner_profiles_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

create trigger set_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger set_course_modules_updated_at
before update on public.course_modules
for each row execute function public.set_updated_at();

create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger set_assessments_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

alter table public.learner_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_sessions enable row level security;
alter table public.transcripts enable row level security;
alter table public.mastery_scores enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.badges enable row level security;
alter table public.badge_awards enable row level security;

create policy "Learners manage own profile"
on public.learner_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Learners manage own courses"
on public.courses
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create policy "Learners manage modules for own courses"
on public.course_modules
for all
using (
  exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
    and courses.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
    and courses.learner_id = auth.uid()
  )
);

create policy "Learners manage lessons for own courses"
on public.lessons
for all
using (
  exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    where course_modules.id = lessons.module_id
    and courses.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    where course_modules.id = lessons.module_id
    and courses.learner_id = auth.uid()
  )
);

create policy "Learners manage own lesson sessions"
on public.lesson_sessions
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create policy "Learners manage transcripts for own sessions"
on public.transcripts
for all
using (
  exists (
    select 1 from public.lesson_sessions
    where lesson_sessions.id = transcripts.lesson_session_id
    and lesson_sessions.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.lesson_sessions
    where lesson_sessions.id = transcripts.lesson_session_id
    and lesson_sessions.learner_id = auth.uid()
  )
);

create policy "Learners manage own mastery scores"
on public.mastery_scores
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create policy "Learners view assessments for own courses"
on public.assessments
for select
using (
  exists (
    select 1 from public.courses
    where courses.id = assessments.course_id
    and courses.learner_id = auth.uid()
  )
);

create policy "Learners create assessments for own courses"
on public.assessments
for insert
with check (
  exists (
    select 1 from public.courses
    where courses.id = assessments.course_id
    and courses.learner_id = auth.uid()
  )
);

create policy "Learners update assessments for own courses"
on public.assessments
for update
using (
  exists (
    select 1 from public.courses
    where courses.id = assessments.course_id
    and courses.learner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = assessments.course_id
    and courses.learner_id = auth.uid()
  )
);

create policy "Learners manage own assessment attempts"
on public.assessment_attempts
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

create policy "Authenticated users can view badges"
on public.badges
for select
to authenticated
using (true);

create policy "Learners manage own badge awards"
on public.badge_awards
for all
using (auth.uid() = learner_id)
with check (auth.uid() = learner_id);

insert into public.badges (title, language_code, level, description)
values
  ('Tamil Conversation Basics', 'ta-IN', 'basics', 'Completed Tamil conversation basics and passed the mixed assessment.'),
  ('Spanish Conversation A1: Travel Basics', 'es-ES', 'A1', 'Completed Spanish travel conversation basics and passed the mixed assessment.'),
  ('English Conversation Basics', 'en-US', 'basics', 'Completed English conversation basics and passed the mixed assessment.'),
  ('French Conversation Basics', 'fr-FR', 'basics', 'Completed French conversation basics and passed the mixed assessment.')
on conflict (title) do nothing;
