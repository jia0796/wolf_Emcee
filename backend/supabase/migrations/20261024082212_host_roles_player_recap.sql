-- Active rooms still disappear at terminal close. This separate, bounded archive
-- is available only after formal end and only to the host/committed players.
create table wolfcue_private.finished_recaps(
 room_id uuid primary key,
 deal_id uuid not null unique,
 host_id uuid not null references auth.users(id),
 board_id text not null,
 recipients uuid[] not null,
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 check(octet_length(payload::text)<=2097152)
);
create index finished_recaps_expiry on wolfcue_private.finished_recaps(expires_at);
create index finished_recaps_host on wolfcue_private.finished_recaps(host_id);
alter table wolfcue_private.finished_recaps enable row level security;
revoke all on wolfcue_private.finished_recaps from public,anon,authenticated,service_role;
create policy final_recap_members on wolfcue_private.finished_recaps for select to authenticated
 using((select auth.uid())=any(recipients) and expires_at>now());

create or replace function wolfcue_private.snapshot(p_room uuid,p_actor uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'roomId',r.id,'roomCode',r.display_code,'boardId',r.board_id,'capacity',r.capacity,
 'status',r.status,'version',r.version,'catalogHash',b.catalog_hash,
 'seats',case when r.status in ('waiting','dealt') then
 (select jsonb_agg(jsonb_build_object('seat',s.seat,'occupied',s.user_id is not null,
 'mine',s.user_id=p_actor,'lease',case when s.user_id=p_actor or r.host_id=p_actor then s.lease else null end) order by s.seat)
 from wolfcue_private.room_seats s where s.room_id=r.id) else '[]'::jsonb end,
 'dealId',(select d.id from wolfcue_private.deal_transactions d where d.room_id=r.id))
 ||case when r.status='dealt' and p_actor=r.host_id and p_actor=auth.uid() then
 jsonb_build_object('hostRoles',(select jsonb_agg(jsonb_build_object('seat',p.seat,'role',p.role) order by p.seat)
 from wolfcue_private.player_roles p where p.room_id=r.id)) else '{}'::jsonb end
 from wolfcue_private.rooms r join wolfcue_private.boards b on b.id=r.board_id where r.id=p_room
$$;
revoke all on function wolfcue_private.snapshot(uuid,uuid) from public,anon,authenticated,service_role;

