-- Adjust RLS to remove recursion and allow symmetric friend writes

-- Ensure helper exists (from prior migration)
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.group_members gm
    where gm.group_id = gid
      and gm.user_id = uid
      and gm.status = 'active'
  );
$$;

-- Groups: avoid recursive lookup into group_members
drop policy if exists groups_select_policy on public.groups;
create policy groups_select_policy on public.groups
  for select using (
    visibility = 'public'
    or public.is_group_member(id, auth.uid())
    or owner_id = auth.uid()
  );

-- Friends: allow either side to write/select their edge
drop policy if exists friends_select_policy on public.friends;
create policy friends_select_policy on public.friends
  for select using (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

drop policy if exists friends_insert_policy on public.friends;
create policy friends_insert_policy on public.friends
  for insert with check (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

drop policy if exists friends_update_policy on public.friends;
create policy friends_update_policy on public.friends
  for update using (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  )
  with check (
    auth.uid() is not null
    and (user_id = auth.uid() or friend_user_id = auth.uid())
  );

-- Friend invites: keep inviter, but ensure select for inviter
drop policy if exists friend_invites_select_policy on public.friend_invites;
create policy friend_invites_select_policy on public.friend_invites
  for select using (
    auth.uid() is not null
    and inviter_id = auth.uid()
  );

drop policy if exists friend_invites_insert_policy on public.friend_invites;
create policy friend_invites_insert_policy on public.friend_invites
  for insert with check (auth.uid() is not null and inviter_id = auth.uid());

drop policy if exists friend_invites_update_policy on public.friend_invites;
create policy friend_invites_update_policy on public.friend_invites
  for update using (auth.uid() is not null and inviter_id = auth.uid())
  with check (auth.uid() is not null and inviter_id = auth.uid());
