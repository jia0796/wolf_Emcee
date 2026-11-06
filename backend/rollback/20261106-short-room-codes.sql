-- Reference rollback only: copy into a NEW CLI-created migration after review.
-- Never edit migration history. Roll back the website first and keep the additive backend
-- until all waiting/dealt rooms have ended; do not disconnect active short-code entrants.
begin;
do $$ declare definition text; needle text; begin
 if exists(select 1 from wolfcue_private.rooms where status in ('waiting','dealt')) then
  raise exception 'Active rooms exist; preserve compatible short-code backend until rooms end';
 end if;
 select pg_get_functiondef('wolfcue_private.snapshot(uuid,uuid)'::regprocedure) into definition;
 needle:=',''joinCode'',(select code from wolfcue_private.room_join_codes where room_id=r.id)';
 if position(needle in definition)=0 then raise exception 'snapshot changed; review rollback'; end if;
 execute replace(definition,needle,'');
 select pg_get_functiondef('wolfcue_private.command(text,uuid,jsonb)'::regprocedure) into definition;
 needle:='if (not member or p_body ? ''inviteToken'') and invitation is distinct from p_body->>''inviteToken'' then';
 if position(needle in definition)=0 then raise exception 'command changed; review rollback'; end if;
 execute replace(definition,needle,'if invitation is distinct from p_body->>''inviteToken'' then');
end $$;
drop function public.wolfcue_join_code(text);
drop function wolfcue_private.join_by_code(text);
drop trigger room_join_code_created on wolfcue_private.rooms;
drop function wolfcue_private.assign_join_code();
drop function wolfcue_private.ensure_join_code(uuid);
drop function wolfcue_private.new_join_code();
drop table wolfcue_private.room_join_attempts;
drop table wolfcue_private.room_join_codes;
commit;
