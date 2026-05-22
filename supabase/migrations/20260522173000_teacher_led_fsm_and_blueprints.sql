do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'lesson_phase_type'
      and n.nspname = 'public'
  ) then
    create type public.lesson_phase_type as enum ('TEACH', 'EXAMPLE', 'PRACTICE', 'RUBRIC_CHECK');
  end if;
end
$$;

alter table public.lesson_sessions
  add column if not exists active_phase public.lesson_phase_type default 'TEACH',
  add column if not exists active_step_id text,
  add column if not exists interruption_snapshot jsonb;

create table if not exists public.lesson_blueprints (
  id uuid primary key default gen_random_uuid(),
  language_code text not null,
  level text not null default 'A1',
  title text not null,
  goal text not null,
  review_status text not null default 'draft' check (review_status in ('draft', 'approved', 'rejected')),
  approved_by uuid references public.learner_profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_blueprint_steps (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.lesson_blueprints(id) on delete cascade,
  position integer not null check (position > 0),
  step_title text not null,
  teach_instruction text not null,
  example_instruction text not null,
  practice_instruction text not null,
  rubric_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (blueprint_id, position)
);

create index if not exists idx_lesson_blueprints_language_level
on public.lesson_blueprints(language_code, level);

create index if not exists idx_lesson_blueprint_steps_blueprint_position
on public.lesson_blueprint_steps(blueprint_id, position);

drop trigger if exists set_lesson_blueprints_updated_at on public.lesson_blueprints;
create trigger set_lesson_blueprints_updated_at
before update on public.lesson_blueprints
for each row execute function public.set_updated_at();

alter table public.lesson_blueprints enable row level security;
alter table public.lesson_blueprint_steps enable row level security;

drop policy if exists "Authenticated users can view lesson blueprints" on public.lesson_blueprints;
create policy "Authenticated users can view lesson blueprints"
on public.lesson_blueprints
for select
to authenticated
using (true);

drop policy if exists "Learners manage own lesson blueprints" on public.lesson_blueprints;
create policy "Learners manage own lesson blueprints"
on public.lesson_blueprints
for all
to authenticated
using (auth.uid() = approved_by or approved_by is null)
with check (auth.uid() = approved_by or approved_by is null);

drop policy if exists "Authenticated users can view lesson blueprint steps" on public.lesson_blueprint_steps;
create policy "Authenticated users can view lesson blueprint steps"
on public.lesson_blueprint_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.lesson_blueprints
    where lesson_blueprints.id = lesson_blueprint_steps.blueprint_id
  )
);

drop policy if exists "Learners manage steps for own blueprints" on public.lesson_blueprint_steps;
create policy "Learners manage steps for own blueprints"
on public.lesson_blueprint_steps
for all
to authenticated
using (
  exists (
    select 1
    from public.lesson_blueprints
    where lesson_blueprints.id = lesson_blueprint_steps.blueprint_id
      and (lesson_blueprints.approved_by = auth.uid() or lesson_blueprints.approved_by is null)
  )
)
with check (
  exists (
    select 1
    from public.lesson_blueprints
    where lesson_blueprints.id = lesson_blueprint_steps.blueprint_id
      and (lesson_blueprints.approved_by = auth.uid() or lesson_blueprints.approved_by is null)
  )
);

alter table public.lesson_step_events
  add column if not exists active_phase public.lesson_phase_type;

insert into public.badges (title, language_code, level, description)
values
  ('Telugu Conversation Basics', 'te-IN', 'basics', 'Completed Telugu conversation basics and passed the mixed assessment.')
on conflict (title) do nothing;
