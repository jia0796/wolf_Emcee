import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {BOARDS} from '../../public/data.js';
if(process.env.ALLOW_WOLFCUE_LIVE!=='1')throw Error('Explicit live test flag required');
const source=readFileSync('../public/online.js','utf8'),api=source.match(/const URL='([^']+)'/)[1],key=source.match(/const KEY='([^']+)'/)[1];
assert.equal(api,'https://cnseutkrrjkdkpikjcdz.supabase.co');
const out='../../output/room-code-nightorder/live-api';mkdirSync(out,{recursive:true});
const people=[],rooms=[],checks=[];let failure=null;
const checkpoint=()=>writeFileSync(out+'/cleanup-private.json',JSON.stringify({users:people.map(x=>x.id),rooms:rooms.map(x=>x.roomId)}));
async function user(){const client=createClient(api,key,{auth:{persistSession:false,autoRefreshToken:true}});for(let attempt=0;attempt<25;attempt++){const {data,error}=await client.auth.signInAnonymously();if(error?.status===429){console.log('Auth rate limit: waiting 120 seconds; retaining existing test identities');await new Promise(r=>setTimeout(r,120000));continue;}if(error)throw Error('Test signup failed: '+error.status);const p={client,id:data.user.id,session:data.session};people.push(p);checkpoint();return p;}throw Error('Auth rate limit did not recover; no test room created');}
async function call(p,action,roomId=null,body={}){const r=await fetch(api+'/functions/v1/room',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+p.session.access_token,'Content-Type':'application/json',Origin:'https://wolfcue.runs-at.dev'},body:JSON.stringify({action,roomId,body})});return {status:r.status,data:await r.json()};}
const ok=async(p,action,roomId=null,body={})=>{const r=await call(p,action,roomId,body);assert.equal(r.status,200,action+': '+r.data.error);return r.data;};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
try{
 const host=await user(),players=[];for(let i=0;i<12;i++)players.push(await user());
 for(const board of (process.env.LIVE_BOARD?[process.env.LIVE_BOARD]:['awakenedKingWitch12','mechanical10'])){
  const capacity=BOARDS[board].playerCount;const requestId=randomUUID();const pair=await Promise.all([ok(host,'create',null,{boardId:board,requestId}),ok(host,'create',null,{boardId:board,requestId})]);const room=pair[0];rooms.push(room);checkpoint();assert.equal(pair[1].roomId,room.roomId);assert.equal(pair[1].joinCode,room.joinCode);assert.match(room.joinCode,/^[A-HJKMNP-Z2-9]{5}$/);assert.equal(room.roomCode.length,12);pass(board+': create retry retains UUID, original display code and unique short code');
  const forbidden=await call(players[0],'join',room.roomId,{});assert.equal(forbidden.status,403);pass(board+': raw UUID alone cannot admit outsider');
  const states=await Promise.all(players.slice(0,capacity).map((p,i)=>ok(p,i===capacity-1?'join':'join_code',i===capacity-1?room.roomId:null,i===capacity-1?{inviteToken:room.inviteToken}:{code:' '+room.joinCode.toLowerCase()+' '})));
  for(const state of states){assert.equal(state.roomId,room.roomId);assert.equal(state.inviteToken,undefined);assert.equal(state.hostRoles,undefined);}pass(board+': concurrent lowercase short joins plus original invite join');
  await players[0].client.realtime.setAuth(players[0].session.access_token);let received=0;const channel=players[0].client.channel('wolfcue:'+room.roomId,{config:{private:true}}).on('broadcast',{event:'changed'},msg=>{assert.equal(msg.payload.roomId,room.roomId);assert.equal(msg.payload.inviteToken,undefined);assert.equal(msg.payload.roles,undefined);received++;});
  // The hosted service can cold-start on first connection. Keep SDK reconnection active,
  // as the app does; a transient CHANNEL_ERROR is not the final subscription outcome.
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Private Realtime subscription timed out after SDK retries')),45000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);resolve();}});});
  const seats=await Promise.all(players.slice(0,capacity).map((p,i)=>ok(p,'seat',room.roomId,{seat:i+1})));
  const leases=seats.map(s=>s.seats.find(x=>x.mine).lease);
  const notificationDeadline=Date.now()+15000;while(!received&&Date.now()<notificationDeadline)await new Promise(r=>setTimeout(r,250));
  assert.ok(received>0,'private notification must arrive within 15 seconds');pass(board+': all seats reserved concurrently and private Realtime delivers safe state signal');
  const recovered=await ok(players[0],'join',room.roomId,{});assert.ok(recovered.seats.find(x=>x.mine));pass(board+': short-code member reconnects without disclosing invite');
  if(capacity===10)assert.equal((await call(players[11],'join_code',null,{code:room.joinCode})).data.error,'ROOM_FULL');
  const deals=await Promise.all([ok(host,'deal',room.roomId,{requestId:randomUUID()}),ok(host,'deal',room.roomId,{requestId:randomUUID()})]);assert.equal(deals[0].dealId,deals[1].dealId);assert.deepEqual(deals[0].hostRoles,deals[1].hostRoles);
  const counts={};for(const p of deals[0].hostRoles)counts[p.role]=(counts[p.role]||0)+1;assert.deepEqual(counts,BOARDS[board].roles);pass(board+': concurrent deal requests commit one deck with approved role counts');
  for(let i=0;i<capacity;i++){const own=await ok(players[i],'my_role',room.roomId,{lease:leases[i]});assert.equal(own.role,deals[0].hostRoles.find(x=>x.seat===i+1).role);const state=await ok(players[i],'state',room.roomId);assert.equal(state.hostRoles,undefined);}
  assert.equal((await call(players[0],'my_role',room.roomId,{lease:leases[1]})).status,403);pass(board+': every role belongs to its seat; foreign lease denied');
  assert.equal((await ok(players[0],'join_code',null,{code:room.joinCode})).status,'dealt');
  const closed=await ok(host,'end',room.roomId,{dealId:deals[0].dealId});assert.equal(closed.deleted,true);assert.equal((await call(players[1],'join_code',null,{code:room.joinCode})).data.error,'ROOM_UNAVAILABLE');await players[0].client.removeChannel(channel);pass(board+': existing player rejoin, official close and invalidated code');
 }
 // Host did not use the short-code entry before this, so exactly six invalid attempts are allowed.
 for(let i=0;i<6;i++)assert.equal((await call(host,'join_code',null,{code:'?????'})).data.error,'INVALID_CODE');const blocked=await call(host,'join_code',null,{code:'A78B2'});assert.equal(blocked.status,429);assert.equal(blocked.data.error,'RATE_LIMITED');assert.ok(blocked.data.retryAfter>0);pass('six invalid attempts persist; seventh request is HTTP 429');
 const direct=await host.client.rpc('wolfcue_join_code',{p_code:'A78B2'});assert.equal(direct.error,null);assert.equal(direct.data.error,'RATE_LIMITED');pass('direct RPC cannot bypass short-code attempt limit');
}catch(e){failure=String(e);throw e;}finally{
 for(const room of rooms)if(people[0])await call(people[0],'dissolve',room.roomId).catch(()=>{});
 for(const p of people){await p.client.removeAllChannels();await p.client.auth.signOut({scope:'global'}).catch(()=>{});}checkpoint();
 writeFileSync(out+'/results.json',JSON.stringify({environment:'live Supabase, isolated synthetic accounts and rooms',passed:checks.length,failed:failure?1:0,checks,failure,identityCount:people.length,cleanup:'Rooms dissolved and test sessions signed out; precise Auth/recap/message cleanup verified separately'},null,2));
}
