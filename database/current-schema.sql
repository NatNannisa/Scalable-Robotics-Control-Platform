-- CP Hypermarket AI Robot Control Room
-- Current six-table Supabase schema for the standalone demo flow.
-- Run this file before supabase/seed-current-schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null unique,
  traffic_level text not null check (traffic_level in ('Low', 'Medium', 'High')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  status text not null check (status in ('Active', 'Draft', 'Ended')),
  target_zone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.robot_scripts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  trigger_event text not null,
  dialogue_th text not null,
  dialogue_en text not null
);

create table if not exists public.robots (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null check (status in ('Idle', 'Patrolling', 'Interacting', 'Charging', 'Error')),
  battery_percentage int not null check (battery_percentage between 0 and 100),
  current_zone_id uuid references public.zones(id) on delete set null,
  last_updated timestamptz not null default now()
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  robot_id uuid not null references public.robots(id) on delete cascade,
  event_type text not null check (event_type in ('Info', 'Warning', 'Alert')),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  robot_id uuid not null references public.robots(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  age_group text not null check (age_group in ('Child', 'Teen', 'Adult', 'Senior')),
  gender text not null check (gender in ('Male', 'Female', 'Unknown')),
  engagement_stage text not null check (engagement_stage in ('Passed By', 'Looked', 'Interacted', 'Converted')),
  interaction_duration_sec int not null check (interaction_duration_sec >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_campaigns_target_zone on public.campaigns(target_zone);
create index if not exists idx_robot_scripts_campaign_id on public.robot_scripts(campaign_id);
create index if not exists idx_robots_current_zone_id on public.robots(current_zone_id);
create index if not exists idx_event_logs_robot_created on public.event_logs(robot_id, created_at desc);
create index if not exists idx_customer_interactions_robot_created on public.customer_interactions(robot_id, created_at desc);
create index if not exists idx_customer_interactions_zone_stage on public.customer_interactions(zone_id, engagement_stage);
