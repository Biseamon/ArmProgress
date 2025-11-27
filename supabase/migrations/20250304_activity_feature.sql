-- Activity / Social feature schema
-- Tables: friends, friend_invites, groups, group_members, group_invites, feed_posts, feed_reactions

-- Friends (symmetric stored as two accepted rows when accepted)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists friends_unique_pair on public.friends (user_id, friend_user_id);
create index if not exists friends_friend_user_id_idx on public.friends (friend_user_id);

alter table public.friends enable row level security;

-- Only participants can see the row
create policy friends_select_policy on public.friends
  for select using (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

-- Only the current user can insert rows where they are the requester
create policy friends_insert_policy on public.friends
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- Allow status updates by either participant
create policy friends_update_policy on public.friends
  for update using (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  )
  with check (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

-- Friend invites (for non-users; auto-accepted on signup via backend hook)
create table if not exists public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  token text not null,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now()
);

create index if not exists friend_invites_invitee_email_idx on public.friend_invites (invitee_email);
create index if not exists friend_invites_inviter_id_idx on public.friend_invites (inviter_id);

alter table public.friend_invites enable row level security;

create policy friend_invites_select_policy on public.friend_invites
  for select using (
    auth.uid() is not null
    and (inviter_id = auth.uid())
  );

create policy friend_invites_insert_policy on public.friend_invites
  for insert with check (auth.uid() is not null and inviter_id = auth.uid());

create policy friend_invites_update_policy on public.friend_invites
  for update using (auth.uid() is not null and inviter_id = auth.uid())
  with check (auth.uid() is not null and inviter_id = auth.uid());

-- Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

create index if not exists groups_owner_id_idx on public.groups (owner_id);
create index if not exists groups_visibility_idx on public.groups (visibility);
-- Enable trigram index for fuzzy search (requires pg_trgm)
create extension if not exists pg_trgm;
create index if not exists groups_name_trgm_idx on public.groups using gin (name gin_trgm_ops);

alter table public.groups enable row level security;

-- Group members table
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  status text not null default 'pending' check (status in ('active','pending','rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists group_members_unique on public.group_members (group_id, user_id);
create index if not exists group_members_user_id_idx on public.group_members (user_id);

alter table public.group_members enable row level security;

-- Public groups are visible to all; private visible to members
create policy groups_select_policy on public.groups
  for select using (
    visibility = 'public'
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
        and gm.status = 'active'
    )
  );

-- Owner can insert groups
create policy groups_insert_policy on public.groups
  for insert with check (auth.uid() is not null and owner_id = auth.uid());

create policy group_members_select_policy on public.group_members
  for select using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.group_members gm2
        where gm2.group_id = group_members.group_id
          and gm2.user_id = auth.uid()
          and gm2.status = 'active'
      )
    )
  );

create policy group_members_insert_policy on public.group_members
  for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy group_members_update_policy on public.group_members
  for update using (
    auth.uid() is not null
    and (user_id = auth.uid()
      or exists (
        select 1 from public.groups g
        join public.group_members gm on gm.group_id = g.id
        where g.id = group_members.group_id
          and gm.user_id = auth.uid()
          and gm.role in ('owner','admin')
          and gm.status = 'active'
      )
    )
  )
  with check (true);

-- Group invites
create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid references auth.users(id) on delete cascade,
  invitee_email text,
  token text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists group_invites_group_id_idx on public.group_invites (group_id);
create index if not exists group_invites_inviter_id_idx on public.group_invites (inviter_id);
create index if not exists group_invites_invitee_user_id_idx on public.group_invites (invitee_user_id);

alter table public.group_invites enable row level security;

create policy group_invites_select_policy on public.group_invites
  for select using (
    auth.uid() is not null
    and (
      inviter_id = auth.uid()
      or invitee_user_id = auth.uid()
      or exists (
        select 1 from public.group_members gm
        where gm.group_id = group_invites.group_id
          and gm.user_id = auth.uid()
          and gm.status = 'active'
      )
    )
  );

create policy group_invites_insert_policy on public.group_invites
  for insert with check (auth.uid() is not null and inviter_id = auth.uid());

create policy group_invites_update_policy on public.group_invites
  for update using (auth.uid() is not null and (inviter_id = auth.uid() or invitee_user_id = auth.uid()))
  with check (true);

-- Feed posts
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  type text not null check (type in ('goal','pr','summary')),
  title text not null,
  body text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_user_id_idx on public.feed_posts (user_id);
create index if not exists feed_posts_group_id_idx on public.feed_posts (group_id);
create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);

alter table public.feed_posts enable row level security;

-- Visibility: self, accepted friends, or members of same group
create policy feed_posts_select_policy on public.feed_posts
  for select using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.friends f
        where ((f.user_id = auth.uid() and f.friend_user_id = feed_posts.user_id)
          or (f.friend_user_id = auth.uid() and f.user_id = feed_posts.user_id))
          and f.status = 'accepted'
      )
      or (
        feed_posts.group_id is not null
        and exists (
          select 1 from public.group_members gm
          where gm.group_id = feed_posts.group_id
            and gm.user_id = auth.uid()
            and gm.status = 'active'
        )
      )
    )
  );

create policy feed_posts_insert_policy on public.feed_posts
  for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy feed_posts_update_policy on public.feed_posts
  for update using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

-- Feed reactions
create table if not exists public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('arm','fire','like')),
  created_at timestamptz not null default now()
);

create unique index if not exists feed_reactions_unique on public.feed_reactions (post_id, user_id, reaction);
create index if not exists feed_reactions_user_id_idx on public.feed_reactions (user_id);

alter table public.feed_reactions enable row level security;

create policy feed_reactions_select_policy on public.feed_reactions
  for select using (auth.uid() is not null and user_id = auth.uid());

create policy feed_reactions_insert_policy on public.feed_reactions
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1 from public.feed_posts fp
      where fp.id = feed_reactions.post_id
      and (
        fp.user_id = auth.uid()
        or exists (
          select 1 from public.friends f
          where ((f.user_id = auth.uid() and f.friend_user_id = fp.user_id)
            or (f.friend_user_id = auth.uid() and f.user_id = fp.user_id))
            and f.status = 'accepted'
        )
        or (
          fp.group_id is not null
          and exists (
            select 1 from public.group_members gm
            where gm.group_id = fp.group_id
              and gm.user_id = auth.uid()
              and gm.status = 'active'
          )
        )
      )
    )
  );

create policy feed_reactions_delete_policy on public.feed_reactions
  for delete using (auth.uid() is not null and user_id = auth.uid());
