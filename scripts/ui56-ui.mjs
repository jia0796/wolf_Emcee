import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.UI56_OUTPUT||'../../qa-ui56-implementation/targeted/',import.meta.url);await mkdir(out,{recursive:true});
const base=process.env.UI_BASE||'http://127.0.0.1:5366/',server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'5366'},stdio:['ignore','pipe','pipe']});if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const seat=(p,id)=>p.locator('.seat[aria-label^="'+id+'號 "]'),voter=(p,id)=>p.locator('#voteVoters button[data-voter="'+id+'"]');
async function fixture(p,step='exileVote',sheriff=null){await p.evaluate(async({step,sheriff})=>{const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),s=createGame('12');let i=0;for(const [r,n]of Object.entries(BOARDS['12'].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step=step;s.candidates=[7,8];s.nominees=[4,5,7,8,9,10,11,12];s.votePool=step.startsWith('sheriff')?[7,8]:step.endsWith('Revote')?[5,6]:s.players.map(p=>p.id);s.sheriff=step.startsWith('sheriff')?null:sheriff;localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');},{step,sheriff});await p.reload();await p.locator('#host').waitFor({state:'visible'});}
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));
async function ballot(p,target,ids){
 await p.locator('#voteBatch').click();
 const desired=target==='abstain'?'棄票':target+'號';
 while(await p.locator('#votePrevious').isEnabled())await p.locator('#votePrevious').click();
 for(let n=0;n<20&&await p.locator('#voteStepName').textContent()!==desired;n++){
  assert.equal(await p.locator('#voteNext').isEnabled(),true);
  await p.locator('#voteNext').click();
 }
 assert.equal(await p.locator('#voteStepName').textContent(),desired);
 for(const id of ids)await voter(p,id).click();
}
try{
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
 for(const [step,expected,hint]of [['sheriffVote',[1,2,3,6],'上警與退水玩家不參與本輪投票'],['sheriffRevote',[1,2,3,4,5,6,9,10,11,12],'PK玩家不參與本輪投票'],['exileRevote',[1,2,3,4,7,8,9,10,11,12],'PK玩家不參與本輪投票']]){await fixture(p,step);if(step.startsWith('sheriff')){assert.equal(await seat(p,7).locator('.seat-tags').textContent(),'警上');assert.equal(await seat(p,4).locator('.seat-tags').textContent(),'退水');}await p.locator('#voteNotesOpen').click();assert.deepEqual(await p.locator('#voteVoters button').evaluateAll(es=>es.map(e=>Number(e.dataset.voter))),expected);assert.equal(await p.locator('#voteEligibilityHint').textContent(),hint);await p.locator('#voteClose').click();}results.push({case:'UI56-01/02/03',pass:true});
 // Ordinary exile coverage moved to vote62-ui.mjs; these three editors retain UI56 behavior.
 for(const step of ['sheriffVote','sheriffRevote','exileRevote']){
  await fixture(p,step,2);await p.locator('#voteNotesOpen').click();const target=step.startsWith('sheriff')?7:5;
  await ballot(p,target,[1]);assert.deepEqual((await saved(p)).votePatterns,[]);
  await p.locator('#voteIndividual').click();assert.equal(await p.locator('#voteStepName').textContent(),'1號');await p.locator('#voteVoters [data-choice="'+target+'"]').click();assert.equal(await p.locator('#voteVoters [data-choice="'+target+'"]').getAttribute('aria-pressed'),'false');
  await p.locator('#voteClose').click();await p.locator('#voteNotesOpen').click();assert.equal(await p.locator('#voteProgress').textContent(),step==='sheriffVote'?'已紀錄 0／4 人':'已紀錄 0／10 人');
  await p.locator('#voteDone').click();assert.equal(await p.locator('#voteDialog').evaluate(e=>e.open),true);assert.deepEqual((await saved(p)).votePatterns,[]);
  await ballot(p,target,[1]);await p.locator('#voteDone').click();assert.deepEqual((await saved(p)).action,[target]);assert.equal((await saved(p)).votePatterns[0].locked,true);
  await seat(p,step.startsWith('sheriff')?8:6).click();assert.deepEqual((await saved(p)).action,[target]);assert.equal(await p.getByRole('button',{name:'平票',exact:true}).isDisabled(),true);
  await p.locator('#voteNotesOpen').click();await ballot(p,step.startsWith('sheriff')?8:6,[1]);await p.locator('#voteClose').click();assert.deepEqual((await saved(p)).action,[target]);
  await p.reload();assert.deepEqual((await saved(p)).action,[target]);await p.locator('#voteNotesOpen').click();await p.locator('#voteOptions summary').click();await p.locator('#voteClear').click();await p.locator('#voteClearConfirm').click();assert.equal(await p.locator('#voteProgress').textContent(),step==='sheriffVote'?'已紀錄 0／4 人':'已紀錄 0／10 人');await p.locator('#voteClose').click();assert.deepEqual((await saved(p)).action,[target]);
  await p.locator('#voteNotesOpen').click();await p.locator('#voteOptions summary').click();await p.locator('#voteAbandon').click();await p.locator('#voteAbandonConfirm').click();assert.deepEqual((await saved(p)).votePatterns,[]);await seat(p,step.startsWith('sheriff')?8:6).click();assert.deepEqual((await saved(p)).action,[step.startsWith('sheriff')?8:6]);
  results.push({case:step+' unchanged editor, mode switch, cancel, lock, empty reject, clear, abandon and reload',pass:true});
 }
 for(const [width,height,font,safe]of [[320,568,100,34],[375,667,100,0],[390,844,100,34],[430,932,100,34],[568,320,100,0],[568,320,200,0],[390,844,200,34],[768,1024,200,34],[390,844,100,150]]){
  await p.setViewportSize({width,height});await fixture(p,'sheriffVote');await p.locator('#voteNotesOpen').click();await p.evaluate(({font,safe})=>{document.documentElement.style.fontSize=font+'%';document.documentElement.style.setProperty('--safe-bottom',safe+'px');},{font,safe});
  assert.equal(await p.locator('.vote-footer .vote-navigation #voteNext').count(),1);assert.equal(await p.locator('#voteScroll .vote-navigation').count(),0);
  await p.locator('#voteOptions summary').click();await p.locator('#voteNext').scrollIntoViewIfNeeded();const before=await p.locator('#voteNext').boundingBox();await p.locator('#voteScroll').evaluate(e=>e.scrollTop=e.scrollHeight);assert.equal((await p.locator('#voteNext').boundingBox()).y,before.y);
  await p.locator('#voteDone').scrollIntoViewIfNeeded();const geom=await p.evaluate(()=>{const d=document.getElementById('voteDialog'),done=document.getElementById('voteDone').getBoundingClientRect(),nav=document.querySelector('.vote-navigation'),info=document.getElementById('voteStepName');return {bottom:done.bottom,dialogBottom:d.getBoundingClientRect().bottom,horizontal:d.scrollWidth>d.clientWidth+1,numberPx:parseFloat(getComputedStyle(info).fontSize),numberSpanPx:parseFloat(getComputedStyle(info.closest('.vote-step-info').querySelector('strong')).fontSize),footerOrder:!!(nav.compareDocumentPosition(document.getElementById('voteDone'))&Node.DOCUMENT_POSITION_FOLLOWING)};});assert.ok(geom.bottom<=height+1,JSON.stringify(geom));assert.ok(geom.bottom<=geom.dialogBottom,JSON.stringify(geom));assert.equal(geom.horizontal,false);assert.ok(geom.numberSpanPx>=18&&geom.numberSpanPx<=23);assert.equal(geom.footerOrder,true);
  await p.screenshot({path:new URL('legacy-'+width+'x'+height+'-'+font+'-'+safe+'.png',out).pathname.slice(1)});await p.locator('#voteIndividual').click();assert.equal(await p.locator('.vote-footer #voteNext').count(),1);await p.locator('#voteClose').click();await p.evaluate(()=>{document.documentElement.style.fontSize='';document.documentElement.style.removeProperty('--safe-bottom');});results.push({case:'bottom navigation and reduced number',width,height,font,safe,...geom,pass:true});
 }
 await c.close();assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors}));
}finally{await browser.close();server?.kill();}
