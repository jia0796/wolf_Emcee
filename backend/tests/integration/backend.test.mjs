import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';
import {localConfig} from '../../scripts/local-env.mjs';

const c=localConfig();
const pool=new pg.Pool({connectionString:c.DB_URL,max:20});
const factory=()=>createClient(c.API_URL,c.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=factory(),people=[];
const results={environment:'local Supabase Docker (real Auth/Postgres/PostgREST/Realtime)',tests:[]};
async function user(){
 const client=factory();const {data,error}=await client.auth.signInAnonymously();
 if(error)throw Error('Local anonymous Auth failed: '+error.message);
 const p={client,id:data.user.id,token:data.session.access_token};people.push(p);return p;
}
async function call(p,action,roomId=null,body={}){
 const {data,error}=await p.client.rpc('wolfcue_command',{p_action:action,p_room:roomId,p_body:body});
 if(error)return {error:error.message,code:error.code};
 return data;
}
const create=(h,boardId='10',requestId=randomUUID())=>call(h,'create',null,{boardId,requestId});
const own=s=>s.seats?.find(x=>x.mine);
async function setup(board='10'){
 const h=await user(),room=await create(h,board);assert.ok(room.roomId,'create');
 const players=await Promise.all(Array.from({length:room.capacity},user));
 for(let i=0;i<players.length;i++){
  const p=players[i];await call(p,'join',room.roomId,{inviteToken:room.inviteToken});
  const s=await call(p,'seat',room.roomId,{seat:i+1});assert.ok(own(s)?.lease);p.lease=own(s).lease;
 }
 return {h,room,players};
}
async function done(h,r){return call(h,'deal',r.roomId,{requestId:randomUUID()});}
async function close(h,r){const s=await call(h,'state',r.roomId);return call(h,s.status==='dealt'?'end':'dissolve',r.roomId,s.dealId?{dealId:s.dealId}:{});}
async function run(name,fn){await test(name,async()=>{await fn();results.tests.push({name,passed:true});});}

try{
 await run('anonymous user is authenticated DB role; unauthenticated RPC rejected',async()=>{
  const u=await user();const r=await create(u);assert.ok(r.roomId);
  const {error}=await anon.rpc('wolfcue_command',{p_action:'state',p_room:r.roomId,p_body:{}});
  assert.ok(error);await close(u,r);
 });
 await run('create retry, two tabs with differing IDs, recover: one room and stable invite',async()=>{
  const h=await user(),id=randomUUID();
  const rs=await Promise.all([create(h,'10',id),create(h,'10',id),create(h,'10')]);
  assert.equal(new Set(rs.map(r=>r.roomId)).size,1);
  assert.equal(new Set(rs.map(r=>r.inviteToken)).size,1);
  assert.ok(rs[0].inviteToken.length>=60);
  const recover=await call(h,'recover',rs[0].roomId);assert.equal(recover.inviteToken,rs[0].inviteToken);
  assert.equal((await create(h,'12',id)).error,'CREATE_CONFLICT');
  await close(h,rs[0]);
 });
 await run('10 and 12 capacities; all 27 authoritative role compositions exactly preserved',async()=>{
  const catalogue=JSON.parse(readFileSync('references/board-catalog.json'));
  for(const b of catalogue.boards){
   const {h,room,players}=await setup(b.id);
   assert.equal(room.capacity,b.capacity);
   const receipt=await done(h,room);assert.equal(receipt.status,'dealt');
   const actual={};
   for(const p of players){
    const x=await call(p,'my_role',room.roomId,{lease:p.lease});
    assert.ok(x.role);actual[x.role]=(actual[x.role]||0)+1;
   }
   assert.deepEqual(actual,b.roles,`role composition ${b.id}`);
   assert.equal((await call(players[0],'seat',room.roomId,{seat:room.capacity+1,lease:players[0].lease})).error,'ROOM_FULL');
   await close(h,room);
  }
 });
 await run('20 real concurrent same-seat claims have exactly one winner',async()=>{
  const h=await user(),r=await create(h),ps=await Promise.all(Array.from({length:20},user));
  await Promise.all(ps.map(p=>call(p,'join',r.roomId,{inviteToken:r.inviteToken})));
  const outcomes=await Promise.all(ps.map(p=>call(p,'seat',r.roomId,{seat:1})));
  assert.equal(outcomes.filter(x=>own(x)?.seat===1).length,1);
  assert.equal(outcomes.filter(x=>x.error==='SEAT_TAKEN').length,19);
  await close(h,r);
 });
 await run('failed swap retains source; clear revokes lease; same browser may select again',async()=>{
  const {h,room:r,players:p}=await setup();
  const before=await call(p[0],'state',r.roomId);
  assert.equal((await call(p[0],'seat',r.roomId,{seat:2,lease:p[0].lease})).error,'SEAT_TAKEN');
  assert.equal(own(await call(p[0],'state',r.roomId)).lease,own(before).lease);
  await call(h,'clear',r.roomId,{seat:1,lease:p[0].lease});
  assert.equal((await call(p[0],'seat',r.roomId,{seat:1,lease:p[0].lease})).error,'STALE_SEAT_LEASE');
  const reseat=await call(p[0],'seat',r.roomId,{seat:1});
  assert.notEqual(own(reseat).lease,p[0].lease);
  assert.equal((await call(h,'clear',r.roomId,{seat:1,lease:p[0].lease})).error,'STALE_SEAT_LEASE');
  await close(h,r);
 });
 await run('leave, swap, stale tab, capacity bounds and host seat restriction',async()=>{
  const h=await user(),r=await create(h),p=await user();await call(p,'join',r.roomId,{inviteToken:r.inviteToken});
  assert.equal((await call(h,'seat',r.roomId,{seat:1})).error,'HOST_NOT_PLAYER');
  assert.equal((await call(p,'seat',r.roomId,{seat:11})).error,'INVALID_SEAT');
  const a=await call(p,'seat',r.roomId,{seat:1}),lease=own(a).lease;
  const b=await call(p,'seat',r.roomId,{seat:2,lease});assert.equal(own(b).seat,2);
  assert.equal((await call(p,'leave',r.roomId,{lease})).error,'STALE_SEAT_LEASE');
  await call(p,'leave',r.roomId,{lease:own(b).lease});
  assert.equal(own(await call(p,'state',r.roomId)),undefined);
  await close(h,r);
 });
 await run('full/new-visitor and dealt/new-visitor both use identical full message',async()=>{
  const {h,room:r}=await setup(),outsider=await user();
  const before=await call(outsider,'join',r.roomId,{inviteToken:r.inviteToken});
  await done(h,r);const after=await call(outsider,'join',r.roomId,{inviteToken:r.inviteToken});
  assert.deepEqual(before,after);assert.equal(after.message,'房間人數已滿，無法加入');
  await close(h,r);
 });
 await run('insufficient occupancy rejected; two host tabs and lost response retry never reshuffle',async()=>{
  const {h,room:r,players:p}=await setup();
  await call(p[0],'leave',r.roomId,{lease:p[0].lease});
  assert.equal((await done(h,r)).message,'遊玩人數不足，無法發牌');
  const state=await call(p[0],'seat',r.roomId,{seat:1});p[0].lease=own(state).lease;
  const [a,b]=await Promise.all([done(h,r),done(h,r)]);assert.equal(a.dealId,b.dealId);
  const roles=await Promise.all(p.map(x=>call(x,'my_role',r.roomId,{lease:x.lease})));
  const retried=await done(h,r);assert.equal(retried.dealId,a.dealId);
  assert.deepEqual(await Promise.all(p.map(x=>call(x,'my_role',r.roomId,{lease:x.lease}))),roles);
  assert.equal((await pool.query('select count(*)::int n from wolfcue_private.deal_transactions where room_id=$1',[r.roomId])).rows[0].n,1);
  await close(h,r);
 });
 await run('deal-versus-leave 12 races: each outcome is atomic and consistent',async()=>{
  for(let round=0;round<12;round++){
   const {h,room:r,players:p}=await setup();
   await Promise.all([done(h,r),call(p[0],'leave',r.roomId,{lease:p[0].lease})]);
   const state=await call(h,'state',r.roomId);
   const count=(await pool.query('select count(*)::int n from wolfcue_private.player_roles where room_id=$1',[r.roomId])).rows[0].n;
   if(state.status==='dealt'){assert.equal(count,10);assert.equal(state.seats.filter(s=>s.occupied).length,10);}
   else {assert.equal(count,0);assert.equal(state.seats.filter(s=>s.occupied).length,9);}
   await close(h,r);
  }
 });
 await run('forged host/user/role, cross-room state and roles, incorrect lease all rejected',async()=>{
  const {h,room:r,players:p}=await setup(),outsider=await user();await done(h,r);
  for(const action of ['state','recover','my_role','deal','end','clear']){
   assert.ok((await call(outsider,action,r.roomId,{requestId:randomUUID()})).error);
  }
  assert.equal((await call(p[0],'deal',r.roomId,{requestId:randomUUID()})).error,'HOST_REQUIRED');
  assert.equal((await call(p[0],'my_role',r.roomId,{lease:p[1].lease})).error,'SEAT_AUTH_REQUIRED');
  for(const key of ['hostId','playerId','role']){
   assert.equal((await call(p[0],'state',r.roomId,{[key]:h.id})).error,'INVALID_INPUT');
  }
  const state=await call(p[0],'state',r.roomId);assert.equal(JSON.stringify(state).includes('"role"'),false);
  assert.equal(state.inviteToken,undefined);assert.equal(state.seats[1].lease,null);
  await close(h,r);
 });
 await run('database RLS and GRANT reject direct bulk-role, secrets, writes, privileged functions',async()=>{
  const {h,room:r,players:p}=await setup();await done(h,r);
  const db=await pool.connect();
  try {
   await db.query('begin');await db.query('set local role authenticated');
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[p[0].id]);
   const rows=await db.query('select room_id,seat,role from wolfcue_private.player_roles');
   assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].seat,1);
   await db.query('rollback');
   for(const sql of [
    'select * from wolfcue_private.room_secrets',
    'select * from wolfcue_private.deal_transactions',
    'update wolfcue_private.player_roles set role=role',
    'select wolfcue_private.expire_rooms()',
    'select public.wolfcue_expire()',
    "select wolfcue_private.snapshot(null,null)"
   ]){
    await db.query('begin');await db.query('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[p[0].id]);
    await assert.rejects(db.query(sql));await db.query('rollback');
   }
  }finally{await db.query('rollback');db.release();}
  await close(h,r);
 });
 await run('expiry boundary, state polling does not refresh idle; dealt rooms never expire',async()=>{
  const h=await user(),r=await create(h);
  await pool.query("update wolfcue_private.rooms set last_effective_at=now()-interval '119 minutes' where id=$1",[r.roomId]);
  const a=(await pool.query('select last_effective_at from wolfcue_private.rooms where id=$1',[r.roomId])).rows[0];
  for(let i=0;i<5;i++)assert.equal((await call(h,'state',r.roomId)).status,'waiting');
  assert.deepEqual((await pool.query('select last_effective_at from wolfcue_private.rooms where id=$1',[r.roomId])).rows[0],a);
  await pool.query("update wolfcue_private.rooms set last_effective_at=now()-interval '2 hours' where id=$1",[r.roomId]);
  assert.equal((await call(h,'state',r.roomId)).status,'expired');
  const x=await setup();await done(x.h,x.room);
  await pool.query("update wolfcue_private.rooms set last_effective_at=now()-interval '10 days' where id=$1",[x.room.roomId]);
  await pool.query('select wolfcue_private.expire_rooms()');
  assert.equal((await call(x.h,'state',x.room.roomId)).status,'dealt');await close(x.h,x.room);
 });
 await run('dissolved links invalid; official end idempotently closes own-role access',async()=>{
  const {h,room:r,players:p}=await setup();const d=await done(h,r);
  assert.equal((await call(p[0],'my_role',r.roomId,{lease:p[0].lease})).seat,1);
  const end=await call(h,'end',r.roomId,{dealId:d.dealId});assert.equal(end.status,'ended');
  assert.equal((await call(p[0],'my_role',r.roomId,{lease:p[0].lease})).role,undefined);
  assert.equal((await call(h,'end',r.roomId,{dealId:d.dealId})).status,'ended');
  const h2=await user(),r2=await create(h2);await close(h2,r2);
  assert.equal((await call(await user(),'join',r2.roomId,{inviteToken:r2.inviteToken})).error,'ROOM_UNAVAILABLE');
  assert.equal((await pool.query('select count(*)::int n from wolfcue_private.rooms where id=any($1::uuid[])',[[r.roomId,r2.roomId]])).rows[0].n,0);
 });
} finally {
 await pool.end();
 for(const p of people)await p.client.removeAllChannels();
 writeFileSync('reports/database-results.json',JSON.stringify(results,null,2));
}
