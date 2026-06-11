-- One active workout plan per user, persisted alongside sessions/exercises.
-- user_id is the PK so upsert naturally replaces the existing row.

create table if not exists public.workout_plans (
  user_id       uuid references auth.users(id) on delete cascade primary key,
  plan          jsonb        not null,
  generated_at  timestamptz  not null default now(),
  user_modified boolean      not null default false,
  updated_at    timestamptz  not null default now()
);

alter table public.workout_plans enable row level security;

create policy "Users can manage their own workout plan"
  on public.workout_plans
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
