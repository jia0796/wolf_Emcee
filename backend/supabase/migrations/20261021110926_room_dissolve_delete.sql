-- Owner-only terminal transaction. No role/seat/invite data or deletion tombstone
-- survives. Missing UUIDs are safe idempotent no-ops, never a different room.
create or replace function wolfcue_private.close_room(p_action text,p_room uuid,p_body jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
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
end $$;
revoke all on function wolfcue_private.close_room(text,uuid,jsonb) from public,anon,authenticated,service_role;

-- Keep the established command validation/ownership/role/seat/deal logic intact.
-- Delegate terminal operations after its existing authenticated-input checks.
do $$
declare
 definition text:=pg_get_functiondef('wolfcue_private.command(text,uuid,jsonb)'::regprocedure);
 anchor text:=' if p_action=''create'' then';
begin
 if position('wolfcue_private.close_room' in definition)>0 then return; end if;
 if position(anchor in definition)=0 then raise exception 'Unexpected command definition; refusing patch'; end if;
 execute replace(definition,anchor,
  ' if p_action in (''dissolve'',''end'') then return wolfcue_private.close_room(p_action,p_room,p_body); end if;'||chr(10)||anchor);
end $$;
