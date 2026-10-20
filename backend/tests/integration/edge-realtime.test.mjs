import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {writeFileSync} from 'node:fs';
import {localConfig} from '../../scripts/local-env.mjs';
const c=localConfig(),clients=[],passed=[];
const make=()=>createClient(c.API_URL,c.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function user(){const client=make();clients.push(client);const {data,error}=await client.auth.signInAnonymously();assert.equal(error,null);return {client,token:data.session.access_token};}
async function edge(p,action,roomId=null,body={}){
 const res=await fetch(c.FUNCTIONS_URL+'/room',{method:'POST',headers:{
  apikey:c.ANON_KEY,Authorization:'Bearer '+p.token,'Content-Type':'application/json'
 },body:JSON.stringify({action,roomId,body})});
 return {status:res.status,data:await res.json(),cache:res.headers.get('Cache-Control')};
}
async function run(name,fn){await test(name,async()=>{await fn();passed.push(name);});}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function subscribe(p,roomId,onEvent=()=>{}){
 await p.client.realtime.setAuth(p.token);
 const ch=p.client.channel('wolfcue:'+roomId,{config:{private:true,broadcast:{ack:true}}})
  .on('broadcast',{event:'changed'},onEvent);
 const status=await new Promise(resolve=>{
  const timeout=setTimeout(()=>resolve('TIMEOUT'),10000);
  ch.subscribe(s=>{if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(s)){clearTimeout(timeout);resolve(s);}});
 });
 return {ch,status};
}
try{
 await run('Edge validates JWT, refuses forged identity and never caches role responses',async()=>{
  const h=await user(),r=await edge(h,'create',null,{boardId:'10',requestId:randomUUID()});
  assert.equal(r.status,200);assert.equal(r.cache,'no-store');
  assert.ok(r.data.roomId);
  assert.equal((await edge({token:'invalid'},'state',r.data.roomId)).status,401);
  assert.equal((await edge(h,'state',r.data.roomId,{hostId:randomUUID()})).status,400);
  const outsider=await user();assert.equal((await edge(outsider,'state',r.data.roomId)).status,403);
  assert.equal((await edge(h,'dissolve',r.data.roomId)).data.status,'dissolved');
 });
 await run('Edge 10-player deal and own-role flow; new visitor and role spoof blocked',async()=>{
  const h=await user(),r=(await edge(h,'create',null,{boardId:'10',requestId:randomUUID()})).data;
  const ps=await Promise.all(Array.from({length:10},user));
  for(let i=0;i<10;i++){
   assert.equal((await edge(ps[i],'join',r.roomId,{inviteToken:r.inviteToken})).status,200);
   const seat=await edge(ps[i],'seat',r.roomId,{seat:i+1});ps[i].lease=seat.data.seats.find(s=>s.mine).lease;
  }
  const deal=await edge(h,'deal',r.roomId,{requestId:randomUUID()});assert.equal(deal.data.status,'dealt');
  const role=await edge(ps[0],'my_role',r.roomId,{lease:ps[0].lease});assert.equal(role.status,200);assert.equal(role.data.seat,1);assert.equal(role.cache,'no-store');
  assert.equal((await edge(ps[0],'my_role',r.roomId,{lease:ps[1].lease})).status,403);
  const newcomer=await user();assert.equal((await edge(newcomer,'join',r.roomId,{inviteToken:r.inviteToken})).data.error,'ROOM_FULL');
  assert.equal((await edge(h,'end',r.roomId,{dealId:deal.data.dealId})).data.status,'ended');
  assert.equal((await edge(ps[0],'my_role',r.roomId,{lease:ps[0].lease})).data.role,undefined);
 });
 await run('private Realtime: member receives only safe state; outsider cannot join; client cannot spoof',async()=>{
  const h=await user(),p=await user(),out=await user();
  const r=(await edge(h,'create',null,{boardId:'10',requestId:randomUUID()})).data;
  await edge(p,'join',r.roomId,{inviteToken:r.inviteToken});
  const received=[];
  const member=await subscribe(p,r.roomId,e=>received.push(e.payload));assert.equal(member.status,'SUBSCRIBED');
  const stranger=await subscribe(out,r.roomId);assert.notEqual(stranger.status,'SUBSCRIBED');
  const seat=await edge(p,'seat',r.roomId,{seat:1});assert.equal(seat.status,200);
  for(let i=0;i<30&&!received.length;i++)await pause(100);
  assert.ok(received.length>0);
  for(const msg of received)assert.deepEqual(Object.keys(msg).sort(),['id','roomId','status','version']);
  const before=received.length;
  const send=await member.ch.send({type:'broadcast',event:'changed',payload:{role:'TEST_FORGED',status:'dealt'}});
  await pause(500);
  assert.equal(received.slice(before).some(x=>x.role==='TEST_FORGED'),false);
  assert.notEqual(send,'ok');
  // Disconnect and reconnect must refetch authority, rather than replaying roles.
  await p.client.removeChannel(member.ch);
  const rejoined=await subscribe(p,r.roomId);assert.equal(rejoined.status,'SUBSCRIBED');
  assert.equal((await edge(p,'state',r.roomId)).data.seats[0].mine,true);
  await edge(h,'dissolve',r.roomId);
  assert.equal((await edge(p,'state',r.roomId)).data.status,'dissolved');
  await p.client.removeChannel(rejoined.ch);
  const revoked=await subscribe(p,r.roomId);assert.notEqual(revoked.status,'SUBSCRIBED');
 });
 await run('cleanup worker rejects player JWT and missing authentication',async()=>{
  const p=await user();
  for(const auth of ['',`Bearer ${p.token}`]){
   const res=await fetch(c.FUNCTIONS_URL+'/cleanup',{method:'POST',headers:{apikey:c.ANON_KEY,Authorization:auth}});
   assert.equal(res.status,401);
  }
 });
 await run('cleanup accepts verified local service credential; production CORS accepts only approved origin',async()=>{
  const res=await fetch(c.FUNCTIONS_URL+'/cleanup',{method:'POST',headers:{apikey:c.ANON_KEY,Authorization:`Bearer ${c.SERVICE_ROLE_KEY}`}});
  assert.equal(res.status,200);assert.equal(typeof(await res.json()).closed,'number');
  for(const [origin,status]of [['https://jia0796.github.io',401],['https://untrusted.invalid',403]]){
   const r=await fetch(c.FUNCTIONS_URL+'/room',{method:'POST',headers:{Origin:origin,apikey:c.ANON_KEY}});
   assert.equal(r.status,status);
   // Local gateway may replace CORS headers with '*'; enforce the actual
   // request rejection above, not a gateway-owned header.
  }
 });
}finally{
 for(const client of clients)await client.removeAllChannels();
 writeFileSync('reports/edge-realtime-results.json',JSON.stringify({environment:'local Supabase Edge Runtime and real Realtime WebSocket',passed},null,2));
}

