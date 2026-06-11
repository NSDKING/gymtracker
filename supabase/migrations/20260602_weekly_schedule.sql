-- Add weekly schedule and plan start date to workout_plans.
-- These power the schedule-aware day index without regenerating AI on every open.

alter table public.workout_plans
  add column if not exists plan_start_date date,
  add column if not exists weekly_schedule jsonb;
