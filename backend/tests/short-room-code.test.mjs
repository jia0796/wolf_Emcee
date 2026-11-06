import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const sql=name=>readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8').replace(/^\uFEFF/,'');
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;
create schema auth;create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
create schema realtime;create table realtime.messages(extension text,topic text);alter table realtime.messages enable row level security;
create function realtime.send(jsonb,text,text,boolean) returns void language sql as $$select$$;
create function realtime.topic() returns text language sql as $$select ''::text$$;`);
await db.exec(sql('20261020134928_online_dealing_draft.sql'));
await db.exec(readFileSync(new URL('../supabase/seed.sql',import.meta.url),'utf8'));
for(const name of ['20261021110926_room_dissolve_delete.sql','20261024082212_host_roles_player_recap.sql'])await db.exec(sql(name));
const user=async()=>{const id=randomUUID();await db.query('insert into auth.users values($1)',[id]);return id;};
const call=(id,action,room=null,body={})=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);await tx.exec('set local role authenticated');return (await tx.query('select public.wolfcue_command($1,$2,$3::jsonb) value',[action,room,JSON.stringify(body)])).rows[0].value;});
const join=(id,code)=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id||'']);await tx.exec('set local role authenticated');return (await tx.query('select public.wolfcue_join_code($1) value',[code])).rows[0].value;});
const create=async(board='10')=>{const id=await user();return {id,...await call(id,'create',null,{boardId:board,requestId:randomUUID()})};};
const legacy=await create();
await db.exec(sql('20261106071704_short_room_codes.sql'));
const all=[];
async function check(name,fn){await test(name,async()=>{await fn();all.push(name);});}
try{
await check('existing room ID, display code, invite and request preserved; short code backfilled',async()=>{
 const s=await call(legacy.id,'recover',legacy.roomId);assert.equal(s.roomCode,legacy.roomCode);assert.equal(s.inviteToken,legacy.inviteToken);assert.equal(s.roomId,legacy.roomId);assert.match(s.joinCode,/^[A-HJKMNP-Z2-9]{5}$/);
});
await check('new codes unique, mixed letters/digits; simultaneous creates are idempotent',async()=>{
 const codes=new Set();for(let i=0;i<70;i++){const r=await create();assert.match(r.joinCode,/^[A-HJKMNP-Z2-9]{5}$/);assert.match(r.joinCode,/[2-9]/);assert.match(r.joinCode,/[A-Z]/);codes.add(r.joinCode);}assert.equal(codes.size,70);
 const id=await user(),requestId=randomUUID();const rs=await Promise.all(Array.from({length:5},()=>call(id,'create',null,{boardId:'10',requestId})));assert.equal(new Set(rs.map(r=>r.roomId)).size,1);assert.equal(new Set(rs.map(r=>r.joinCode)).size,1);
});
await check('forced collision retries without overwriting an existing mapping',async()=>{
 const previous=(await db.query("select pg_get_functiondef('wolfcue_private.new_join_code()'::regprocedure) d")).rows[0].d;
 const old=await create();await db.exec('create sequence public.code_test_sequence');
 await db.exec(`create or replace function wolfcue_private.new_join_code() returns text language plpgsql volatile set search_path='' as $$ begin if nextval('public.code_test_sequence')=1 then return '${old.joinCode}';end if;return 'ZZ2ZZ';end $$`);
 const fresh=await create();assert.equal(fresh.joinCode,'ZZ2ZZ');assert.equal((await call(old.id,'recover',old.roomId)).joinCode,old.joinCode);await db.exec(previous);
});
await check('lowercase and whitespace join; no invitation, host roles or other private roles exposed',async()=>{
 const r=await create(),id=await user(),s=await join(id,' '+r.joinCode.toLowerCase()+' ');assert.equal(s.roomId,r.roomId);assert.equal(s.inviteToken,undefined);assert.equal(s.hostRoles,undefined);assert.equal(JSON.stringify(s).includes(r.inviteToken),false);
 assert.equal((await call(id,'join',r.roomId)).roomId,r.roomId);await assert.rejects(call(await user(),'join',r.roomId),/ROOM_UNAVAILABLE/);
 await assert.rejects(call(id,'deal',r.roomId,{requestId:randomUUID()}),/HOST_REQUIRED/);
});
await check('original invitation links still work and wrong token is rejected for member',async()=>{
 const r=await create(),id=await user();assert.equal((await call(id,'join',r.roomId,{inviteToken:r.inviteToken})).roomId,r.roomId);await assert.rejects(call(id,'join',r.roomId,{inviteToken:'wrong'}),/ROOM_UNAVAILABLE/);
});
await check('six attempts/minute, thirty/hour, unknown/invalid attempts persist and expiry unlocks',async()=>{
 const id=await user();for(let i=0;i<6;i++)assert.equal((await join(id,'?')).error,'INVALID_CODE');let s=await join(id,'AB2CD');assert.equal(s.error,'RATE_LIMITED');assert.ok(s.retryAfter>0&&s.retryAfter<=60);
 await db.query("update wolfcue_private.room_join_attempts set minute_start=now()-interval '2 minutes' where user_id=$1",[id]);assert.equal((await join(id,'AB2CD')).error,'ROOM_UNAVAILABLE');
 await db.query("update wolfcue_private.room_join_attempts set minute_start=now()-interval '2 minutes',hour_count=30 where user_id=$1",[id]);assert.equal((await join(id,'AB2CD')).error,'RATE_LIMITED');
 await db.query("update wolfcue_private.room_join_attempts set hour_start=now()-interval '2 hours' where user_id=$1",[id]);assert.equal((await join(id,'AB2CD')).error,'ROOM_UNAVAILABLE');
});
await check('expired/dissolved codes denied, dissolved code mapping removed',async()=>{
 const r=await create();await db.query("update wolfcue_private.rooms set last_effective_at=now()-interval '3 hours' where id=$1",[r.roomId]);assert.equal((await join(await user(),r.joinCode)).error,'ROOM_UNAVAILABLE');
 const r2=await create();await call(r2.id,'dissolve',r2.roomId);assert.equal((await join(await user(),r2.joinCode)).error,'ROOM_UNAVAILABLE');assert.equal((await db.query('select count(*)::int n from wolfcue_private.room_join_codes where room_id=$1',[r2.roomId])).rows[0].n,0);
});
for(const board of ['10','12'])await check(board+' seats/deal/privacy/rejoin and new entrants after deal',async()=>{
 const r=await create(board),players=[];for(let i=0;i<r.capacity;i++){const id=await user();await join(id,r.joinCode);const s=await call(id,'seat',r.roomId,{seat:i+1});players.push({id,lease:s.seats.find(x=>x.mine).lease});}
 assert.equal((await join(await user(),r.joinCode)).error,'ROOM_FULL');
 const deal=await call(r.id,'deal',r.roomId,{requestId:randomUUID()});assert.equal(deal.hostRoles.length,r.capacity);
 const s=await join(players[0].id,r.joinCode);assert.equal(s.hostRoles,undefined);assert.equal(s.status,'dealt');
 assert.ok((await call(players[0].id,'my_role',r.roomId,{lease:players[0].lease})).role);
 await assert.rejects(call(players[0].id,'my_role',r.roomId,{lease:players[1].lease}),/SEAT_AUTH_REQUIRED/);
 assert.equal((await join(await user(),r.joinCode)).error,'ROOM_FULL');
 const repeated=await call(r.id,'deal',r.roomId,{requestId:randomUUID()});assert.equal(repeated.dealId,deal.dealId);
 await call(r.id,'end',r.roomId,{dealId:deal.dealId});assert.equal((await join(players[0].id,r.joinCode)).error,'ROOM_UNAVAILABLE');
});
await check('no direct code/rate table reads or helper calls; anonymous and deleted identities rejected',async()=>{
 const rows=(await db.query("select has_table_privilege('authenticated','wolfcue_private.room_join_codes','select') a,has_table_privilege('authenticated','wolfcue_private.room_join_attempts','update') b,has_function_privilege('authenticated','wolfcue_private.ensure_join_code(uuid)','execute') c,has_function_privilege('anon','public.wolfcue_join_code(text)','execute') d")).rows[0];assert.deepEqual(rows,{a:false,b:false,c:false,d:false});
 const rls=(await db.query("select bool_and(relrowsecurity) r from pg_class where oid in ('wolfcue_private.room_join_codes'::regclass,'wolfcue_private.room_join_attempts'::regclass)")).rows[0];assert.equal(rls.r,true);
 await assert.rejects(join(null,'AB2CD'),/AUTH_REQUIRED/);await assert.rejects(join(randomUUID(),'AB2CD'),/AUTH_REQUIRED/);
});
await check('rollback refuses active rooms; after expiry removes only added code structures',async()=>{
 const rollback=readFileSync(new URL('../rollback/20261106-short-room-codes.sql',import.meta.url),'utf8').replace(/^\uFEFF/,'');
 await assert.rejects(db.exec(rollback),/Active rooms exist/);await db.exec('rollback');
 const before=(await db.query('select (select count(*)::int from auth.users) users,(select count(*)::int from wolfcue_private.rooms) rooms')).rows[0];
 await db.exec("update wolfcue_private.rooms set status='expired',closed_at=now()");
 await db.exec(rollback);
 const after=(await db.query('select (select count(*)::int from auth.users) users,(select count(*)::int from wolfcue_private.rooms) rooms')).rows[0];assert.deepEqual(after,before);
 assert.equal((await db.query("select to_regclass('wolfcue_private.room_join_codes') r")).rows[0].r,null);
 const fresh=await create();assert.equal(fresh.joinCode,undefined);assert.equal(fresh.roomCode.length,12);
});
}finally{await db.close();console.log('SQL checks completed: '+all.length+' (PGlite; Auth/Realtime adapters stubbed, not hosted Supabase)');}
