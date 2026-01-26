-- ==========================================
-- 1. UTILITY FUNCTIONS & CONFIG
-- ==========================================

-- Function to find user ID by email (Secure)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = lookup_email;
$$;

    -- Function removed (moved to Section 5)


-- ==========================================
-- 2. PUBLIC PROFILES
-- ==========================================

create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  monthly_budget numeric,
  currency text default 'INR',
  email text, -- Merged from Query 5
  theme text default 'dark', -- Merged from Query 12
  
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);


-- ==========================================
-- 3. EXPENSES (PERSONAL)
-- ==========================================

create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  description text,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table expenses enable row level security;

create policy "Users can view own expenses." on expenses
  for select using (auth.uid() = user_id);

create policy "Users can insert own expenses." on expenses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own expenses." on expenses
  for update using (auth.uid() = user_id);

create policy "Users can delete own expenses." on expenses
  for delete using (auth.uid() = user_id);


-- ==========================================
-- 4. SAVINGS & BILLS
-- ==========================================

-- Upcoming Payments
create table upcoming_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  amount numeric not null,
  due_date date not null,
  category text, 
  is_paid boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table upcoming_payments enable row level security;

create policy "Users can view own upcoming payments." on upcoming_payments
  for select using (auth.uid() = user_id);

create policy "Users can insert own upcoming payments." on upcoming_payments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own upcoming payments." on upcoming_payments
  for update using (auth.uid() = user_id);

create policy "Users can delete own upcoming payments." on upcoming_payments
  for delete using (auth.uid() = user_id);

-- Savings Goals
create table savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date date,
  icon_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table savings_goals enable row level security;

create policy "Users can view own savings goals." on savings_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert own savings goals." on savings_goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own savings goals." on savings_goals
  for update using (auth.uid() = user_id);

create policy "Users can delete own savings goals." on savings_goals
  for delete using (auth.uid() = user_id);


-- ==========================================
-- 5. GROUPS & MEMBERSHIP
-- ==========================================

-- Groups
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Group Members
create table group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- Helper function to check group membership (Defined here because it depends on group_members table)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_members 
    WHERE group_id = _group_id 
    AND user_id = auth.uid()
  );
$$;

-- Enable RLS
alter table groups enable row level security;
alter table group_members enable row level security;

-- Policies for Groups
create policy "Groups visible to members" on groups
  for select using (
    created_by = auth.uid() 
    OR 
    is_group_member(id)
  );

create policy "Users can create groups" on groups
  for insert with check (auth.uid() = created_by);

-- Policies for Group Members
create policy "Members visible to group members" on group_members
  for select using (
    user_id = auth.uid()
    OR
    is_group_member(group_id)
  );

create policy "Users can add members" on group_members
  for insert with check (
    exists (
      select 1 from groups
      where groups.id = group_members.group_id
      and groups.created_by = auth.uid()
    )
    or
    auth.uid() = user_id
  );

-- Group Invites
create table if not exists group_invites (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  invited_by uuid references profiles(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

alter table group_invites enable row level security;

create policy "Users can view invites sent to them"
  on group_invites for select
  using (auth.uid() = user_id);

create policy "Group members can view invites for their group"
    on group_invites for select
    using ( is_group_member(group_id) );

create policy "Users can create invites"
  on group_invites for insert
  with check (auth.uid() = invited_by);

create policy "Invitee can update status"
  on group_invites for update
  using (auth.uid() = user_id);


-- Manual Members (Merged from Query 6)
create table if not exists manual_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table manual_members enable row level security;

create policy "Manual members visible to group" on manual_members
  for select using ( is_group_member(group_id) );

create policy "Group creators can add manual members" on manual_members
  for insert with check ( is_group_member(group_id) );

-- ==========================================
-- 6. GROUP EXPENSES & SPLITS
-- ==========================================

-- Group Expenses
create table group_expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  
  -- Payer can be real user OR manual user
  payer_id uuid references profiles(id) on delete cascade,
  manual_payer_id uuid references manual_members(id) on delete cascade,
  
  amount numeric not null,
  description text not null,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: Exactly one payer (Merged from Query 7)
  constraint group_expenses_payer_check 
  check (
    (payer_id is not null and manual_payer_id is null) or 
    (payer_id is null and manual_payer_id is not null)
  )
);

alter table group_expenses enable row level security;

create policy "Expenses visible to group members" on group_expenses
  for select using ( is_group_member(group_id) );

create policy "Members can add expenses" on group_expenses
  for insert with check ( is_group_member(group_id) );

create policy "Members can delete expenses" on group_expenses
    for delete using ( is_group_member(group_id) ); 
    
create policy "Members can update expenses" on group_expenses
    for update using ( is_group_member(group_id) );


-- Expense Splits
create table expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references group_expenses(id) on delete cascade not null,
  
  -- Split target can be real user OR manual member
  user_id uuid references profiles(id) on delete cascade,
  manual_member_id uuid references manual_members(id) on delete cascade,
  
  amount_owed numeric not null,
  
  -- Constraint: Exactly one target
  constraint expense_splits_user_check 
  check (
    (user_id is not null and manual_member_id is null) or 
    (user_id is null and manual_member_id is not null)
  )
);

-- Unique indexes to prevent duplicates (from Query 6)
create unique index idx_expense_splits_user on expense_splits(expense_id, user_id) where user_id is not null;
create unique index idx_expense_splits_manual on expense_splits(expense_id, manual_member_id) where manual_member_id is not null;

alter table expense_splits enable row level security;

-- Simplified RLS using joins
create policy "Splits visible to group members" on expense_splits
  for select using (
    exists (
      select 1 from group_expenses
      where group_expenses.id = expense_splits.expense_id
      and is_group_member(group_expenses.group_id)
    )
  );

create policy "Members can add splits" on expense_splits
  for insert with check (
    exists (
      select 1 from group_expenses
      where group_expenses.id = expense_splits.expense_id
      and is_group_member(group_expenses.group_id)
    )
  );

create policy "Members can delete splits" on expense_splits
    for delete using (
    exists (
      select 1 from group_expenses
      where group_expenses.id = expense_splits.expense_id
      and is_group_member(group_expenses.group_id)
    )
  );

-- ==========================================
-- 7. STORAGE (AVATARS)
-- ==========================================

-- Insert bucket if not exists
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
on storage.objects for select
using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' and name like (auth.uid() || '-%') );

create policy "Users can update own avatar"
on storage.objects for update
using ( bucket_id = 'avatars' and auth.role() = 'authenticated' and name like (auth.uid() || '-%') );

create policy "Users can delete own avatar"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.role() = 'authenticated' and name like (auth.uid() || '-%') );

-- ==========================================
-- 8. RPC: DELETE ACCOUNT
-- ==========================================

create or replace function delete_own_user()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;


-- ==========================================
-- 9. PERFORMANCE INDICES
-- ==========================================

-- Optimize Dashboard "Today's Overview" & "Recent Transactions"
CREATE INDEX IF NOT EXISTS idx_expenses_user_date_created ON expenses(user_id, date, created_at DESC);

-- Optimize Right Panel (Upcoming Payments)
CREATE INDEX IF NOT EXISTS idx_upcoming_payments_user_paid_due ON upcoming_payments(user_id, is_paid, due_date ASC);

-- Optimize Right Panel (Savings Goals)
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_created ON savings_goals(user_id, created_at DESC);


