import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const mode=process.argv[2]||'after',base=process.env.UI_BASE||'http://127.0.0.1:5381/';
const root=new URL(process.env.GLASS_OUTPUT||'../../qa-glass-vote-online/',import.meta.url),out=new URL(mode+'/',root);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[],additional=[];
const shot=(p,name)=>p.screenshot({path:new URL(name+'.png',out).pathname.slice(1),animations:'disabled'});
const geometry=p=>p.evaluate(()=>[...document.querySelectorAll('dialog[open] button,dialog[open] summary,#online:not([hidden]) button:not([hidden]),#online:not([hidden]) canvas')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.dataset.seat||e.dataset.voter||e.textContent,x:r.x,y:r.y,w:r.width,h:r.height};}));
async function fixture(p,step){
 await p.evaluate(async step=>{const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),s=createGame('kingGuard12');let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step=step;s.candidates=[7,8];s.nominees=[7,8,9];s.votePool=step==='exileVote'?s.players.map(p=>p.id):[7,8];s.sheriff=step.startsWith('sheriff')?null:1;localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');},step);
 await p.reload({waitUntil:'networkidle'});await p.locator('#host').waitFor({state:'visible'});
}
async function mockedRoom(context,isHost){
 // Exercise the real UI against synthetic, in-memory responses. No cloud credentials or writes.
 const state={roomId:'11111111-1111-4111-8111-111111111111',roomCode:'123456',inviteToken:'test-only-invitation',boardId:'12',capacity:12,status:'waiting',version:1,seats:Array.from({length:12},(_,i)=>({seat:i+1,occupied:[2,5].includes(i+1),mine:false,lease:'test-lease-'+i}))};
 await context.route('**/*.supabase.co/**',r=>r.abort());
 await context.route('**/online-vendor.js',r=>r.fulfill({contentType:'text/javascript',body:`export {toCanvas} from './online-vendor.js?original';export function createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:'synthetic-test-only'}}})},realtime:{setAuth:async()=>{}},channel:()=>{const c={on:()=>c,subscribe:fn=>{queueMicrotask(()=>fn('SUBSCRIBED'));return c}};return c},removeChannel:async()=>{}}}` }));
 await context.route('**/functions/v1/room',async r=>{const req=r.request().postDataJSON();let data=state;
  if(req.action==='seat'){await new Promise(resolve=>setTimeout(resolve,180));state.seats.forEach(s=>{if(s.mine){s.mine=false;s.occupied=false;}if(s.seat===req.body.seat){s.mine=true;s.occupied=true;}});state.version++;}
  if(req.action==='my_role')data={roomId:state.roomId,status:'dealt',role:'seer'};
  await r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
 });
 return state;
}
try{
 for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('**/*.supabase.co/**',r=>r.abort());const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
  for(const step of ['exileVote','sheriffVote','sheriffRevote','exileRevote']){
   await fixture(p,step);await p.locator('#voteNotesOpen').click();
   const ordinary=step==='exileVote',dlg=p.locator(ordinary?'#exileVoteDialog':'#voteDialog'),prefix=ordinary?'exile':'vote';
   const before=await geometry(p);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const last=dlg.locator('[data-voter]').last();await last.scrollIntoViewIfNeeded();await last.click();assert.equal(await last.getAttribute('aria-pressed'),'true');await last.click();assert.equal(await last.getAttribute('aria-pressed'),'false');
   if(width===390){await dlg.locator('[data-voter]').first().click();await shot(p,step+'-batch');}
   await p.locator('#'+prefix+'Individual').click();
   const choice=dlg.locator('[data-choice]').first();await choice.scrollIntoViewIfNeeded();await choice.click();
   await p.locator('#'+prefix+'Next').click();await p.locator('#'+prefix+'Previous').click();await p.keyboard.press('Tab');
   assert.equal(await p.evaluate(()=>document.activeElement.closest('dialog')?.open),true);
   if(width===390)await shot(p,step+'-individual');
   await p.locator(ordinary?'#exileVoteClose':'#voteClose').click();assert.equal(await dlg.isVisible(),false);
   results.push({name:step,width,height,geometry:before,passed:true});console.log(width+' '+step);
  }
  await context.close();
  for(const isHost of [true,false]){
   const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),state=await mockedRoom(c,isHost),q=await c.newPage();q.on('pageerror',e=>errors.push(String(e)));
   if(isHost){await q.addInitScript(state=>localStorage.setItem('wolfcue-online-host-v1',JSON.stringify({boardId:'12',roomId:state.roomId,inviteToken:state.inviteToken,requestId:'test-create',dealRequest:'test-deal'})),state);await q.goto(base);}
   else await q.goto(base+'#room='+state.roomId+'&invite=test-only-invitation');
   await q.locator('#onlineRing button').nth(11).waitFor({state:'visible'});if(isHost)await q.waitForFunction(()=>document.querySelector('#onlineQR canvas').style.getPropertyValue('--online-qr-size'));
   assert.equal(await q.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const before=await geometry(q);
   if(!isHost){const seat=q.locator('#onlineRing button').nth(7);await seat.scrollIntoViewIfNeeded();const a=await seat.boundingBox();await q.mouse.move(a.x+a.width/2,a.y+a.height/2);await q.mouse.down();const held=await seat.boundingBox();assert.deepEqual(held,a);await q.mouse.up();await q.waitForFunction(()=>document.querySelector('#onlineRing .mine')?.dataset.seat==='8');assert.equal(await seat.locator('small').textContent(),'自己 ✓');}
   if(width===390){await q.locator('#onlineScroll').evaluate(e=>e.scrollTop=0);await shot(q,isHost?'online-host':'online-player');}
   await q.locator('#onlineLibrary').click();await q.locator('#encyclopedia').waitFor({state:'visible'});await q.locator('#libraryReturn').click();await q.locator('#online').waitFor({state:'visible'});
   results.push({name:isHost?'online-host':'online-player',width,height,geometry:before,passed:true});console.log(width+' online '+(isHost?'host':'player'));await c.close();
  }
 }
 assert.deepEqual(errors,[]);
 if(mode==='after'){
  const before=JSON.parse(await readFile(new URL('before/results.json',root),'utf8'));for(let i=0;i<results.length;i++)assert.deepEqual(results[i].geometry,before.results[i].geometry,`${results[i].name} ${results[i].width} geometry changed`);
  const c=await browser.newContext({viewport:{width:320,height:568},serviceWorkers:'block',reducedMotion:'reduce'});await c.route('**/*.supabase.co/**',r=>r.abort());const p=await c.newPage();await p.goto(base);await fixture(p,'exileVote');await p.evaluate(()=>document.documentElement.style.fontSize='200%');await p.locator('#voteNotesOpen').click();
  const last=p.locator('#exileVoters [data-voter]').last();await last.scrollIntoViewIfNeeded();await last.click();assert.equal(await last.getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.locator('#exileVoteDone').scrollIntoViewIfNeeded();await p.locator('#exileVoteDone').click();await p.locator('#exileVoteDialog').waitFor({state:'hidden'});additional.push('320px / 200% font: last voter and completion clickable');await c.close();
  for(const failure of [false,true]){
   const cx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),state=await mockedRoom(cx,false);let release;const gate=new Promise(r=>release=r);
   await cx.route('**/online-plaza-v4.png',async r=>{await gate;await (failure?r.abort():r.continue()).catch(()=>{});});const q=await cx.newPage();q.on('pageerror',e=>errors.push(String(e)));await q.goto(base+'#room='+state.roomId+'&invite=test-only-invitation',{waitUntil:'domcontentloaded'});await q.locator('#onlineRing button').nth(11).waitFor();
   assert.equal(await q.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage),'none');assert.equal(await q.locator('.b3-backdrop').getAttribute('data-source'),null);await q.locator('#onlineRing button').nth(0).click();await q.waitForFunction(()=>!!document.querySelector('#onlineRing .mine'));release();
   if(!failure)await q.waitForFunction(()=>document.querySelector('.b3-backdrop')?.dataset.source==='art/backgrounds/online-plaza-v4.png');else{await q.locator('#onlineLibrary').click();await q.locator('#libraryReturn').click();assert.equal(await q.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage),'none');}
   assert.equal(await q.locator('#onlineRing button').first().evaluate(e=>getComputedStyle(e,'::after').transitionDuration),'0s');additional.push(failure?'Failed background retains neutral fallback and usable controls':'Delayed background never flashes old scene; reduced motion');await cx.close();
  }
  const offline=await browser.newContext(),pwa=await offline.newPage();await offline.route('**/*.supabase.co/**',r=>r.abort());await pwa.goto(base);await pwa.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await pwa.evaluate(async()=>{await navigator.serviceWorker.ready;await fetch('art/backgrounds/online-plaza-v4.png');});await offline.setOffline(true);await pwa.reload();assert.equal(await pwa.title(),'狼序 WolfCue｜狼人殺主持工具');assert.equal(await pwa.evaluate(async()=>(await fetch('art/backgrounds/online-plaza-v4.png')).status),200);additional.push('Updated background and app shell available offline');await offline.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(new URL('results.json',out),JSON.stringify({passed:results.length+additional.length,failed:0,onlineEnvironment:'Synthetic API and Realtime adapter; no backend security or real multiplayer claim',errors,results,additional},null,2));console.log(JSON.stringify({passed:results.length+additional.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({completed:results.length,error:String(e),errors},null,2));throw e;}finally{await browser.close();}
