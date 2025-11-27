-- Fix social RLS recursion and permission issues
-- Adds helper to check membership without recursive RLS lookups and rewrites policies

-- Helper: check if user is an active member of a group (bypass RLS)
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

-- Group members policies
drop policy if exists group_members_select_policy on public.group_members;
create policy group_members_select_policy on public.group_members
  for select using (
    auth.uid() is not null and (
      user_id = auth.uid()
      or public.is_group_member(group_members.group_id, auth.uid())
      or exists (
        select 1 from public.groups g
        where g.id = group_members.group_id
          and g.owner_id = auth.uid()
      )
    )
  );

drop policy if exists group_members_insert_policy on public.group_members;
create policy group_members_insert_policy on public.group_members
  for insert with check (
    auth.uid() is not null and user_id = auth.uid()
  );

drop policy if exists group_members_update_policy on public.group_members;
create policy group_members_update_policy on public.group_members
  for update using (
    auth.uid() is not null and (
      user_id = auth.uid()
      or exists (
        select 1 from public.groups g
        where g.id = group_members.group_id
          and g.owner_id = auth.uid()
      )
    )
  )
  with check (true);

-- Feed posts select: use helper for group membership to avoid recursion
 drop policy if exists feed_posts_select_policy on public.feed_posts;
 create policy feed_posts_select_policy on public.feed_posts
   for select using (
     auth.uid() is not null and (
       user_id = auth.uid()
       or exists (
         select 1 from public.friends f
         where ((f.user_id = auth.uid() and f.friend_user_id = feed_posts.user_id)
           or (f.friend_user_id = auth.uid() and f.user_id = feed_posts.user_id))
           and f.status = 'accepted'
       )
       or (
         feed_posts.group_id is not null
         and public.is_group_member(feed_posts.group_id, auth.uid())
       )
     )
   );

-- Feed reactions insert: use helper for group membership
 drop policy if exists feed_reactions_insert_policy on public.feed_reactions;
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
           and public.is_group_member(fp.group_id, auth.uid())
         )
       )
     )
   );

-- Feed reactions select remains scoped to user
 drop policy if exists feed_reactions_select_policy on public.feed_reactions;
 create policy feed_reactions_select_policy on public.feed_reactions
   for select using (auth.uid() is not null and user_id = auth.uid());

-- Friends / friend_invites policies are unchanged; permission errors should clear once recursion stops
