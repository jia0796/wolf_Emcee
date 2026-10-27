import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CATALOG_ART_V2} from '../public/catalog-v2.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5399/';
const out=new URL(process.env.UI_OUTPUT||'../../output/asset-current-audit/hint-art-local/',import.meta.url);
await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5399'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
async function page(){
 const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),p=await c.newPage();
 p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();return {c,p};
}
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
try{
 for(const mode of [0,1,2,'skip','insufficient']){
  const {c,p}=await page();
  await p.evaluate(async mode=>{
   const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js');
   const s=createGame('awakenedKingWitch12',{sheriff:false});let i=0;
   for(const [r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;
   s.rolesConfirmed=true;s.step='akwHelpers';s.night=mode==='skip'?1:3;
   const n=typeof mode==='number'?mode:mode==='insufficient'?2:0;
   s.akw.attempts=[[2],[3,4]].slice(0,n).map((helpers,i)=>({actor:5,target:9,helpers,night:i+1,verdict:false,ballots:null}));
   s.nightAction.poison=mode!=='skip';s.nightAction.poisonTarget=9;
   if(mode==='skip')s.nightAction.antidote=true;
   if(mode==='insufficient')for(const p of s.players)p.alive=[5,9].includes(p.id);
   localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');
  },mode);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#host').waitFor();
  const hint=await p.locator('#hint').textContent();
  assert.equal(hint,typeof mode==='number'?'請選擇 '+(mode+1)+' 位協助者，可選自己；每人整局限協助一次':mode==='skip'?'本晚未使用毒藥，按下一步':'符合資格的協助者人數不足');
  assert.equal(await p.locator('#next').isDisabled(),typeof mode==='number');
  assert.equal(await p.locator('#selection').textContent(),'');
  await shot(p,'hint-'+mode);results.push({mode,hint,nextGatingPreserved:true});await c.close();
 }
 const {c,p}=await page();
 await p.locator('#encyclopediaOpen').click();await p.locator('#libraryGood').click();await p.locator('[data-role="guard"]').click();
 await p.locator('#previewFront img').evaluate(i=>i.decode());
 assert.equal(await p.locator('#previewFront img').getAttribute('src'),CATALOG_ART_V2.guard.full);
 await shot(p,'guard-current');await p.keyboard.press('Escape');await p.locator('#libraryReturn').click();
 results.push({guardApprovedArt:true});
 const roles=['guard','gravekeeper','demon','mechanical','seedWolf','dancer','mask'];
 for(const role of roles){
  const check=await p.evaluate(async role=>{
   const {eventCard}=await import('./recap.js'),{ROLE_DATA}=await import('./data.js');
   const person={id:1,role,name:ROLE_DATA[role].name,tone:ROLE_DATA[role].kind,image:ROLE_DATA[role].image};
   const event={key:'synthetic-art-audit',actors:[1],actorRole:role,rawTargets:[1],effectiveTargets:[1],actorSnapshots:[person],targetSnapshots:[{...person}],skill:'inspect',executed:true};
   const before=JSON.stringify(event),card=eventCard(event);document.body.append(card);
   const sources=[...card.querySelectorAll('.recap-image image')].map(i=>i.getAttribute('href'));
   await Promise.all(sources.map(async src=>{const image=new Image();image.src=src;await image.decode();}));
   card.remove();return {sources,snapshotUnchanged:before===JSON.stringify(event)};
  },role);
  assert.deepEqual(check.sources,[CATALOG_ART_V2[role].full,CATALOG_ART_V2[role].full]);assert.ok(check.snapshotUnchanged);
  results.push({role,recapActorAndTargetArt:true,snapshotUnchanged:true});
 }
 await c.close();assert.deepEqual(errors,[]);
 await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,scope:'Synthetic local browser fixtures; no cloud room or gameplay modifications'},null,2));
 console.log(JSON.stringify({passed:results.length,failed:0,skipped:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({completed:results.length,error:String(e),results,errors},null,2));throw e;}
finally{await browser.close();server?.kill();}
