-- Create categories table
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text default 'Tag',
  is_archived boolean default false,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- RLS Policies
alter table categories enable row level security;

create policy "Users can view their own categories" 
on categories for select 
using (auth.uid() = user_id);

create policy "Users can insert their own categories" 
on categories for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own categories" 
on categories for update 
using (auth.uid() = user_id);

create policy "Users can delete their own categories" 
on categories for delete 
using (auth.uid() = user_id);
