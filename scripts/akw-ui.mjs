import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.UI_OUTPUT||'../../output/akw-release-20261026/local/',import.meta.url);await mkdir(out,{recursive:true});
const base=process.env.UI_BASE||'http://127.0.0.1:5395/';
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'5395'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const save=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));
async function reload(p){await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.dataset.screen===sessionStorage.getItem('eclipse-host-v1-screen'));}

async function open(mode='gift',width=390,height=844,sw='block'){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:sw}),p=await c.newPage();p.setDefaultTimeout(20000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
 await p.evaluate(async mode=>{
  const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),{akwNight}=await import('./akw.js');const s=createGame('awakenedKingWitch12',{sheriff:false});let i=0;for(const [r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step='akwGift';
  if(mode==='helpers'){s.night=2;s.step='akwHelpers';s.akw.attempts=[{night:1,actor:5,target:10,helpers:[2],verdict:false,ballots:null}];s.nightAction.poison=true;s.nightAction.poisonTarget=9;}
  if(mode==='claw'){s.night=2;s.step='eliminated';s.players[0].alive=false;s.queue=[{id:1,cause:'attack',context:'night',source:'basic',day:2}];s.operation='claw';s.continuation='nextNight';}
  if(mode==='recap'){s.step='finished';s.night=2;s.winner='好人陣營';s.winnerReason='測試結果';s.nightRecords=[{night:2,settled:true,deaths:[],events:[{key:'akwPoison',night:2,order:1,executed:true,actorRole:'awakenedWitch',displayRole:'awakenedWitch',skill:'poison',actors:[5],rawTargets:[9],effectiveTargets:[9],actorSnapshots:[{id:5,role:'awakenedWitch',name:'覺醒女巫',kind:'god',camp:'god',tone:'god',image:BOARDS.none}],targetSnapshots:[{id:9,role:'villager',name:'平民',kind:'villager',tone:'villager'}],proposal:{helpers:[3,5],verdict:false,ballots:{voters:[3,5],ballots:{3:1,5:2}}}}]}];const {ROLE_DATA}=await import('./data.js');for(const e of s.nightRecords[0].events){for(const key of ['actorSnapshots','targetSnapshots'])for(const p of e[key])p.image=ROLE_DATA[p.role].image;}}
  akwNight(s);localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen',mode==='recap'?'finished':'host');
 },mode);await reload(p);return {c,p};
}
const shot=async(p,name)=>{await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('img')].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));});return p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});};
const pass=name=>{results.push({name,passed:true});console.log(name);};
try{
 for(const [width,height]of [[320,568],[375,667],[390,844],[430,932],[844,390],[1024,768]]){
  const {c,p}=await open('gift',width,height);assert.equal(await p.locator('#next').isDisabled(),true);await p.locator('.seat[aria-label^="2號 "]').click();assert.match(await p.locator('#operationCard img').getAttribute('src'),/v2\/icon-wolf-king-bestow/);await p.locator('#next').click();assert.equal((await save(p)).akw.gifts[0].target,2);await reload(p);assert.ok((await p.locator('.role-name').allTextContents()).includes('狼人（繼承）'));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(p,'gift-'+width+'x'+height);pass('gift, inherited name, refresh and layout '+width+'x'+height);await c.close();
 }
 {
  const {c,p}=await open('helpers');assert.equal(await p.locator('#selection').textContent(),'');await p.locator('.seat[aria-label^="5號 "]').click();assert.equal(await p.locator('#next').isDisabled(),true);await p.locator('.seat[aria-label^="9號 "]').click();assert.equal(await p.locator('#next').isEnabled(),true);await p.locator('#next').click();assert.equal((await save(p)).akw.attempts.length,2);assert.ok((await p.locator('.role-name').allTextContents()).includes('覺醒女巫（協）'));await shot(p,'helpers-self-and-target');
  await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eclipse-host-v1'));s.step='akwDecision';localStorage.setItem('eclipse-host-v1',JSON.stringify(s));});await reload(p);await p.locator('#akwBallotOpen').click();assert.equal(await p.locator('#akwBallotDialog [data-done]').isDisabled(),true);
  await p.locator('[data-opinion="1"]').click();assert.match(await p.locator('[data-progress]').textContent(),/9號/);await p.locator('[data-opinion="2"]').click();assert.equal(await p.locator('[data-done]').isEnabled(),true);await p.locator('[data-opinion="2"]').click();assert.equal(await p.locator('[data-done]').isDisabled(),true);await p.locator('[data-opinion="1"]').click();await shot(p,'ballot-complete');await p.locator('[data-done]').click();assert.equal((await save(p)).nightAction.akw.verdict,true);
  await p.getByRole('button',{name:'未全票同意',exact:true}).click();assert.equal(await p.locator('#voteMismatch').isVisible(),true);await shot(p,'ballot-mismatch');await p.locator('#next').click();assert.equal((await save(p)).akw.attempts[1].ballots,null);assert.equal((await save(p)).akw.attempts[1].verdict,false);pass('self/target helpers, strict complete ballots, forward missing navigation, cancellation, manual mismatch');await c.close();
 }
 {
  const {c,p}=await open('claw');assert.match(await p.locator('#operationCard img').getAttribute('src'),/icon-wolf-gun/);assert.equal(await p.locator('#next').isDisabled(),true);await p.getByRole('button',{name:'不開槍',exact:true}).click();await p.locator('#next').click();assert.match(await p.locator('#hint').textContent(),/剩餘 1/);assert.equal(await p.locator('#next').isDisabled(),true);await p.locator('.seat[aria-label^="9號 "]').click();await shot(p,'second-claw-after-skip');await p.locator('#next').click();assert.equal((await save(p)).dayEvents.filter(e=>e.skillSource==='claw').length,1);pass('red wolf gun, explicit first skip, second claw still allowed and no fake skipped event');await c.close();
 }
 for(const [width,height]of [[320,568],[390,844],[844,390]]){
  const {c,p}=await open('recap',width,height);assert.equal(await p.locator('.final-identities').evaluate(e=>e.tagName),'SECTION');assert.equal(await p.locator('.final-identity-card').count(),12);assert.equal(await p.locator('.recap-dialog').isVisible(),false);await p.locator('.recap-open').click();assert.equal(await p.locator('.recap-dialog').isVisible(),true);assert.equal(await p.locator('[data-event=akwPoison]').count(),1);assert.equal(await p.locator('[data-event=akwPoison] .recap-outcome').textContent(),'失敗');assert.match(await p.locator('[data-event=akwPoison] .recap-effect img').getAttribute('src'),/poison/);assert.deepEqual(await p.locator('.akw-recap-ballots span').evaluateAll(es=>es.map(e=>getComputedStyle(e).color)),['rgb(178, 219, 229)','rgb(178, 219, 229)']);assert.deepEqual(await p.locator('.akw-recap-ballots span').allTextContents(),['3號 → O','5號 → X']);const b=await p.locator('.recap-dialog').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1);await shot(p,'recap-dialog-'+width);await p.keyboard.press('Escape');assert.equal(await p.locator('.recap-dialog').isVisible(),false);assert.equal(await p.locator('.recap-open').evaluate(e=>e===document.activeElement),true);pass('single poison recap, O/X, modal bounds, Escape and focus '+width+'x'+height);await c.close();
 }
 {
  const {c,p}=await open('recap');await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eclipse-host-v1'));const e=s.nightRecords[0].events[0];e.proposal.verdict=true;e.proposal.ballots.ballots={3:1,5:1};localStorage.setItem('eclipse-host-v1',JSON.stringify(s));});await reload(p);await p.locator('.recap-open').click();assert.equal(await p.locator('[data-event=akwPoison] .recap-outcome').textContent(),'成功');assert.match(await p.locator('[data-event=akwPoison] .recap-effect img').getAttribute('src'),/poison/);assert.deepEqual(await p.locator('.akw-recap-ballots span').allTextContents(),['3號 → O','5號 → O']);await shot(p,'recap-success-390');pass('successful poison keeps same icon and saved unanimous blue ballots');await c.close();
 }
 {
  const {c,p}=await open();await p.locator('.seat[aria-label^="2號 "]').click();await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('test quota','QuotaExceededError');};});await p.locator('#next').click();assert.match(await p.locator('#subtitle').textContent(),/繼承狼王爪/);assert.match(await p.locator('#hint').textContent(),/剩餘 2/);pass('failed storage rolls back gift commit and history');await c.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(new URL('results.json',out),JSON.stringify({passed:results.length,failed:0,errors,results,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({error:String(e),stack:e.stack,results,errors},null,2));throw e;}finally{await browser.close();server?.kill();}
