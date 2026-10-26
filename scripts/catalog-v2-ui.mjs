import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {ROLE_DATA} from '../public/data.js';
import {CATALOG_ART_V2} from '../public/catalog-v2.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5394/';
const out=new URL(process.env.UI_OUTPUT||'../../output/catalog-release-20261025/ui-local/',import.meta.url);
await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5394'},stdio:'pipe'});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(Error('Server exited '+c)));});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[],errors=[];let active;
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
async function open(viewport,{large=false,motion='reduce',sw='block'}={}){
 const c=await browser.newContext({viewport,hasTouch:true,reducedMotion:motion,serviceWorkers:sw});
 const p=await c.newPage();active=p;p.on('pageerror',e=>errors.push(String(e)));p.setDefaultNavigationTimeout(90000);
 await p.goto(base,{waitUntil:'networkidle'});
 if(large)await p.addStyleTag({content:'html{font-size:24px!important}'});
 await p.locator('#encyclopediaOpen').click();return {c,p};
}
async function cardCheck(p,id){
 const card=p.locator('#roleLibrary [data-role="'+id+'"]');await card.scrollIntoViewIfNeeded();
 // Scrolling schedules IntersectionObserver; wait for the real lazy-load request before decoding.
 await p.waitForFunction(i=>i.getAttribute('src')&&i.complete&&i.naturalWidth>0,await card.locator('img').elementHandle());
 await card.locator('img').evaluate(i=>i.decode());
 assert.equal(await card.locator('img').getAttribute('src'),CATALOG_ART_V2[id].thumbnail);
 assert.deepEqual(await card.locator('img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[420,588]);
 assert.ok(await card.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),id+' directly clickable');
 await card.click();await p.locator('#previewFront img').evaluate(i=>i.decode());
 assert.equal(await p.locator('#previewFront img').getAttribute('src'),CATALOG_ART_V2[id].full);
 assert.deepEqual(await p.locator('#previewFront img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[1060,1484]);
 assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'false');
 assert.equal(await p.locator('#previewBack').evaluate(e=>e.inert),true);
 await p.locator('#previewCard').click();
 assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'true');
 assert.equal(await p.locator('#previewFront').evaluate(e=>e.inert),true);
 assert.equal(await p.locator('#previewBack').evaluate(e=>e.inert),false);
 assert.equal(await p.locator('#previewBack h2').textContent(),ROLE_DATA[id].name);
 assert.deepEqual(await p.locator('#previewBack .description-row>span:last-child').allTextContents(),[ROLE_DATA[id].skill,ROLE_DATA[id].goal]);
 assert.ok(await p.locator('#previewBack').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await p.locator('#previewBack').evaluate(e=>e.scrollTop=e.scrollHeight);
 assert.ok(await p.locator('#previewBack').evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop<2));
 await p.keyboard.press('Escape');assert.equal(await p.locator('#rolePreview').isVisible(),false);
 results.push({role:id,frontBack:true,textPreserved:true,lastContentReachable:true});
}
try{
 for(const [width,height]of [[320,568],[375,667],[390,844],[430,932],[390,480],[844,390],[768,1024],[1440,900]]){
  const {c,p}=await open({width,height});
  const pinned=await p.locator('.catalog-toolbar').boundingBox();
  const cols=await p.locator('#roleLibrary').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);assert.equal(cols,3);
  let count=0;
  for(const camp of ['#libraryWolves','#libraryGood']){
   await p.locator(camp).click();const ids=await p.locator('#roleLibrary .role-card').evaluateAll(es=>es.map(e=>e.dataset.role));count+=ids.length;
   for(const id of width===320||width===390&&height===844?ids:[ids[0],ids.at(-1)])await cardCheck(p,id);
   assert.deepEqual(await p.locator('.catalog-toolbar').boundingBox(),pinned);assert.ok(await p.locator('#libraryReturn').isVisible());
   if(width===390&&height===844){await shot(p,camp==='#libraryWolves'?'fixed-wolves-bottom':'fixed-good-bottom');await p.locator('#encyclopedia .catalog-scroll').evaluate(e=>e.scrollTop=0);await shot(p,camp==='#libraryWolves'?'library-wolves':'library-good');}
  }
  assert.equal(count,35);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===390&&height===844){
   await p.locator('#roleLibrary [data-role="magician"]').click();await p.locator('#previewFront img').evaluate(i=>i.decode());await shot(p,'magician-front');await p.locator('#previewCard').click();await shot(p,'magician-back');await p.keyboard.press('Escape');
  }
  await p.locator('#libraryReturn').click();assert.equal(await p.locator('body').getAttribute('data-screen'),'home');
  results.push({viewport:[width,height],threeColumns:true,toolbarPinned:true,returnHome:true});await c.close();
 }
 {
  const {c,p}=await open({width:320,height:568},{large:true});await p.locator('#libraryWolves').click();await cardCheck(p,'awakenedBeauty');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));results.push({largeText150:true});await c.close();
 }
 {
  const {c,p}=await open({width:390,height:844},{motion:'no-preference'});await p.locator('#libraryGood').click();await p.locator('[data-role="seer"]').focus();await p.keyboard.press('Enter');await p.locator('#previewCard').focus();await p.keyboard.press('Enter');
  await p.waitForTimeout(550);assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'true');
  assert.notEqual(await p.locator('.preview-inner').evaluate(e=>getComputedStyle(e).transform),'none');await p.keyboard.press('Enter');await p.waitForTimeout(550);await p.mouse.click(3,3);assert.equal(await p.locator('#rolePreview').isVisible(),false);
  results.push({keyboardFlipAndBackdropClose:true,originalFlipAnimation:true});await c.close();
 }
 {
  const {c,p}=await open({width:390,height:844});await c.route('**/art/catalog-v2/seer-*.webp',r=>r.abort());await p.locator('#libraryGood').click();await p.locator('[data-role="seer"]').click();
  await p.waitForFunction(()=>document.querySelector('#previewFront img')?.getAttribute('src')==='art/catalog/seer.png');await p.locator('#previewFront img').evaluate(i=>i.decode());
  results.push({newImageFailureOriginalFallback:true});await c.close();
 }
 {
  const {c,p}=await open({width:390,height:844});
  await p.evaluate(async()=>{const {createGame}=await import('./engine.js');const s=createGame('brothers12');localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');});await p.reload();await p.locator('#host').waitFor();
  const before=await p.evaluate(()=>localStorage.getItem('eclipse-host-v1'));const subtitle=await p.locator('#subtitle').textContent();await p.locator('#hostLibrary').click();await p.locator('#libraryWolves').click();await cardCheck(p,'elder');await p.locator('#libraryReturn').click();
  assert.equal(await p.locator('#subtitle').textContent(),subtitle);assert.equal(await p.evaluate(()=>localStorage.getItem('eclipse-host-v1')),before);
  results.push({hostReturnAndSaveUnchanged:true});await c.close();
 }
 {
  const {c,p}=await open({width:390,height:844});const manifest=JSON.parse(await readFile(new URL('../docs/catalog-v2-assets.json',import.meta.url)));
  for(const row of manifest)for(const key of ['thumbnail','full']){const r=await p.request.get(new URL(row[key],base).href);assert.equal(r.status(),200);assert.equal(createHash('sha256').update(await r.body()).digest('hex'),row[key+'Sha256']);}
  results.push({servedAssetHashes:66});await c.close();
 }
 {
  const {c,p}=await open({width:390,height:844},{sw:'allow'});await p.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  const paths=Object.values(CATALOG_ART_V2.seer);
  await p.evaluate(async paths=>{for(const path of paths)await fetch(path);},paths);
  await p.waitForFunction(async paths=>(await Promise.all(paths.map(p=>caches.match(new URL(p,location.href).href)))).every(Boolean),paths,{timeout:60000});
  await c.setOffline(true);await p.reload();await p.locator('#encyclopediaOpen').click();await p.locator('#libraryGood').click();await cardCheck(p,'seer');results.push({offlineCatalogAndFlip:true});await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,errors,results},null,2));console.log(JSON.stringify({passed:results.length,failed:0,output:fileURLToPath(out)}));
}catch(e){if(active&&!active.isClosed())await shot(active,'failure').catch(()=>{});await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),errors,results},null,2));throw e;}
finally{await browser.close();server?.kill();}
