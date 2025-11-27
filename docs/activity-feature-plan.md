# Activity Feature Implementation Plan

Scope: Activity tab (feed, friends, groups) with real data, offline-first via SQLite + Supabase sync.

## Supabase schema additions
- `friends`: id (uuid), user_id, friend_user_id, status ['pending','accepted','rejected'], created_at.
- `friend_invites`: id (uuid), inviter_id, invitee_email, token, status ['pending','accepted'], created_at. On signup with matching email+token, auto-create accepted friendship for both sides.
- `friend_requests`: optional if you prefer separate from invites to existing users (or fold into `friends` pending rows).
- `groups`: id (uuid), owner_id, name, description, visibility ['public','private'], created_at.
- `group_members`: id (uuid), group_id, user_id, role ['owner','admin','member'], status ['active','pending'], created_at.
- `group_invites`: id (uuid), group_id, inviter_id, invitee_user_id?, invitee_email?, token?, status ['pending','accepted','rejected'], created_at.
- `feed_posts`: id (uuid), user_id, group_id nullable, type ['goal','pr','summary'], title, body, metadata (jsonb), created_at.
- `feed_reactions`: id (uuid), post_id, user_id, reaction ['arm','fire','like'], created_at.

RLS (high level):
- `feed_posts`: selectable if user_id = current_user OR current_user has accepted friend with user_id OR current_user is active member of group_id. Inserts: user_id = current_user. Reactions: only for posts visible to user.
- `friends`: rows where user_id = current_user OR friend_user_id = current_user. Accept updates only by involved users.
- `friend_invites`: insert by inviter; select inviter’s rows; server-side function to consume token on signup.
- `groups`: public selectable; private selectable only if current_user is member or invited.
- `group_members`: rows where user_id = current_user or where group_id is one the user can see.
- `group_invites`: inviter visible; invitee (by email/user) visible if matches; accept via function.

## SQLite mirrors (offline)
- Mirror tables: friends, friend_invites, groups, group_members, feed_posts, feed_reactions.
- Sync engine: pull changes per table; push pending mutations (create/accept friend, create/join group, post, react).
- Pending queue: mark mutations with `pending_sync=1` and replay when online.

## Data flows
### Friends
- Add by email: if email matches existing user -> create pending row in `friends` (user_id = me, friend_user_id = them, status=pending); recipient sees incoming request; accept/decline updates both sides to accepted or rejected. If no user exists -> create `friend_invites` with token; on signup with that email+token auto-create two accepted `friends` rows.
- Lists: accepted, outgoing pending, incoming pending.

### Groups
- Create group: insert group + member(owner, active).
- Search: public groups ilike name; private groups only if invited/member.
- Join: request sets group_members status=pending; owner/admin can accept (or auto-accept for public groups).
- Invite: by email (token flow) or by existing friend user_id.
- Membership feed scope: only active members’ posts appear with group name badge.

### Feed
- Source data: feed_posts from friends + groups + self; show author and group tag if present.
- Compose (future): user can share goal/PR/summary; store metadata (goal_id, strength_test_id, weekly_stats).
- Reactions: optimistic increment in UI; push to `feed_reactions`.
- Filters: All / Friends / Groups (already in UI).

## Frontend tasks to wire
- Replace mocked state with hooks using React Query + SQLite for: friends, friend_invites, groups, group_members, feed_posts, feed_reactions.
- Add accept/decline handlers wired to mutations.
- Add group badges in feed (“in {group}”).
- Debounce reaction mutations; prevent double-count locally.
- Share link: use TestFlight in dev, App Store placeholder in prod iOS; Play Store for Android; expose via env/config.

## Open decisions (currently assumed)
- Friendship acceptance required (no auto-accept unless invite token matched on signup).
- Symmetric friendship: on acceptance create two `friends` rows with status=accepted for simpler selects.
- Group join for public: auto-accept; private: pending until approved.
