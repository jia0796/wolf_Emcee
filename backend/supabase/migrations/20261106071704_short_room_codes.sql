-- Additive short-code entry; existing IDs, display codes, invites and assignments remain intact.
create table wolfcue_private.room_join_codes (
 room_id uuid primary key references wolfcue_private.rooms(id) on delete cascade,
 code text not null unique check(code ~ '^[A-HJKMNP-Z2-9]{5}$' and code ~ '[2-9]' and code ~ '[A-Z]')
);
alter table wolfcue_private.room_join_codes enable row level security;
revoke all on wolfcue_private.room_join_codes from public,anon,authenticated,service_role;

create function wolfcue_private.new_join_code() returns text
language plpgsql volatile set search_path='' as $$
declare alphabet text:='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; code text; n integer;
begin
 loop
  code:='';
  while length(code)<5 loop
   n:=('x'||substr(replace(gen_random_uuid()::text,'-',''),1,2))::bit(8)::integer;
   -- 31 symbols, rejection sampling avoids modulo bias.
   if n<248 then code:=code||substr(alphabet,(n%31)+1,1); end if;
  end loop;
  if code ~ '[2-9]' and code ~ '[A-Z]' then return code; end if;
 end loop;
end $$;
revoke all on function wolfcue_private.new_join_code() from public,anon,authenticated,service_role;

create function wolfcue_private.ensure_join_code(p_room uuid) returns text
language plpgsql security definer set search_path='' as $$
declare result text;
begin
 perform 1 from wolfcue_private.rooms where id=p_room for update;
 if not found then raise exception 'ROOM_UNAVAILABLE'; end if;
 select code into result from wolfcue_private.room_join_codes where room_id=p_room;
 if result is not null then return result; end if;
 for attempt in 1..100 loop
  insert into wolfcue_private.room_join_codes(room_id,code) values(p_room,wolfcue_private.new_join_code())
   on conflict do nothing returning code into result;
  if result is not null then return result; end if;
 end loop;
 raise exception 'ROOM_CODE_BUSY';
end $$;
revoke all on function wolfcue_private.ensure_join_code(uuid) from public,anon,authenticated,service_role;
create function wolfcue_private.assign_join_code() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform wolfcue_private.ensure_join_code(new.id); return new; end $$;
revoke all on function wolfcue_private.assign_join_code() from public,anon,authenticated,service_role;
create trigger room_join_code_created after insert on wolfcue_private.rooms
 for each row execute function wolfcue_private.assign_join_code();
do $$ declare r record; begin
 for r in select id from wolfcue_private.rooms order by id loop perform wolfcue_private.ensure_join_code(r.id); end loop;
end $$;

-- Persistent, atomic per-identity limits also apply to direct RPC calls.
create table wolfcue_private.room_join_attempts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 minute_start timestamptz not null, minute_count integer not null,
 hour_start timestamptz not null, hour_count integer not null
);
alter table wolfcue_private.room_join_attempts enable row level security;
revoke all on wolfcue_private.room_join_attempts from public,anon,authenticated,service_role;

-- Add the public short code to the existing authorized snapshot, without exposing the invitation.
do $$ declare definition text; needle text; begin
 select pg_get_functiondef('wolfcue_private.snapshot(uuid,uuid)'::regprocedure) into definition;
 needle:='''roomId'',r.id,''roomCode'',r.display_code';
 if position(needle in definition)=0 then raise exception 'snapshot shape changed; inspect before migrating'; end if;
 execute replace(definition,needle,needle||',''joinCode'',(select code from wolfcue_private.room_join_codes where room_id=r.id)');
 -- Short-code entrants reconnect using their established room membership, never a guessed ID.
 select pg_get_functiondef('wolfcue_private.command(text,uuid,jsonb)'::regprocedure) into definition;
 needle:='if invitation is distinct from p_body->>''inviteToken'' then';
 if position(needle in definition)=0 then raise exception 'join shape changed; inspect before migrating'; end if;
 execute replace(definition,needle,'if (not member or p_body ? ''inviteToken'') and invitation is distinct from p_body->>''inviteToken'' then');
end $$;

create function wolfcue_private.join_by_code(p_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); t timestamptz:=clock_timestamp(); a wolfcue_private.room_join_attempts%rowtype;
 r wolfcue_private.rooms%rowtype; invitation text; result jsonb; retry integer;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor) then
  raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 insert into wolfcue_private.room_join_attempts values(actor,t,0,t,0) on conflict do nothing;
 select * into a from wolfcue_private.room_join_attempts where user_id=actor for update;
 if a.minute_start<=t-interval '1 minute' then a.minute_start:=t;a.minute_count:=0;end if;
 if a.hour_start<=t-interval '1 hour' then a.hour_start:=t;a.hour_count:=0;end if;
 if a.minute_count>=6 or a.hour_count>=30 then
  retry:=greatest(1,ceil(extract(epoch from ((case when a.hour_count>=30 then a.hour_start+interval '1 hour' else a.minute_start+interval '1 minute' end)-t)))::integer);
  return jsonb_build_object('error','RATE_LIMITED','message','嘗試次數較多，請稍後再試','retryAfter',retry);
 end if;
 update wolfcue_private.room_join_attempts set minute_start=a.minute_start,minute_count=a.minute_count+1,
  hour_start=a.hour_start,hour_count=a.hour_count+1 where user_id=actor;
 p_code:=upper(btrim(p_code));
 if p_code is null or p_code !~ '^[A-HJKMNP-Z2-9]{5}$' then
  return jsonb_build_object('error','INVALID_CODE','message','請輸入 5 碼英文與數字房號');
 end if;
 select rooms.* into r from wolfcue_private.rooms rooms join wolfcue_private.room_join_codes codes on codes.room_id=rooms.id
  where codes.code=p_code for update of rooms;
 if not found or r.status in ('ended','dissolved','expired') or
  (r.status='waiting' and r.last_effective_at<=t-interval '2 hours') then
  return jsonb_build_object('error','ROOM_UNAVAILABLE','message','房間不存在或已關閉，請確認房號');
 end if;
 -- Use the original join path for membership/capacity/dealt restrictions.
 select invite_token into invitation from wolfcue_private.room_secrets where room_id=r.id;
 begin
  result:=wolfcue_private.command('join',r.id,jsonb_build_object('inviteToken',invitation));
 exception when insufficient_privilege then
  return jsonb_build_object('error','ROOM_UNAVAILABLE','message','房間不存在或已關閉，請確認房號');
 end;
 return result;
end $$;
revoke all on function wolfcue_private.join_by_code(text) from public,anon,service_role;
grant execute on function wolfcue_private.join_by_code(text) to authenticated;
create function public.wolfcue_join_code(p_code text) returns jsonb
language sql security invoker set search_path='' as $$ select wolfcue_private.join_by_code(p_code) $$;
revoke all on function public.wolfcue_join_code(text) from public,anon,service_role;
grant execute on function public.wolfcue_join_code(text) to authenticated;
