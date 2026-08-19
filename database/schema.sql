begin;

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

create table if not exists public.branches (
  branch_id text primary key,
  branch_name text not null,
  branch_name_th text,
  city text,
  region text,
  status text not null default 'offline',
  active_robot_id text,
  active_campaign_id text,
  live_camera_id text,
  route_id text,
  primary_zone text,
  timezone text not null default 'Asia/Bangkok',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  campaign_id text primary key,
  campaign_name text not null,
  campaign_name_th text,
  product_id text,
  status text not null default 'draft',
  theme text,
  start_date date,
  end_date date,
  target_conversion_percent numeric(7,2),
  assigned_branch_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  product_id text primary key,
  product_name text not null,
  category text,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  unit_price numeric(12,2),
  promotion text,
  interest_score numeric(7,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zones (
  zone_id text primary key,
  zone_name text not null,
  branch_id text references public.branches(branch_id) on delete cascade,
  zone_type text,
  priority integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routes (
  route_id text primary key,
  route_name text not null,
  branch_id text references public.branches(branch_id) on delete cascade,
  robot_id text,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  status text not null default 'draft',
  readiness_percent numeric(7,2),
  estimated_duration_min integer,
  zone_sequence text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_cameras (
  camera_id text primary key,
  camera_name text not null,
  branch_id text references public.branches(branch_id) on delete cascade,
  branch_name text,
  robot_id text,
  robot_name text,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  campaign_name text,
  camera_status text not null default 'offline',
  stream_type text not null default 'mock_image',
  image_url text,
  video_url text,
  hls_url text,
  current_zone text,
  current_action text,
  battery_percent numeric(7,2),
  speed_mps numeric(8,3),
  signal_strength text,
  safety_status text,
  last_updated timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.robots (
  robot_id text primary key,
  robot_name text not null,
  model text,
  branch_id text references public.branches(branch_id) on delete set null,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  route_id text references public.routes(route_id) on delete set null,
  camera_id text references public.live_cameras(camera_id) on delete set null,
  status text not null default 'offline',
  current_zone_id text references public.zones(zone_id) on delete set null,
  current_zone text,
  current_action text,
  battery_percent numeric(7,2),
  signal_percent numeric(7,2),
  signal_strength text,
  safety_status text,
  speed_mps numeric(8,3),
  temperature_c numeric(8,2),
  route_progress_percent numeric(7,2),
  last_seen timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_points (
  route_point_id text primary key,
  route_id text not null references public.routes(route_id) on delete cascade,
  sequence integer not null,
  zone_id text references public.zones(zone_id) on delete set null,
  x numeric(12,4) not null,
  y numeric(12,4) not null,
  z numeric(12,4) not null,
  speed_mps numeric(8,3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_id, sequence)
);

create table if not exists public.scripts (
  script_id text primary key,
  campaign_id text references public.campaigns(campaign_id) on delete cascade,
  product_id text references public.products(product_id) on delete set null,
  zone_id text references public.zones(zone_id) on delete set null,
  title text not null,
  language text not null default 'th-TH',
  status text not null default 'draft',
  duration_sec integer,
  script_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.robot_event_logs (
  event_id text primary key,
  session_id text,
  robot_id text references public.robots(robot_id) on delete cascade,
  branch_id text references public.branches(branch_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  zone_id text references public.zones(zone_id) on delete set null,
  route_id text references public.routes(route_id) on delete set null,
  event_timestamp timestamptz not null,
  event_type text not null,
  event_name text not null,
  severity text not null default 'info',
  action_taken text,
  result_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.robot_alerts (
  alert_id text primary key,
  branch_id text references public.branches(branch_id) on delete cascade,
  robot_id text references public.robots(robot_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  zone_id text references public.zones(zone_id) on delete set null,
  alert_type text not null,
  severity text not null,
  status text not null,
  message text not null,
  event_timestamp timestamptz not null,
  owner text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.camera_events (
  event_id text primary key,
  camera_id text references public.live_cameras(camera_id) on delete cascade,
  robot_id text references public.robots(robot_id) on delete cascade,
  branch_id text references public.branches(branch_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  event_timestamp timestamptz not null,
  event_type text not null,
  event_name text not null,
  zone text,
  distance_m numeric(10,3),
  angle_degree numeric(10,3),
  confidence_score numeric(8,5),
  action_taken text,
  severity text not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interactions (
  interaction_id text primary key,
  branch_id text references public.branches(branch_id) on delete cascade,
  robot_id text references public.robots(robot_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  product_id text references public.products(product_id) on delete set null,
  zone_id text references public.zones(zone_id) on delete set null,
  event_timestamp timestamptz not null,
  customer_detected boolean not null default false,
  script_played boolean not null default false,
  sampling_interest boolean not null default false,
  interaction_duration_sec integer,
  interaction_result text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_impact (
  branch_id text not null references public.branches(branch_id) on delete cascade,
  campaign_id text not null references public.campaigns(campaign_id) on delete cascade,
  product_id text not null references public.products(product_id) on delete cascade,
  baseline_sales numeric(14,2),
  campaign_sales numeric(14,2),
  sales_uplift_percent numeric(8,2),
  gross_margin numeric(14,2),
  robot_cost numeric(14,2),
  roi_score numeric(10,3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (branch_id, campaign_id, product_id)
);

create table if not exists public.analytics_metrics (
  metric_id text primary key,
  label text not null,
  value numeric(18,4),
  unit text,
  trend_percent numeric(8,2),
  status text,
  branch_id text references public.branches(branch_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete cascade,
  product_id text references public.products(product_id) on delete cascade,
  zone_id text references public.zones(zone_id) on delete cascade,
  event_timestamp timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_insights (
  insight_id text primary key,
  branch_id text references public.branches(branch_id) on delete cascade,
  campaign_id text references public.campaigns(campaign_id) on delete cascade,
  segment text,
  best_time text,
  top_zone_id text references public.zones(zone_id) on delete set null,
  top_product_id text references public.products(product_id) on delete set null,
  insight text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.data_science_experiments (
  experiment_id text primary key,
  type text not null,
  title text not null,
  owner text,
  status text not null,
  campaign_id text references public.campaigns(campaign_id) on delete set null,
  metric text,
  control_score numeric(12,4),
  variant_score numeric(12,4),
  progress_percent numeric(7,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sensor_logs (
  sensor_log_id text primary key,
  robot_id text references public.robots(robot_id) on delete cascade,
  branch_id text references public.branches(branch_id) on delete cascade,
  event_timestamp timestamptz not null,
  sensor_type text not null,
  feature_name text not null,
  value numeric(18,5),
  unit text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.model_metrics (
  model_id text not null,
  model_name text not null,
  metric text not null,
  value numeric(18,5),
  unit text,
  status text,
  event_timestamp timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (model_id, metric)
);

create index if not exists idx_robots_branch_id on public.robots(branch_id);
create index if not exists idx_robots_campaign_id on public.robots(campaign_id);
create index if not exists idx_routes_branch_id on public.routes(branch_id);
create index if not exists idx_routes_robot_id on public.routes(robot_id);
create index if not exists idx_route_points_route_sequence on public.route_points(route_id, sequence);
create index if not exists idx_robot_event_logs_robot_time on public.robot_event_logs(robot_id, event_timestamp desc);
create index if not exists idx_robot_event_logs_branch_time on public.robot_event_logs(branch_id, event_timestamp desc);
create index if not exists idx_robot_event_logs_campaign_id on public.robot_event_logs(campaign_id);
create index if not exists idx_robot_event_logs_event_type on public.robot_event_logs(event_type);
create index if not exists idx_robot_alerts_robot_id on public.robot_alerts(robot_id);
create index if not exists idx_robot_alerts_branch_id on public.robot_alerts(branch_id);
create index if not exists idx_robot_alerts_event_time on public.robot_alerts(event_timestamp desc);
create index if not exists idx_live_cameras_branch_id on public.live_cameras(branch_id);
create index if not exists idx_live_cameras_robot_id on public.live_cameras(robot_id);
create index if not exists idx_camera_events_camera_time on public.camera_events(camera_id, event_timestamp desc);
create index if not exists idx_camera_events_event_type on public.camera_events(event_type);
create index if not exists idx_interactions_robot_time on public.interactions(robot_id, event_timestamp desc);
create index if not exists idx_interactions_branch_id on public.interactions(branch_id);
create index if not exists idx_interactions_campaign_id on public.interactions(campaign_id);
create index if not exists idx_interactions_product_id on public.interactions(product_id);
create index if not exists idx_interactions_zone_id on public.interactions(zone_id);
create index if not exists idx_analytics_metrics_branch_id on public.analytics_metrics(branch_id);
create index if not exists idx_analytics_metrics_campaign_id on public.analytics_metrics(campaign_id);
create index if not exists idx_sensor_logs_robot_time on public.sensor_logs(robot_id, event_timestamp desc);
create index if not exists idx_sensor_logs_branch_time on public.sensor_logs(branch_id, event_timestamp desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'branches', 'campaigns', 'products', 'zones', 'routes', 'live_cameras',
    'robots', 'route_points', 'scripts', 'robot_alerts', 'sales_impact',
    'analytics_metrics', 'customer_insights', 'data_science_experiments',
    'model_metrics'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'branches', 'robots', 'campaigns', 'products', 'zones', 'routes',
    'route_points', 'scripts', 'robot_event_logs', 'robot_alerts',
    'live_cameras', 'camera_events', 'interactions', 'sales_impact',
    'analytics_metrics', 'customer_insights', 'data_science_experiments',
    'sensor_logs', 'model_metrics'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists dashboard_public_read on public.%I', table_name);
    execute format(
      'create policy dashboard_public_read on public.%I for select to anon, authenticated using (true)',
      table_name
    );
  end loop;
end;
$$;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to anon, authenticated;

commit;
