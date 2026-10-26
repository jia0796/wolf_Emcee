import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5397/',out=new URL(process.env.UI_OUTPUT||'../../output/wolf-gun-chain-20261026/local/',import.meta.url);await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'5397'},stdio:'pipe'});if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const b=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));
async function reload(p){await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.dataset.screen===sessionStorage.getItem('eclipse-host-v1-screen'));}
async function open(mode='screenshot',width=390,height=844,board='awakenedKingWitch12'){
 const c=await b.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),p=await c.newPage();p.setDefaultTimeout(25000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
 await p.evaluate(async({mode,board})=>{const {createGame,next,selectSeat,choose,canNext}=await import('./engine.js'),{BOARDS}=await import('./data.js');const s=createGame(board,{sheriff:false});let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.night=3;
 const go=()=>{if(!next(s))throw Error('fixture blocked '+s.step);};
 if(mode==='screenshot'){
  const roles=['awakenedKing','wolf','villager','wolf','villager','villager','seer','awakenedWitch','wolf','hunter','villager','guard'];s.players.forEach((p,i)=>p.role=roles[i]);for(const id of[2,6,7])s.players[id-1].alive=false;s.akw.gifts=[{night:1,actor:1,target:9}];s.akw.attempts=[{night:1,actor:8,target:6,helpers:[6],verdict:false,ballots:null}];s.step='attack';selectSeat(s,10);go();for(let n=0;n<50&&s.step!=='announcement'&&s.step!=='finished';n++){if(!canNext(s)){if(s.step==='antidote')choose(s,'skip');else if(s.step==='poison'){choose(s,'use');selectSeat(s,9);}else if(s.step==='akwGift')choose(s,'skip');else if(s.step==='akwHelpers'){selectSeat(s,3);selectSeat(s,12);}else if(s.step==='akwDecision')choose(s,'akw:yes');else if(s.step==='inspect')selectSeat(s,3);}go();}if(s.step==='announcement')go();selectSeat(s,1);go();s.operation=null; // Saved state from the former rejected shot page.
 }else{
  if(s.akw)s.akw.gifts=[{actor:1,target:2,night:1}];if(mode==='empty')s.akw.gifts.push({actor:1,target:3,night:2});
  const hunter=s.players.find(p=>p.role==='hunter').id;s.players[hunter-1].alive=false;s.step='eliminated';s.queue=[{id:hunter,cause:'attack',source:'basic',context:'night',day:3,noticeDone:true}];s.operation='native';s.continuation='nextNight';
  if(mode==='terminal')for(const p of s.players.filter(p=>p.role==='wolf'))p.alive=false;
  selectSeat(s,1);go();
  if(['poison','selfDestruct'].includes(mode)){s.queue[0].cause=mode;s.operation=null;}
 }
 localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen',s.step==='finished'?'finished':'host');},{mode,board});await reload(p);return {c,p};
}
const seat=(p,id)=>p.locator('.seat[aria-label^="'+id+'號 "]');
async function shot(p,name){await p.evaluate(async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));await p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});}
const pass=name=>{results.push({name,passed:true});console.log(name);};
try{
 for(const[w,h]of[[320,568],[375,667],[390,844],[430,932],[844,390],[1024,768]]){
  const{c,p}=await open('screenshot',w,h);assert.match(await p.locator('#subtitle').textContent(),/1號玩家淘汰/);assert.match(await p.locator('#hint').textContent(),/剩餘 1/);assert.match(await p.locator('#operationCard img').getAttribute('src'),/wolf-gun/);assert.equal(await p.getByRole('button',{name:'開槍',exact:true}).count(),1);assert.equal(await p.locator('#next').isDisabled(),true);assert.equal(await seat(p,9).isDisabled(),true);await seat(p,5).click();await shot(p,'retained-shot-'+w+'x'+h);await p.locator('#next').click();let s=await saved(p);assert.equal(s.players[4].alive,false);assert.equal(s.akw.clawUses.length,1);assert.deepEqual(s.dayEvents.filter(e=>e.type==='shot').map(e=>e.actors[0]),[10,1]);await p.locator('#back').click();assert.equal((await saved(p)).players[4].alive,true);await reload(p);assert.match(await p.locator('#hint').textContent(),/剩餘 1/);await p.getByRole('button',{name:'不開槍',exact:true}).click();await p.locator('#next').click();s=await saved(p);assert.equal(s.akw.clawUses[0].used,false);assert.equal(s.players[4].alive,true);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));pass('screenshot old-save recovery, retained shot, refresh, undo and explicit skip '+w+'x'+h);await c.close();
 }
 {
  const{c,p}=await open('chain');await seat(p,2).click();await p.locator('#next').click();assert.match(await p.locator('#subtitle').textContent(),/2號玩家/);await reload(p);assert.match(await p.locator('#hint').textContent(),/剩餘 1/);await shot(p,'inherited-chain');await seat(p,9).click();await p.locator('#next').click();const s=await saved(p);assert.deepEqual(s.dayEvents.filter(e=>e.type==='shot').map(e=>e.actors[0]),[8,1,2]);assert.equal(s.akw.clawUses.length,2);assert.equal(s.players[8].alive,false);pass('hunter -> awakened king -> inherited wolf -> target chain, exactly one charge each');await c.close();
 }
 for(const board of['12','kingGuard12','kingDream12']){
  const{c,p}=await open('ordinary',390,844,board);assert.equal(await p.getByRole('button',{name:'開槍',exact:true}).count(),1);assert.equal(await p.locator('#next').isDisabled(),true);await reload(p);await seat(p,9).click();await shot(p,'ordinary-'+board);await p.locator('#next').click();let s=await saved(p);assert.equal(s.players[8].alive,false);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,2);await p.locator('#back').click();assert.equal((await saved(p)).players[8].alive,true);pass(board+' ordinary black king chains, refreshes and rolls back using original native gun');await c.close();
 }
 for(const mode of['empty','poison','selfDestruct']){
  const{c,p}=await open(mode);assert.equal(await p.getByRole('button',{name:'開槍',exact:true}).count(),0);assert.equal(await p.locator('#next').isEnabled(),true);pass(mode+' still disallows awakened gun');await c.close();
 }
 {
  const{c,p}=await open('terminal');assert.equal(await p.locator('#finished').isVisible(),true);assert.match(await p.locator('#winnerTitle').textContent(),/好人陣營/);const s=await saved(p);assert.equal(s.akw.clawUses.length,0);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,1);pass('formal terminal victory stops the chain without spending or inventing a shot');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),results,errors},null,2));throw e;}finally{await b.close();server?.kill();}
