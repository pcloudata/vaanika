create table if not exists public.app_keepalive (
  id text primary key,
  last_pinged_at timestamptz not null default now(),
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.app_keepalive enable row level security;

revoke all on public.app_keepalive from anon, authenticated;

create or replace function public.keepalive_ping(p_source text default 'github-actions')
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  pinged_at timestamptz;
begin
  insert into public.app_keepalive (id, last_pinged_at, source)
  values ('vaanika-supabase-free-plan', now(), coalesce(nullif(p_source, ''), 'github-actions'))
  on conflict (id)
  do update set
    last_pinged_at = excluded.last_pinged_at,
    source = excluded.source
  returning last_pinged_at into pinged_at;

  return pinged_at;
end;
$$;

grant execute on function public.keepalive_ping(text) to anon, authenticated;
