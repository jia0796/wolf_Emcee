import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ROLE_DATA} from '../public/data.js';
import {CATALOG_ART_V2} from '../public/catalog-v2.js';
import {tallyVotes} from '../public/votes.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5397/';
const out=new URL(process.env.UI_OUTPUT||'../../output/catalog-release-20261025/recap-vote-local/',import.meta.url);await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5397'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const pass=(name,data={})=>{results.push({name,...data});console.log(name);};
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));
async function fixture(p,step='finished'){
 await p.evaluate(async step=>{
  const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),{recordDay}=await import('./records.js');
  const board=step==='finished'?'awakenedBeauty12':'12',s=createGame(board);let i=0;
  for(const [role,n] of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;
  s.rolesConfirmed=true;s.step=step;
  if(step==='finished'){
   s.winner='好人陣營';s.winnerReason='測試用復盤樣本';
   recordDay(s,'exile',{targets:[8],skill:'vote'});
   recordDay(s,'shot',{actors:[8],targets:[2],skill:'gun'});
   recordDay(s,'awakenedSubstitute',{actors:[1],targets:[6],skill:'heartbreak'});
   s.players[1].alive=false;s.players[5].alive=false;s.players[7].alive=false;
  }else{s.sheriff=2;s.candidates=[7,8];s.nominees=[7,8];s.votePool=step.startsWith('sheriff')?[7,8]:step.endsWith('Revote')?[5,6]:s.players.map(p=>p.id);}
  localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen',step==='finished'?'finished':'host');
 },step);await p.reload();await p.locator(step==='finished'?'#finished':'#host').waitFor();
}
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
async function waitArt(p){await p.evaluate(async()=>{const paths=[...new Set([...document.querySelectorAll('#nightRecap image')].map(e=>e.getAttribute('href')))];await Promise.all(paths.map(async src=>{const i=new Image();i.src=src;await i.decode();}));});}
try{
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
 // Isolated rendering probes use recorded original images; never change roles in a real game.
 for(const role of Object.keys(ROLE_DATA)){
  const check=await p.evaluate(async role=>{
   const {eventCard,renderRecap}=await import('./recap.js'),{ROLE_DATA}=await import('./data.js'),{createGame}=await import('./engine.js');
   const person={id:1,role,name:ROLE_DATA[role].name,image:ROLE_DATA[role].image,tone:ROLE_DATA[role].kind};
   const e={key:'inspect',skill:'inspect',actors:[1],actorRole:role,rawTargets:[2],effectiveTargets:[2],actorSnapshots:[person],targetSnapshots:[{...person,id:2}]},before=JSON.stringify(e),card=eventCard(e);
   const state=createGame('12');state.players=state.players.map((p,i)=>({...p,role:i===0?role:'villager'}));state.step='finished';state.winner='好人陣營';
   const data=JSON.stringify(state),root=document.createElement('div');renderRecap(root,state);
   return {images:[...card.querySelectorAll('image')].map(e=>e.getAttribute('href')),final:[...root.querySelectorAll('.final-identity-card image')].map(e=>e.getAttribute('href')),eventIntact:before===JSON.stringify(e),stateIntact:data===JSON.stringify(state),icon:card.querySelector('.skill-icon').getAttribute('src')};
  },role);
  assert.deepEqual(check.images,[CATALOG_ART_V2[role].full,CATALOG_ART_V2[role].full]);assert.ok(check.final.includes(CATALOG_ART_V2[role].full));assert.ok(check.eventIntact&&check.stateIntact);assert.equal(check.icon,'skills/icon-inspect.svg');pass('new recap art: '+role);
 }
 {
  const check=await p.evaluate(async()=>{
   const {eventCard}=await import('./recap.js');const e={key:'inspect',skill:'inspect',actorRole:'seer',actors:[1],rawTargets:[2],effectiveTargets:[2]};const card=eventCard(e);
   const basic=eventCard({...e,key:'basic',skill:'wolf-attack',actorRole:'wolf',portraitRole:'mechanical'});
   const converted=eventCard({...e,actorSnapshots:[{id:1,role:'seer',name:'轉化者（預）',tone:'wolf',image:'art/catalog/seer.png'}]});
   return {unknown:card.lastElementChild.childElementCount,label:card.querySelector('.recap-person:last-of-type')?.textContent,actor:card.querySelector('image').getAttribute('href'),basic:basic.querySelector('image').getAttribute('href'),converted:converted.querySelector('image').getAttribute('href'),text:converted.textContent};
  });
  assert.equal(check.unknown,0);assert.equal(check.actor,CATALOG_ART_V2.seer.full);assert.equal(check.basic,CATALOG_ART_V2.mechanical.full);assert.equal(check.converted,CATALOG_ART_V2.seer.full);assert.match(check.text,/轉化者（預）/);pass('legacy missing identity stays unknown; takeover and conversion retain original role');
 }
 for(const width of [320,375,390,430]){
  await p.setViewportSize({width,height:844});await fixture(p);const before=await saved(p);await waitArt(p);
  assert.equal(await p.locator('.final-identity-card').count(),12);assert.equal(await p.locator('.recap-event').count(),3);
  assert.equal(await p.locator('#nightRecap image[href^="art/catalog-v2/"]').count(),17);
  assert.equal(await p.locator('#nightRecap img[src="art/recap-vote.png"]').count(),1);
  const fused=await p.locator('.final-identity-card').first().evaluate(e=>{const c=e.getBoundingClientRect(),p=e.querySelector('.recap-image'),r=p.getBoundingClientRect();return {left:Math.abs(r.left-c.left),top:Math.abs(r.top-c.top),bottom:Math.abs(r.bottom-c.bottom),mask:getComputedStyle(p).maskImage,overflow:getComputedStyle(e).overflow};});
  assert.ok(fused.left<=2&&fused.top<=2&&fused.bottom<=2,JSON.stringify(fused));assert.match(fused.mask,/linear-gradient/);assert.equal(fused.overflow,'hidden');
  assert.ok(await p.locator('#playAgain').isVisible());assert.ok(await p.locator('#finishHome').isVisible());
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===390){await shot(p,'recap-events');await p.locator('.final-identities').scrollIntoViewIfNeeded();await shot(p,'recap-identities');}
  assert.deepEqual(await saved(p),before);
  await p.reload();await p.locator('#finished').waitFor();assert.deepEqual(await saved(p),before);pass('recap current/old saved image refresh '+width);
 }
 {
  const check=await p.evaluate(async()=>{const {recapSnapshot}=await import('./online-state.js'),{renderRecap}=await import('./recap.js');const s=JSON.parse(localStorage.getItem('eclipse-host-v1')),snapshot=recapSnapshot(s),before=JSON.stringify(snapshot),root=document.createElement('div');renderRecap(root,snapshot);return {count:root.querySelectorAll('image[href^="art/catalog-v2/"]').length,intact:JSON.stringify(snapshot)===before};});
  assert.equal(check.count,17);assert.ok(check.intact);pass('player shared recap renderer accepts unchanged validated payload');
 }
 await c.route('**/art/catalog-v2/seer-v1.webp',r=>r.abort());await fixture(p);await p.waitForFunction(()=>document.querySelector('#nightRecap .final-identity-card image[href="art/catalog/seer.png"]'));
 await waitArt(p);await c.unroute('**/art/catalog-v2/seer-v1.webp');pass('new recap image failure falls back to original snapshot');
 for(const step of ['exileVote','sheriffVote','sheriffRevote','exileRevote']){
  await fixture(p,step);await p.locator('#voteNotesOpen').click();const normal=step==='exileVote',a=step.startsWith('sheriff')?7:5,b=a+1;
  await p.locator(normal?'#exileIndividual':'#voteIndividual').click();
  const choices=normal?'#exileVoters':'#voteVoters';await p.locator(choices+' [data-choice="'+a+'"]').click();await p.locator(choices+' [data-choice="'+b+'"]').click();
  await p.locator(normal?'#exileVoteDone':'#voteDone').click();
  let state=await saved(p),round=state.votePatterns[0];assert.equal(round.submitted,true);assert.equal(round.ballots[1],a);assert.equal(round.ballots[2],b);
  const counts=tallyVotes(round).groups;assert.equal(counts.find(g=>g.target===b).votes,step.startsWith('sheriff')?1:1.5);
  assert.equal(await p.locator('#exileVoteResult').textContent(),'');assert.equal(await p.locator('#host .vote-result').count(),0);
  assert.equal(await p.locator('#hint').textContent(),'');
  assert.equal(await p.locator('#selection').textContent(),'已選：'+state.action.map(id=>id+'號').join('、'));
  const edit=p.locator(normal?'#exileResultEdit':'#voteNotesOpen');assert.equal(await edit.textContent(),'修改票型');assert.equal(await edit.evaluate(e=>e.parentElement.id),'actions');
  assert.match(await edit.evaluate(e=>e.previousElementSibling.textContent),/平票/);
  const r=await edit.boundingBox();assert.ok(r.width>=44&&r.height>=44);if(normal)await shot(p,'vote-summary');
  await edit.click();assert.ok(await p.locator(normal?'#exileVoteDialog':'#voteDialog').isVisible());
  // Return to voter 2 using the editor's existing navigation, then replace that ballot.
  await p.locator(normal?'#exileIndividual':'#voteIndividual').click();
  const previous=p.locator(normal?'#exilePrevious':'#votePrevious');while(await previous.isEnabled())await previous.click();
  await p.locator(normal?'#exileNext':'#voteNext').click();await p.locator(choices+' [data-choice="'+a+'"]').click();await p.locator(normal?'#exileVoteDone':'#voteDone').click();
  state=await saved(p);assert.deepEqual(state.action,[a]);assert.equal(state.votePatterns[0].ballots[2],a);
  await p.reload();assert.equal(await p.locator(normal?'#exileResultEdit':'#voteNotesOpen').textContent(),'修改票型');
  await p.locator('#next').click();const after=await saved(p);assert.ok(after.dayEvents.some(e=>e.voteRounds?.length));await p.locator('#back').click();assert.equal((await saved(p)).votePatterns[0].ballots[2],a);pass('submit/edit/recount/refresh/recap/undo: '+step);
 }
 await fixture(p,'exileVote');await p.locator('#voteNotesOpen').click();await p.locator('#exileVoteDone').click();
 assert.deepEqual((await saved(p)).action,[]);assert.equal(await p.locator('#next').isDisabled(),true);assert.equal(await p.locator('#exileResultEdit').isVisible(),true);assert.equal(await p.locator('#exileVoteResult').textContent(),'');
 const noVotes=await p.evaluate(async()=>{const {voteResultCard}=await import('./votes.js');return voteResultCard(JSON.parse(localStorage.getItem('eclipse-host-v1')).votePatterns[0]).textContent;});assert.match(noVotes,/本輪無有效票/);pass('all abstain keeps disabled next and editable ballots; recap retains no-valid-votes text');
 await p.locator('#exileResultEdit').click();await p.locator('#exileIndividual').click();await p.locator('#exileVoters [data-choice="5"]').click();await p.locator('#exileVoteDone').click();
 await p.locator('.seat[aria-label^="6號 "]').click();assert.equal(await p.locator('#voteMismatch').isVisible(),true);await p.locator('#next').click();assert.equal(Object.hasOwn((await saved(p)).dayEvents[0],'voteRounds'),false);await p.locator('#back').click();await p.locator('.seat[aria-label^="5號 "]').click();assert.equal(await p.locator('#voteMismatch').isVisible(),false);await p.locator('#next').click();assert.equal((await saved(p)).dayEvents[0].voteRounds.length,1);pass('manual override hides recap vote details; undo and return to suggested result restores them');
 await fixture(p); // restore a recap for screenshots after voting probes
 const offline=await browser.newContext({viewport:{width:390,height:844}}),o=await offline.newPage();o.on('pageerror',e=>errors.push(String(e)));await o.goto(base);await o.waitForFunction(()=>navigator.serviceWorker.controller!==null);await fixture(o);await waitArt(o);await offline.setOffline(true);await o.reload();await o.locator('#finished').waitFor();await waitArt(o);assert.equal(await o.locator('#nightRecap image[href^="art/catalog-v2/"]').count(),17);await offline.close();pass('offline recap keeps new art and stored events');
 assert.deepEqual(errors,[]);await c.close();await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),results,errors},null,2));throw e;}finally{await browser.close();server?.kill();}
