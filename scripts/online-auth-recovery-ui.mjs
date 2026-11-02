import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5401/';
const out=new URL(process.env.UI_OUTPUT||'../../output/domain-migration/auth-local/',import.meta.url);await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5401'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const room={roomId:'11111111-1111-4111-8111-111111111111',inviteToken:'synthetic-invite',boardId:'12',capacity:12,status:'waiting',version:1,seats:Array.from({length:12},(_,i)=>({seat:i+1,occupied:false,mine:false}))};
async function open(mode,{player=false,noLocks=false}={}){
 const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 if(noLocks)await c.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));
 await c.route('**/*.supabase.co/**',r=>r.abort());
 await c.route('**/online-vendor.js',r=>r.fulfill({contentType:'text/javascript',body:`
 export async function toCanvas(){};
 export function createClient(){const s=window.authTest={token:${mode==='empty'?'null':"'old-test-token'"},signedOut:0,signedIn:0};return {
 auth:{getSession:async()=>({data:{session:s.token?{access_token:s.token}:null}}),
 getUser:async()=>(${mode==='auth-outage'?"{data:{user:null},error:{status:0}}":mode==='valid-session'?"{data:{user:{id:'same-test-identity'}},error:null}":"{data:{user:null},error:{status:401}}"}),
 signOut:async options=>{if(options.scope!=='local')throw Error('Wrong signout scope');s.signedOut++;s.token=null;return {error:null}},
 signInAnonymously:async()=>{s.signedIn++;s.token='new-test-token';return {data:{session:{access_token:s.token}},error:null}}},
 realtime:{setAuth:async()=>{}},channel:()=>{const c={on:()=>c,subscribe:()=>c};return c},removeChannel:async()=>{}}}
 `}));
 const p=await c.newPage();p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));
 const calls=[],roles=[];let roleCount=0,hold;
 await c.route('**/functions/v1/room',async r=>{
  const body=r.request().postDataJSON(),token=r.request().headers().authorization;
  const relevant=body.action===(player?'my_role':'create');const list=player?roles:calls;
  if(relevant)list.push({body,token});
  let status=200,data=player?{...room,status:'dealt',seats:room.seats.map((s,i)=>({...s,occupied:true,mine:i===0,lease:'test-lease'}))}:room;
  if(relevant&&!player){
   if(mode==='forbidden'){status=403;data={error:'FORBIDDEN'};}
   else if(mode==='always401'||list.length===1&&mode!=='empty'){
    status=401;data={error:'AUTH_REQUIRED'};
    if(mode==='other-tab')await p.evaluate(()=>window.authTest.token='other-tab-token');
   }
  }
  if(relevant&&player){
   roleCount++;
   if(roleCount===1)data={role:'guard'};
   else if(roleCount===2){status=401;data={error:'AUTH_REQUIRED'};}
   else {hold=r;return;}
  }
  await r.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await p.goto(base+(player?'#room='+room.roomId+'&invite=synthetic':''),{waitUntil:'domcontentloaded'});
 if(player)await p.locator('#onlineCard').waitFor();else{
  await p.locator('#start').click();await p.locator('#onlineMode').click();await p.locator('[data-count="12"]').click();await p.locator('[data-board="12"]').click();
 }
 const save=await p.evaluate(async()=>{const {createGame}=await import('./engine.js');const s=JSON.stringify(createGame('12'));localStorage.setItem('eclipse-host-v1',s);return s;});
 return {c,p,calls,roles,save,held:()=>hold};
}
try{
 for(const mode of ['recover','other-tab','always401','forbidden','empty','no-locks','auth-outage','valid-session']){
  const {c,p,calls,save}=await open(mode,{noLocks:mode==='no-locks'});await p.locator('#setupStart').click();
  if(['always401','forbidden','auth-outage'].includes(mode))await p.getByRole('button',{name:'重新連線',exact:true}).waitFor();else await p.locator('#onlineRing button').first().waitFor();
  const s=await p.evaluate(()=>window.authTest),twice=!['forbidden','empty','auth-outage'].includes(mode);
  assert.equal(calls.length,twice?2:1);if(twice)assert.deepEqual(calls[0].body,calls[1].body,'original requestId and operation must stay identical');
  assert.equal(s.signedOut,['recover','always401','no-locks'].includes(mode)?1:0);
  assert.equal(s.signedIn,['recover','always401','empty','no-locks'].includes(mode)?1:0);
  if(mode==='other-tab')assert.equal(calls[1].token,'Bearer other-tab-token');
  assert.equal(await p.evaluate(()=>localStorage.getItem('eclipse-host-v1')),save,'offline host save must survive online signout');
  if(mode==='recover')await p.screenshot({path:fileURLToPath(new URL('recovered-room.png',out)),animations:'disabled'});
  results.push({mode,requests:calls.length,localSignOut:s.signedOut,anonymousSignIn:s.signedIn,hostSavePreserved:true});await c.close();
 }
 {
  const {c,p,roles,held}=await open('role',{player:true});await p.locator('#onlineCard').click();await p.locator('.online-card-front strong').waitFor();await p.waitForTimeout(360);
  await p.locator('#onlineCard').click();await p.locator('#onlineCard').click();
  await p.waitForFunction(()=>window.authTest.signedIn===1);const deadline=Date.now()+5000;while(!held()&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(held(),'role retry request must arrive');
  assert.equal(await p.locator('.online-card-front').locator('*').count(),0,'401 must clear the private face before retry confirmation');
  await held().fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'FORBIDDEN',message:'測試：新身分未獲房間授權'})});
  await p.getByText('測試：新身分未獲房間授權',{exact:true}).waitFor();assert.equal(roles.length,3);assert.equal(await p.locator('.online-card-front').locator('*').count(),0);
  results.push({roleRetryRequiresFreshRoomAuthorization:true,privateCardCleared:true});await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,scope:'Synthetic API/Auth adapters, no cloud writes'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({completed:results.length,error:String(e),results,errors},null,2));throw e;}
finally{await browser.close();server?.kill();}