create function wolfcue_private.read_recap(p_room uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare saved wolfcue_private.finished_recaps%rowtype;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 select * into saved from wolfcue_private.finished_recaps
 where room_id=p_room and auth.uid()=any(recipients) and expires_at>now();
 if not found then raise exception using errcode='42501',message='ROOM_UNAVAILABLE'; end if;
 return jsonb_build_object('roomId',saved.room_id,'dealId',saved.deal_id,'boardId',saved.board_id,
 'status','ended','recap',saved.payload,'expiresAt',saved.expires_at);
end $$;
revoke all on function wolfcue_private.read_recap(uuid) from public,anon,authenticated,service_role;

create or replace function wolfcue_private.close_room(p_action text,p_room uuid,p_body jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid();r wolfcue_private.rooms%rowtype;
 saved wolfcue_private.finished_recaps%rowtype;did uuid;people uuid[];recap jsonb;
 terminal text:=case when p_action='end' then 'ended' else 'dissolved' end;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_room is null or p_action not in ('dissolve','end') then raise exception using errcode='22023',message='INVALID_INPUT'; end if;
 select * into r from wolfcue_private.rooms where id=p_room for update;
 if not found then
  select * into saved from wolfcue_private.finished_recaps where room_id=p_room;
  if found and p_action='end' then
   if actor<>saved.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
   if saved.deal_id is distinct from (p_body->>'dealId')::uuid then raise exception using errcode='22023',message='DEAL_MISMATCH'; end if;
   if p_body?'recap' and saved.payload is distinct from p_body->'recap' then raise exception using errcode='22023',message='RECAP_IMMUTABLE'; end if;
  end if;
  return jsonb_build_object('roomId',p_room,'status',terminal,'version',0,'deleted',true,'seats','[]'::jsonb);
 end if;
 if actor<>r.host_id then raise exception using errcode='42501',message='HOST_REQUIRED'; end if;
 select id into did from wolfcue_private.deal_transactions where room_id=r.id;
 if p_action='end' and r.status='dealt' and did is distinct from (p_body->>'dealId')::uuid then raise exception using errcode='22023',message='DEAL_MISMATCH'; end if;
 if p_action='end' and r.status not in ('dealt','ended','dissolved','expired') then raise exception using errcode='22023',message='INVALID_ROOM_STATE'; end if;
 if p_action='end' and p_body?'recap' then
  recap:=p_body->'recap';
  if r.status<>'dealt' or jsonb_typeof(recap)<>'object' or recap->>'boardId' is distinct from r.board_id
   or recap->>'step' is distinct from 'finished' or coalesce(recap->>'winner','') not in ('好人陣營','狼人陣營')
   or jsonb_typeof(recap->'players') is distinct from 'array' or jsonb_array_length(recap->'players')<>12
   or jsonb_typeof(recap->'nightRecords') is distinct from 'array' or jsonb_typeof(recap->'dayEvents') is distinct from 'array'
   or octet_length(recap::text)>2097152 then raise exception using errcode='22023',message='INVALID_RECAP'; end if;
  if (select count(distinct (p->>'id')::int) from jsonb_array_elements(recap->'players') p)<>12
   or exists(select 1 from jsonb_array_elements(recap->'players') p where jsonb_typeof(p->'active') is distinct from 'boolean'
   or jsonb_typeof(p->'alive') is distinct from 'boolean' or (p->>'id')::int not between 1 and 12
   or (p->>'active')::boolean is distinct from ((p->>'id')::int<=r.capacity))
   or exists(select 1 from wolfcue_private.player_roles pr where pr.room_id=r.id and not exists(
    select 1 from jsonb_array_elements(recap->'players') p where (p->>'id')::int=pr.seat and p->>'role'=pr.role))
  then raise exception using errcode='22023',message='INVALID_RECAP'; end if;
  select array_append(array_agg(user_id order by seat),actor) into people from wolfcue_private.player_roles where room_id=r.id;
  insert into wolfcue_private.finished_recaps(room_id,deal_id,host_id,board_id,recipients,payload)
   values(r.id,did,actor,r.board_id,people,recap);
 end if;
 -- The existing private signal contains only room/status/version, never recap or roles.
 update wolfcue_private.rooms set status=terminal,closed_at=now(),version=version+1 where id=r.id returning * into r;
 delete from wolfcue_private.rooms where id=r.id;
 return jsonb_build_object('roomId',r.id,'status',terminal,'version',r.version,'deleted',true,'seats','[]'::jsonb);
end $$;
revoke all on function wolfcue_private.close_room(text,uuid,jsonb) from public,anon,authenticated,service_role;

do $$
declare definition text:=pg_get_functiondef('wolfcue_private.command(text,uuid,jsonb)'::regprocedure);
 anchor text:=' if p_action in (''dissolve'',''end'') then return wolfcue_private.close_room(p_action,p_room,p_body); end if;';
begin
 if position(anchor in definition)=0 then raise exception 'Unexpected command; refusing patch'; end if;
 definition:=replace(definition,'array[''requestId'',''boardId'',''inviteToken'',''seat'',''lease'',''dealId'']',
 'array[''requestId'',''boardId'',''inviteToken'',''seat'',''lease'',''dealId'',''recap'']');
 execute replace(definition,anchor,
 ' if p_action<>''end'' and p_body?''recap'' then raise exception using errcode=''22023'',message=''INVALID_INPUT''; end if;'||chr(10)||
 ' if p_action=''recap'' then if p_body<>''{}''::jsonb then raise exception using errcode=''22023'',message=''INVALID_INPUT''; end if; return wolfcue_private.read_recap(p_room); end if;'||chr(10)||anchor);
end $$;

-- Reuse the existing expiry job, without adding a second scheduler.
do $$
declare definition text:=pg_get_functiondef('wolfcue_private.expire_rooms()'::regprocedure);
begin execute replace(definition,'begin','begin'||chr(10)||' delete from wolfcue_private.finished_recaps where expires_at<=now();');end $$;
