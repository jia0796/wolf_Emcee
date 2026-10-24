-- Restore frontend and Edge first. Keep archives and the current expiry cleanup.
-- Restore original command/close/snapshot only; do not DROP data or revert the archive expiry job.
begin;
CREATE OR REPLACE FUNCTION wolfcue_private.close_room(p_action text, p_room uuid, p_body jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 actor uuid:=auth.uid();
 r wolfcue_private.rooms%rowtype;
 terminal text:=case when p_action='end' then 'ended' else 'dissolved' end;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_room is null or p_action not in ('dissolve','end') then
  raise exception using errcode='22023',message='INVALID_INPUT'; end if;
 select * into r from wolfcue_private.rooms where id=p_room for update;
 if not found then return jsonb_build_object('roomId',p_room,'status',terminal,'version',0,'deleted',true,'seats','[]'::jsonb); end if;
 if actor<>r.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
 if p_action='end' and r.status='dealt' and not exists(
  select 1 from wolfcue_private.deal_transactions where room_id=r.id and id=(p_body->>'dealId')::uuid
 ) then raise exception using errcode='22023',message='DEAL_MISMATCH'; end if;
 if p_action='end' and r.status not in ('dealt','ended','dissolved','expired') then
  raise exception using errcode='22023',message='INVALID_ROOM_STATE'; end if;
 -- Existing private Broadcast trigger carries only room ID/version/status.
 -- The message and cascaded deletion commit atomically under the room lock.
 update wolfcue_private.rooms set status=terminal,closed_at=now(),version=version+1
  where id=r.id returning * into r;
 delete from wolfcue_private.rooms where id=r.id;
 return jsonb_build_object('roomId',r.id,'status',terminal,'version',r.version,'deleted',true,'seats','[]'::jsonb);
end $function$
;
CREATE OR REPLACE FUNCTION wolfcue_private.command(p_action text, p_room uuid, p_body jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 if p_action in ('dissolve','end') then return wolfcue_private.close_room(p_action,p_room,p_body); end if;
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
end $function$
;
CREATE OR REPLACE FUNCTION wolfcue_private.snapshot(p_room uuid, p_actor uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
commit;

