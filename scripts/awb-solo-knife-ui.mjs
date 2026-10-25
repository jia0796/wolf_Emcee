import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5391/',out=new URL(process.env.UI_OUTPUT||'../../output/awb-knife-20261025/local/',import.meta.url);await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'5391'},stdio:'pipe'});if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];browser.on('context',c=>c.setDefaultNavigationTimeout(90000));
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));
const seat=(p,id)=>p.locator('.seat[aria-label^="'+id+'號 "]');
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
async function open(width=390,height=844,mode='ready',sw='block'){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:sw}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base,{waitUntil:'networkidle'});
 if(sw==='allow')await p.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await p.evaluate(async mode=>{const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js');const s=createGame('awakenedBeauty12',{sheriff:false});let i=0;for(const [r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.night=2;s.deathsCommitted=true;s.step='attack';if(mode!=='team')for(const p of s.players)if(p.role==='wolf')p.alive=false;if(mode==='cooldown')s.awb.lastUsedNight=1;if(mode==='spent')s.awb.used=true;if(mode==='dead')s.players[0].alive=false;localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');},mode);await p.reload();await p.locator('#host').waitFor();return {c,p};
}
function pass(name){results.push({name});console.log(name);}
try{
 for(const [width,height,mode]of [[320,568,'ready'],[390,844,'cooldown'],[844,390,'spent']]){
  const {c,p}=await open(width,height,mode);assert.match(await p.locator('#hint').textContent(),/點選狼刀目標/);assert.equal(await seat(p,1).isDisabled(),true);assert.equal(await seat(p,9).isEnabled(),true);assert.equal(await p.locator('#next').isDisabled(),true);
  await seat(p,9).click();assert.equal((await saved(p)).nightAction.attack,9);await p.reload();await p.locator('#host').waitFor();assert.equal((await saved(p)).nightAction.attack,9);await seat(p,9).click();assert.equal(await p.locator('#next').isDisabled(),true);
  await p.getByRole('button',{name:'空刀',exact:true}).click();assert.equal(await p.locator('#next').isEnabled(),true);await p.getByRole('button',{name:'空刀',exact:true}).click();assert.equal(await p.locator('#next').isDisabled(),true);await seat(p,9).click();await shot(p,'solo-'+mode);
  const before=await saved(p);await p.locator('#next').click();let s=await saved(p);assert.equal(s.step,'wolvesClose');assert.deepEqual(s.nightRecords.find(r=>r.night===2).events.find(e=>e.key==='basic').actors,[1]);await p.locator('#back').click();assert.deepEqual(await saved(p),before);await p.locator('#next').click();
  for(let i=0;i<10&&(await saved(p)).step!=='antidote';i++){if((await saved(p)).step==='awakenedCharm'&&mode==='ready')await p.getByRole('button',{name:'空魅惑',exact:true}).click();assert.equal(await p.locator('#next').isEnabled(),true);await p.locator('#next').click();}
  s=await saved(p);assert.equal(s.step,'antidote');assert.equal(s.nightAction.attack,9);assert.equal(s.nightRecords.find(r=>r.night===2).events.filter(e=>e.key==='basic').length,1);assert.equal(await p.evaluate(async()=>{const {potionBlocked}=await import('./engine.js');return potionBlocked(JSON.parse(localStorage.getItem('eclipse-host-v1')),'antidote');}),'');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(mode==='cooldown')await shot(p,'witch-target');pass('solo '+mode+' knife, cancel, empty toggle, refresh, undo and witch target '+width+'x'+height);await c.close();
 }
 {
  const {c,p}=await open(390,844,'team');await seat(p,9).click();await p.locator('#next').click();assert.deepEqual((await saved(p)).nightRecords.find(r=>r.night===2).events.find(e=>e.key==='basic').actors,[1,2,3,4]);pass('joint wolf attack includes awakened beauty among four recorded participants');await c.close();
 }
 {
  const {c,p}=await open();await p.getByRole('button',{name:'空刀',exact:true}).click();await p.locator('#next').click();const s=await saved(p);assert.equal(s.nightAction.attack,null);assert.equal(s.nightRecords.find(r=>r.night===2)?.events.some(e=>e.key==='basic')??false,false);pass('solo empty knife creates no fake attack event');await c.close();
 }
 {
  const {c,p}=await open(390,844,'dead');assert.equal(await seat(p,9).isDisabled(),true);assert.equal(await p.getByRole('button',{name:'空刀',exact:true}).count(),0);pass('dead beauty has no knife controls');await c.close();
 }
 {
  const {c,p}=await open(390,844,'spent','allow');await c.setOffline(true);await p.reload();await p.locator('#host').waitFor();await seat(p,9).click();await p.locator('#next').click();assert.deepEqual((await saved(p)).nightRecords.find(r=>r.night===2).events.find(e=>e.key==='basic').actors,[1]);pass('service worker offline restart uses corrected wolf eligibility');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,errors,results,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),errors},null,2));throw e;}finally{await browser.close();server?.kill();}
