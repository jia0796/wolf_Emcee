-- LOCAL DRAFT ONLY. No existing WolfCue objects are referenced or modified.
create schema wolfcue_private;
revoke all on schema wolfcue_private from public, anon, authenticated;
grant usage on schema wolfcue_private to authenticated, service_role;
alter default privileges in schema wolfcue_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema wolfcue_private revoke execute on functions from public;

create table wolfcue_private.boards (
  id text primary key,
  capacity smallint not null check (capacity in (10,12)),
  roles text[] not null,
  catalog_hash text not null,
  check (cardinality(roles)=capacity)
);
create table wolfcue_private.rooms (
  id uuid primary key default gen_random_uuid(),
  display_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  host_id uuid not null references auth.users(id),
  create_request uuid not null,
  board_id text not null references wolfcue_private.boards(id),
  capacity smallint not null check (capacity in (10,12)),
  status text not null default 'waiting' check (status in ('waiting','dealt','ended','dissolved','expired')),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  last_effective_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(host_id,create_request),
  unique(id,capacity)
);
create index rooms_expiry on wolfcue_private.rooms(last_effective_at) where status='waiting';
create index rooms_host on wolfcue_private.rooms(host_id);
create table wolfcue_private.room_secrets (
  room_id uuid primary key references wolfcue_private.rooms(id) on delete cascade,
  -- 244 random bits from two UUID v4 values; never in public state or broadcast.
  invite_token text not null default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
);
create table wolfcue_private.room_access (
  room_id uuid not null references wolfcue_private.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  active boolean not null default true,
  primary key(room_id,user_id)
);
create index room_access_user on wolfcue_private.room_access(user_id,room_id);
create table wolfcue_private.room_seats (
  room_id uuid not null,
  capacity smallint not null,
  seat smallint not null check(seat between 1 and capacity),
  user_id uuid references auth.users(id),
  lease uuid,
  primary key(room_id,seat),
  foreign key(room_id,capacity) references wolfcue_private.rooms(id,capacity) on delete cascade,
  unique(room_id,user_id),
  check ((user_id is null) = (lease is null))
);
create table wolfcue_private.deal_transactions (
  room_id uuid primary key references wolfcue_private.rooms(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  request_id uuid not null,
  status text not null check(status='committed'),
  committed_at timestamptz not null default now()
);
create table wolfcue_private.player_roles (
  room_id uuid not null references wolfcue_private.rooms(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null references auth.users(id),
  lease uuid not null,
  role text not null,
  deal_id uuid not null references wolfcue_private.deal_transactions(id),
  primary key(room_id,seat),
  unique(room_id,user_id),
  foreign key(room_id,seat) references wolfcue_private.room_seats(room_id,seat)
);
create index player_roles_user on wolfcue_private.player_roles(user_id,room_id);

-- No client receives DML grants. Even private tables have RLS.
alter table wolfcue_private.boards enable row level security;
alter table wolfcue_private.rooms enable row level security;
alter table wolfcue_private.room_secrets enable row level security;
alter table wolfcue_private.room_access enable row level security;
alter table wolfcue_private.room_seats enable row level security;
alter table wolfcue_private.deal_transactions enable row level security;
alter table wolfcue_private.player_roles enable row level security;
revoke all on all tables in schema wolfcue_private from public,anon,authenticated;
revoke all on all sequences in schema wolfcue_private from public,anon,authenticated;

create function wolfcue_private.authorized(p_room uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
 select auth.uid() is not null and exists(
  select 1 from wolfcue_private.room_access a join wolfcue_private.rooms r on r.id=a.room_id
  where a.room_id=p_room and a.user_id=auth.uid() and a.active
  and (r.status='dealt' or (r.status='waiting' and r.last_effective_at>now()-interval '2 hours'))
 )
$$;
revoke all on function wolfcue_private.authorized(uuid) from public,anon;
grant execute on function wolfcue_private.authorized(uuid) to authenticated;
create policy own_access on wolfcue_private.room_access for select to authenticated
 using (user_id=(select auth.uid()) and active);
create policy own_role on wolfcue_private.player_roles for select to authenticated
 using(user_id=(select auth.uid()) and wolfcue_private.authorized(room_id)
 and exists(select 1 from wolfcue_private.rooms r where r.id=room_id and r.status='dealt'));
create policy member_room on wolfcue_private.rooms for select to authenticated
 using(wolfcue_private.authorized(id));
-- Private schema is NOT exposed through PostgREST. Explicit grants support RLS checks;
-- clients normally use only the minimal public RPC.
grant select on wolfcue_private.rooms,wolfcue_private.room_access to authenticated;
grant select(room_id,seat,user_id,role,deal_id) on wolfcue_private.player_roles to authenticated;

create function wolfcue_private.notify_room() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
 perform realtime.send(jsonb_build_object('roomId',new.id,'version',new.version,'status',new.status),
   'changed','wolfcue:'||new.id::text,true);
 return new;
end $$;
revoke all on function wolfcue_private.notify_room() from public,anon,authenticated;
create trigger room_signal after update of version on wolfcue_private.rooms
for each row execute function wolfcue_private.notify_room();

-- Only an authenticated room member may RECEIVE; no client SEND or Presence policy.
-- Restrictive guards also protect WolfCue topics if unrelated broad policies exist.
create policy wolfcue_receive on realtime.messages for select to authenticated
using(extension='broadcast' and exists(
 select 1 from wolfcue_private.rooms r
 where 'wolfcue:'||r.id::text=(select realtime.topic())
 and wolfcue_private.authorized(r.id)));
create policy wolfcue_receive_guard on realtime.messages as restrictive for select to authenticated
using((select realtime.topic()) not like 'wolfcue:%' or
 (extension='broadcast' and exists(select 1 from wolfcue_private.rooms r
 where 'wolfcue:'||r.id::text=(select realtime.topic()) and wolfcue_private.authorized(r.id))));
create policy wolfcue_no_client_send on realtime.messages as restrictive for insert to authenticated
with check((select realtime.topic()) not like 'wolfcue:%');
create policy wolfcue_no_anon_read on realtime.messages as restrictive for select to anon
using((select realtime.topic()) not like 'wolfcue:%');
create policy wolfcue_no_anon_send on realtime.messages as restrictive for insert to anon
with check((select realtime.topic()) not like 'wolfcue:%');

create function wolfcue_private.snapshot(p_room uuid, p_actor uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
 select jsonb_build_object(
 'roomId',r.id,'roomCode',r.display_code,'boardId',r.board_id,'capacity',r.capacity,
 'status',r.status,'version',r.version,'catalogHash',b.catalog_hash,
 'seats',case when r.status in ('waiting','dealt') then
 (select jsonb_agg(jsonb_build_object('seat',s.seat,'occupied',s.user_id is not null,
  'mine',s.user_id=p_actor,'lease',case when s.user_id=p_actor or r.host_id=p_actor then s.lease else null end)
  order by s.seat) from wolfcue_private.room_seats s where s.room_id=r.id)
 else '[]'::jsonb end,
 'dealId',(select d.id from wolfcue_private.deal_transactions d where d.room_id=r.id))
 from wolfcue_private.rooms r join wolfcue_private.boards b on b.id=r.board_id where r.id=p_room
$$;
revoke all on function wolfcue_private.snapshot(uuid,uuid) from public,anon,authenticated;

create function wolfcue_private.command(p_action text,p_room uuid,p_body jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
 actor uuid:=auth.uid();
 r wolfcue_private.rooms%rowtype;
 b wolfcue_private.boards%rowtype;
 src wolfcue_private.room_seats%rowtype;
 dst wolfcue_private.room_seats%rowtype;
 did uuid;
 req uuid;
 invitation text;
 target integer;
 expected uuid;
 deck text[];
 member boolean;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_body is null or jsonb_typeof(p_body)<>'object' then
  raise exception using errcode='22023',message='INVALID_INPUT'; end if;
 -- Reject forged identity/role and misspelled properties; identity only from validated JWT.
 if p_body - array['requestId','boardId','inviteToken','seat','lease','dealId'] <> '{}'::jsonb then
  raise exception using errcode='22023',message='INVALID_INPUT'; end if;
 if p_action='create' then
  req:=(p_body->>'requestId')::uuid;
  if req is null then raise exception using errcode='22023',message='REQUEST_ID_REQUIRED'; end if;
  -- Same Auth user cannot accidentally create two active rooms from two tabs, even
  -- if their local request IDs diverged. Closed prior requests remain recoverable.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  select * into r from wolfcue_private.rooms where host_id=actor and create_request=req for update;
  if not found then
   select * into r from wolfcue_private.rooms where host_id=actor and
     (status='dealt' or (status='waiting' and last_effective_at>now()-interval '2 hours'))
     order by created_at desc limit 1 for update;
  end if;
  if r.id is not null then
   if r.board_id is distinct from p_body->>'boardId' then
    raise exception using errcode='22023',message='CREATE_CONFLICT'; end if;
  else
   select * into b from wolfcue_private.boards where id=p_body->>'boardId';
   if not found then raise exception using errcode='22023',message='UNKNOWN_BOARD'; end if;
   insert into wolfcue_private.rooms(host_id,create_request,board_id,capacity)
    values(actor,req,b.id,b.capacity) returning * into r;
   insert into wolfcue_private.room_secrets(room_id) values(r.id);
   insert into wolfcue_private.room_access(room_id,user_id) values(r.id,actor);
   insert into wolfcue_private.room_seats(room_id,capacity,seat)
    select r.id,r.capacity,n from generate_series(1,r.capacity) n;
  end if;
  p_room:=r.id;
 else
  select * into r from wolfcue_private.rooms where id=p_room for update;
  if not found then raise exception using errcode='42501',message='ROOM_UNAVAILABLE'; end if;
 end if;
 select exists(select 1 from wolfcue_private.room_access where room_id=r.id and user_id=actor and active) into member;
 if p_action='join' then
  select invite_token into invitation from wolfcue_private.room_secrets where room_id=r.id;
  if invitation is distinct from p_body->>'inviteToken' then
   raise exception using errcode='42501',message='ROOM_UNAVAILABLE'; end if;
 elsif not member then raise exception using errcode='42501',message='ROOM_UNAVAILABLE';
 end if;
 if r.status='waiting' and r.last_effective_at<=now()-interval '2 hours' then
  update wolfcue_private.rooms set status='expired',closed_at=now(),version=version+1 where id=r.id returning * into r;
 end if;
 if r.status in ('ended','dissolved','expired') then
  return jsonb_build_object('roomId',r.id,'status',r.status,'version',r.version);
 end if;
 if p_action='join' then
  if not member then
   if r.status<>'waiting' or not exists(select 1 from wolfcue_private.room_seats where room_id=r.id and user_id is null) then
    return jsonb_build_object('error','ROOM_FULL','message','房間人數已滿，無法加入'); end if;
   insert into wolfcue_private.room_access(room_id,user_id) values(r.id,actor)
    on conflict(room_id,user_id) do update set active=true;
   -- Valid first join, unlike polling/heartbeats, is an effective operation.
   update wolfcue_private.rooms set last_effective_at=now(),version=version+1 where id=r.id;
  elsif r.status='dealt' and actor<>r.host_id and not exists(
   select 1 from wolfcue_private.player_roles where room_id=r.id and user_id=actor) then
   return jsonb_build_object('error','ROOM_FULL','message','房間人數已滿，無法加入');
  end if;
 elsif p_action in ('create','state','recover') then null;
 elsif p_action='my_role' then
  if r.status<>'dealt' then return jsonb_build_object('error','ROLE_UNAVAILABLE'); end if;
  select * into src from wolfcue_private.room_seats where room_id=r.id and user_id=actor;
  if src.lease is null or src.lease is distinct from (p_body->>'lease')::uuid then
   raise exception using errcode='42501',message='SEAT_AUTH_REQUIRED'; end if;
  return (select jsonb_build_object('seat',seat,'role',role,'dealId',deal_id,'boardId',r.board_id)
   from wolfcue_private.player_roles where room_id=r.id and user_id=actor and lease=src.lease);
 elsif p_action='deal' then
  if actor<>r.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
  req:=(p_body->>'requestId')::uuid;
  if req is null then raise exception using errcode='22023',message='REQUEST_ID_REQUIRED'; end if;
  -- Room PK guarantees one deal, even with a different request ID on retry.
  select id into did from wolfcue_private.deal_transactions where room_id=r.id;
  if did is null then
   if r.status<>'waiting' then raise exception 'ROOM_LOCKED'; end if;
   if (select count(*) from wolfcue_private.room_seats where room_id=r.id and user_id is not null)<>r.capacity then
    return jsonb_build_object('error','NOT_FULL','message','遊玩人數不足，無法發牌'); end if;
   select * into b from wolfcue_private.boards where id=r.board_id;
   -- UUID v4 random ordering uses server CSPRNG; no client seed or role input.
   select array_agg(role order by random_key,ordinal) into deck
    from (select role,ordinal,gen_random_uuid() random_key from unnest(b.roles) with ordinality u(role,ordinal)) shuffled;
   insert into wolfcue_private.deal_transactions(room_id,request_id,status) values(r.id,req,'committed') returning id into did;
   insert into wolfcue_private.player_roles(room_id,seat,user_id,lease,role,deal_id)
    select r.id,s.seat,s.user_id,s.lease,deck[s.seat],did from wolfcue_private.room_seats s where room_id=r.id;
   update wolfcue_private.rooms set status='dealt',version=version+1,last_effective_at=now() where id=r.id;
  end if;
 elsif p_action in ('dissolve','end') then
  if actor<>r.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
  if (p_action='dissolve' and r.status<>'waiting') or (p_action='end' and r.status<>'dealt') then
   raise exception using errcode='22023',message='INVALID_ROOM_STATE'; end if;
  if p_action='end' and not exists(select 1 from wolfcue_private.deal_transactions
    where room_id=r.id and id=(p_body->>'dealId')::uuid) then
   raise exception using errcode='22023',message='DEAL_MISMATCH'; end if;
  -- Host-authenticated terminal notification. Integration must call ONLY from
  -- original formal finished state. Backend does not invent/recompute victory.
  update wolfcue_private.rooms set status=case when p_action='end' then 'ended' else 'dissolved' end,
   version=version+1,closed_at=now() where id=r.id;
 elsif p_action in ('seat','leave','clear') then
  if r.status<>'waiting' then return jsonb_build_object('error','ROOM_FULL','message','房間人數已滿，無法加入'); end if;
  if p_action='clear' and actor<>r.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
  if p_action<>'clear' and actor=r.host_id then raise exception using errcode='42501',message='HOST_NOT_PLAYER'; end if;
  target:=(p_body->>'seat')::integer;
  expected:=(p_body->>'lease')::uuid;
  select * into src from wolfcue_private.room_seats where room_id=r.id and user_id=actor;
  if p_action<>'clear' and src.lease is distinct from expected then
   raise exception using errcode='42501',message='STALE_SEAT_LEASE'; end if;
  if p_action='leave' then
   if src.user_id is not null then
    update wolfcue_private.room_seats set user_id=null,lease=null where room_id=r.id and seat=src.seat;
    update wolfcue_private.rooms set last_effective_at=now(),version=version+1 where id=r.id;
   end if;
  else
   select * into dst from wolfcue_private.room_seats where room_id=r.id and seat=target;
   if not found then raise exception using errcode='22023',message='INVALID_SEAT'; end if;
   if p_action='clear' then
    if expected is null or dst.lease is distinct from expected then
     raise exception using errcode='22023',message='STALE_SEAT_LEASE'; end if;
    update wolfcue_private.room_seats set user_id=null,lease=null where room_id=r.id and seat=target;
   else
    if dst.user_id=actor then return wolfcue_private.snapshot(r.id,actor); end if;
    if dst.user_id is not null then
     return jsonb_build_object('error','SEAT_TAKEN','message',target||' 號已被其他玩家選擇，請選擇其他座位'); end if;
    -- Target availability validated under room lock BEFORE touching source.
    update wolfcue_private.room_seats set user_id=null,lease=null where room_id=r.id and user_id=actor;
    update wolfcue_private.room_seats set user_id=actor,lease=gen_random_uuid() where room_id=r.id and seat=target;
   end if;
   update wolfcue_private.rooms set last_effective_at=now(),version=version+1 where id=r.id;
  end if;
 else raise exception using errcode='22023',message='UNKNOWN_ACTION';
 end if;
 if p_action in ('create','recover') and actor=r.host_id then
  return wolfcue_private.snapshot(r.id,actor)||jsonb_build_object('inviteToken',
   (select invite_token from wolfcue_private.room_secrets where room_id=r.id));
 end if;
 return wolfcue_private.snapshot(r.id,actor);
end $$;
revoke all on function wolfcue_private.command(text,uuid,jsonb) from public,anon;
grant execute on function wolfcue_private.command(text,uuid,jsonb) to authenticated;
create function public.wolfcue_command(p_action text,p_room uuid default null,p_body jsonb default '{}')
returns jsonb language sql security invoker set search_path = ''
as $$ select wolfcue_private.command(p_action,p_room,p_body) $$;
revoke all on function public.wolfcue_command(text,uuid,jsonb) from public,anon;
grant execute on function public.wolfcue_command(text,uuid,jsonb) to authenticated;

create function wolfcue_private.expire_rooms() returns integer
language plpgsql security definer set search_path = ''
as $$
declare n integer;
begin
 with due as (select id from wolfcue_private.rooms where status='waiting'
  and last_effective_at<=now()-interval '2 hours' order by id for update skip locked limit 500)
 update wolfcue_private.rooms r set status='expired',closed_at=now(),version=version+1
 from due where r.id=due.id and r.status='waiting' and r.last_effective_at<=now()-interval '2 hours';
 get diagnostics n=row_count;
 return n;
end $$;
revoke all on function wolfcue_private.expire_rooms() from public,anon,authenticated;
grant execute on function wolfcue_private.expire_rooms() to service_role;
create function public.wolfcue_expire() returns integer language sql security invoker set search_path=''
as $$ select wolfcue_private.expire_rooms() $$;
revoke all on function public.wolfcue_expire() from public,anon,authenticated;
grant execute on function public.wolfcue_expire() to service_role;
