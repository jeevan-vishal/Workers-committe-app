-- ============================================================
-- Workers Committee & Employees App — Supabase Schema (Free Tier)
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. DEPARTMENTS
-- ------------------------------------------------------------
create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  name_ta text,                     -- Tamil name
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. MEMBERS / EMPLOYEES  (extends Supabase auth.users)
-- ------------------------------------------------------------
create table members (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text unique not null,       -- Login identifier
  full_name text not null,
  full_name_ta text,
  phone text unique,
  email text,
  department_id uuid references departments(id),
  designation text,
  date_of_birth date,
  date_of_joining date,
  wedding_anniversary date,
  photo_url text,                          -- Supabase Storage path
  role text not null default 'member' check (role in ('member','admin','super_admin')),
  is_committee_member boolean default false,
  is_active boolean default true,
  preferred_language text default 'en' check (preferred_language in ('en','ta')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_members_department on members(department_id);
create index idx_members_employee_id on members(employee_id);

-- ------------------------------------------------------------
-- 3. ANNOUNCEMENTS / NOTIFICATIONS
-- ------------------------------------------------------------
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  title_ta text,
  body text not null,
  body_ta text,
  category text default 'general' check (category in ('general','urgent','event','circular')),
  attachment_url text,
  created_by uuid references members(id),
  published_at timestamptz default now(),
  expires_at timestamptz
);

create table push_tokens (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  token text not null,
  platform text check (platform in ('android','ios','web')),
  created_at timestamptz default now(),
  unique(member_id, token)
);

create table notification_log (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  sent_by uuid references members(id),
  target text default 'all',    -- 'all' | department id | member id
  sent_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. COMPLAINTS
-- ------------------------------------------------------------
create table complaints (
  id uuid primary key default uuid_generate_v4(),
  ticket_no text unique not null default ('CMP-' || to_char(now(),'YYYYMMDD') || '-' || substr(uuid_generate_v4()::text,1,6)),
  member_id uuid references members(id) on delete set null,
  category text not null,          -- e.g. Safety, Wages, Harassment, Facilities
  subject text not null,
  description text not null,
  attachment_url text,
  status text not null default 'open' check (status in ('open','in_review','in_progress','resolved','rejected','closed')),
  priority text default 'normal' check (priority in ('low','normal','high','critical')),
  is_anonymous boolean default false,
  assigned_to uuid references members(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table complaint_status_history (
  id uuid primary key default uuid_generate_v4(),
  complaint_id uuid references complaints(id) on delete cascade,
  status text not null,
  remarks text,
  changed_by uuid references members(id),
  changed_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. MEETINGS + QR ATTENDANCE
-- ------------------------------------------------------------
create table meetings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  agenda text,
  location text,
  meeting_date timestamptz not null,
  qr_code_token text unique default uuid_generate_v4()::text,
  created_by uuid references members(id),
  minutes_doc_url text,             -- uploaded after meeting
  created_at timestamptz default now()
);

create table meeting_attendance (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references meetings(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  checked_in_at timestamptz default now(),
  unique(meeting_id, member_id)
);

-- ------------------------------------------------------------
-- 6. DOCUMENTS & CIRCULARS / LABOUR LAWS
-- ------------------------------------------------------------
create table documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  title_ta text,
  category text default 'circular' check (category in ('circular','policy','labour_law','minutes','other')),
  file_url text not null,           -- Supabase Storage path
  file_size_kb integer,
  uploaded_by uuid references members(id),
  uploaded_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 7. EMERGENCY CONTACTS
-- ------------------------------------------------------------
create table emergency_contacts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text,                        -- e.g. HR Head, Security, Fire Safety, Medical
  phone text not null,
  department_id uuid references departments(id),
  is_global boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 8. POLLS / VOTING (future enhancement)
-- ------------------------------------------------------------
create table polls (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  question_ta text,
  options jsonb not null,            -- ["Option A","Option B",...]
  is_anonymous boolean default true,
  created_by uuid references members(id),
  opens_at timestamptz default now(),
  closes_at timestamptz not null
);

create table poll_votes (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid references polls(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  option_index integer not null,
  voted_at timestamptz default now(),
  unique(poll_id, member_id)
);

-- ------------------------------------------------------------
-- 9. LEAVE TRACKER (future enhancement)
-- ------------------------------------------------------------
create table leave_records (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  leave_type text check (leave_type in ('casual','sick','earned','unpaid','other')),
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references members(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 10. SALARY SLIPS (future enhancement)
-- ------------------------------------------------------------
create table salary_slips (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  month integer not null,
  year integer not null,
  file_url text not null,
  uploaded_by uuid references members(id),
  uploaded_at timestamptz default now(),
  unique(member_id, month, year)
);

-- ------------------------------------------------------------
-- 11. FINANCE MODULE
-- ------------------------------------------------------------
create table finance_accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,               -- e.g. "Welfare Fund", "Committee Account"
  opening_balance numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table finance_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text check (type in ('income','expense')),
  is_default boolean default false
);

create table finance_transactions (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references finance_accounts(id),
  category_id uuid references finance_categories(id),
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  receipt_url text,                 -- Supabase Storage receipt scan
  transaction_date date not null default current_date,
  recorded_by uuid references members(id),
  created_at timestamptz default now()
);
create index idx_finance_tx_date on finance_transactions(transaction_date);

-- ------------------------------------------------------------
-- 12. SETTINGS (app-wide key/value, e.g. theme defaults, OTP config)
-- ------------------------------------------------------------
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — enable + baseline policies
-- ============================================================
alter table members enable row level security;
alter table announcements enable row level security;
alter table complaints enable row level security;
alter table complaint_status_history enable row level security;
alter table meetings enable row level security;
alter table meeting_attendance enable row level security;
alter table documents enable row level security;
alter table emergency_contacts enable row level security;
alter table polls enable row level security;
alter table poll_votes enable row level security;
alter table leave_records enable row level security;
alter table salary_slips enable row level security;
alter table finance_transactions enable row level security;
alter table finance_accounts enable row level security;
alter table push_tokens enable row level security;

-- Helper: is the caller an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from members
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$ language sql security definer;

-- Members: everyone logged in can read the directory; only admins write
create policy "members_read_all" on members for select using (auth.uid() is not null);
create policy "members_self_update" on members for update using (auth.uid() = id or is_admin());
create policy "members_admin_insert" on members for insert with check (is_admin());
create policy "members_admin_delete" on members for delete using (is_admin());

-- Announcements: everyone reads, only admins write
create policy "announcements_read" on announcements for select using (auth.uid() is not null);
create policy "announcements_admin_write" on announcements for all using (is_admin()) with check (is_admin());

-- Complaints: member sees own + admin sees all; member can insert own
create policy "complaints_owner_or_admin_read" on complaints for select
  using (member_id = auth.uid() or is_admin());
create policy "complaints_owner_insert" on complaints for insert
  with check (member_id = auth.uid() or is_admin());
create policy "complaints_admin_update" on complaints for update using (is_admin());

create policy "complaint_history_read" on complaint_status_history for select
  using (exists (select 1 from complaints c where c.id = complaint_id and (c.member_id = auth.uid() or is_admin())));
create policy "complaint_history_admin_write" on complaint_status_history for insert with check (is_admin());

-- Meetings & attendance: read by all logged-in, write by admin; attendance self-insert
create policy "meetings_read" on meetings for select using (auth.uid() is not null);
create policy "meetings_admin_write" on meetings for all using (is_admin()) with check (is_admin());
create policy "attendance_self_insert" on meeting_attendance for insert with check (member_id = auth.uid());
create policy "attendance_read" on meeting_attendance for select using (member_id = auth.uid() or is_admin());

-- Documents: read all, write admin
create policy "documents_read" on documents for select using (auth.uid() is not null);
create policy "documents_admin_write" on documents for all using (is_admin()) with check (is_admin());

-- Emergency contacts: read all, write admin
create policy "emergency_read" on emergency_contacts for select using (auth.uid() is not null);
create policy "emergency_admin_write" on emergency_contacts for all using (is_admin()) with check (is_admin());

-- Polls: read all, vote self, admin writes polls
create policy "polls_read" on polls for select using (auth.uid() is not null);
create policy "polls_admin_write" on polls for all using (is_admin()) with check (is_admin());
create policy "poll_votes_self" on poll_votes for insert with check (member_id = auth.uid());
create policy "poll_votes_read" on poll_votes for select using (member_id = auth.uid() or is_admin());

-- Leave, salary slips: self + admin
create policy "leave_self_or_admin" on leave_records for select using (member_id = auth.uid() or is_admin());
create policy "leave_self_insert" on leave_records for insert with check (member_id = auth.uid());
create policy "leave_admin_update" on leave_records for update using (is_admin());
create policy "salary_self_or_admin" on salary_slips for select using (member_id = auth.uid() or is_admin());
create policy "salary_admin_write" on salary_slips for all using (is_admin()) with check (is_admin());

-- Finance: read all logged-in members (transparency), write admin only
create policy "finance_tx_read" on finance_transactions for select using (auth.uid() is not null);
create policy "finance_tx_admin_write" on finance_transactions for all using (is_admin()) with check (is_admin());
create policy "finance_acc_read" on finance_accounts for select using (auth.uid() is not null);
create policy "finance_acc_admin_write" on finance_accounts for all using (is_admin()) with check (is_admin());

-- Push tokens: self only
create policy "push_tokens_self" on push_tokens for all using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ============================================================
-- SEED DATA (optional starter rows)
-- ============================================================
insert into finance_categories (name, type, is_default) values
  ('Membership Fee','income',true),
  ('Donation','income',true),
  ('Event Expense','expense',true),
  ('Welfare Support','expense',true),
  ('Stationery','expense',true);

insert into app_settings (key, value) values
  ('otp_login_enabled', 'true'),
  ('default_language', '"en"'),
  ('app_name', '"Workers Committee"');
