-- Enable RLS
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  avatar_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create questions table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions not null,
  content text not null,
  asked_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create answers table
create table public.answers (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions not null,
  content text not null,
  answered_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table
create table public.group_members (
  group_id uuid references public.groups not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('owner', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- Create session_members table
create table public.session_members (
  session_id uuid references public.sessions not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('host', 'participant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (session_id, user_id)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.sessions enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.group_members enable row level security;
alter table public.session_members enable row level security;

-- Create policies
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Anyone can read groups"
  on public.groups for select
  to authenticated
  using (true);

create policy "Group members can read sessions"
  on public.sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.group_members
      where group_id = sessions.group_id
      and user_id = auth.uid()
    )
  );

-- Add more policies as needed for your specific use cases

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();