-- Phase 2A additive migration for the multi-supplier backend foundation.
-- This file is intentionally separate from current-schema.sql and is not auto-applied.

begin;

create table if not exists public.suppliers (
  id text primary key,
  supplier_name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  support_contact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.suppliers.id is
  'External supplier-system identifier stored as text; this is not an internal UUID.';

create table if not exists public.branches (
  id text primary key,
  branch_name text not null,
  supplier_id text references public.suppliers(id) on delete set null,
  region text,
  tier text,
  timezone text not null default 'Asia/Bangkok',
  status text not null default 'ONLINE' check (status in ('ONLINE', 'DEGRADED', 'OFFLINE', 'NO_DATA')),
  location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.branches.id is
  'External branch identifier stored as text; this is not an internal UUID and must be globally unique.';

alter table public.robots add column if not exists supplier_id text references public.suppliers(id) on delete set null;
alter table public.robots add column if not exists supplier_robot_id text;
alter table public.robots add column if not exists branch_id text references public.branches(id) on delete set null;
alter table public.robots add column if not exists connection_status text;
alter table public.robots add column if not exists current_mode text;
alter table public.robots add column if not exists navigation_status text;
alter table public.robots add column if not exists last_heartbeat timestamptz;

-- Add audit dimensions without inline foreign keys. The reconciliation block below
-- replaces any legacy NO ACTION constraints with explicit ON DELETE SET NULL rules.
alter table public.event_logs add column if not exists supplier_id text;
alter table public.event_logs add column if not exists supplier_event_id text;
alter table public.event_logs add column if not exists branch_id text;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select constraint_info.conname
    from pg_constraint as constraint_info
    where constraint_info.conrelid = 'public.event_logs'::regclass
      and constraint_info.contype = 'f'
      and (
        constraint_info.conkey = array[
          (
            select attribute_info.attnum
            from pg_attribute as attribute_info
            where attribute_info.attrelid = 'public.event_logs'::regclass
              and attribute_info.attname = 'supplier_id'
              and not attribute_info.attisdropped
          )
        ]::smallint[]
        or constraint_info.conkey = array[
          (
            select attribute_info.attnum
            from pg_attribute as attribute_info
            where attribute_info.attrelid = 'public.event_logs'::regclass
              and attribute_info.attname = 'branch_id'
              and not attribute_info.attisdropped
          )
        ]::smallint[]
      )
  loop
    execute format(
      'alter table public.event_logs drop constraint %I',
      constraint_record.conname
    );
  end loop;
end;
$$;

alter table public.event_logs
  add constraint event_logs_supplier_id_fkey
  foreign key (supplier_id)
  references public.suppliers(id)
  on delete set null;

alter table public.event_logs
  add constraint event_logs_branch_id_fkey
  foreign key (branch_id)
  references public.branches(id)
  on delete set null;

create table if not exists public.issue_tickets (
  id uuid primary key default gen_random_uuid(),
  supplier_id text not null references public.suppliers(id) on delete restrict,
  supplier_ticket_id text,
  branch_id text not null references public.branches(id) on delete restrict,
  robot_id uuid references public.robots(id) on delete set null,
  alert_reference text,
  priority text not null default 'P3' check (priority in ('P1', 'P2', 'P3', 'P4')),
  status text not null default 'NEW' check (status in ('NEW', 'ASSIGNED', 'RESOLVED', 'REJECTED', 'QUARANTINED')),
  queue text,
  assignee text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.adapter_health (
  supplier_id text primary key references public.suppliers(id) on delete cascade,
  status text not null check (status in ('HEALTHY', 'DEGRADED', 'OFFLINE')),
  last_success_at timestamptz,
  checked_at timestamptz not null default now(),
  message text,
  details jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_robots_supplier_source_id
  on public.robots(supplier_id, supplier_robot_id)
  where supplier_id is not null and supplier_robot_id is not null;

create unique index if not exists idx_event_logs_supplier_source_id
  on public.event_logs(supplier_id, supplier_event_id)
  where supplier_id is not null and supplier_event_id is not null;

create unique index if not exists idx_issue_tickets_supplier_source_id
  on public.issue_tickets(supplier_id, supplier_ticket_id)
  where supplier_id is not null and supplier_ticket_id is not null;

create index if not exists idx_branches_supplier_id
  on public.branches(supplier_id);

create index if not exists idx_robots_supplier_branch
  on public.robots(supplier_id, branch_id);

create index if not exists idx_event_logs_supplier_branch_created
  on public.event_logs(supplier_id, branch_id, created_at desc);

create index if not exists idx_issue_tickets_supplier_status
  on public.issue_tickets(supplier_id, status, created_at desc);

create index if not exists idx_issue_tickets_branch_robot
  on public.issue_tickets(branch_id, robot_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists set_issue_tickets_updated_at on public.issue_tickets;
create trigger set_issue_tickets_updated_at
before update on public.issue_tickets
for each row execute function public.set_updated_at();

commit;
