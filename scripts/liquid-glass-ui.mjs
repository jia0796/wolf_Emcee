import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.UI_BASE||'http://127.0.0.1:5386/';
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5386'},stdio:'pipe'});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Local server exited: '+code)));});
const out=new URL(process.env.UI_OUTPUT||'../docs/liquid-glass-evidence/local/',import.meta.url);
const assets=JSON.parse(await readFile(new URL('../docs/catalog-clear-assets.json',import.meta.url),'utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[],networkFailures=[];
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
async function context(viewport,sw='block'){
 const c=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:sw});
 await c.route('**/*.supabase.co/**',r=>r.abort());
 const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('requestfailed',r=>networkFailures.push({url:r.url(),failure:r.failure()}));await p.goto(base);
 await p.locator('#start').waitFor();return {c,p};
}
async function fixture(p,step){
 await p.evaluate(async step=>{const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),s=createGame('kingGuard12');let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step=step;s.sheriff=1;s.nominees=[7,8,9];s.votePool=s.players.map(p=>p.id);if(step==='finished'){s.winner='good';s.winnerReason='測試用終局';}localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');},step);
 await p.reload();await p.locator(step==='finished'?'#finished':'#host').waitFor();
}
async function geometry(p,scene,width){
 const capture=()=>p.evaluate(()=>[...document.querySelectorAll('button,select,input,summary,h1,h2,p,#subtitle,#hint')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().width).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {key:e.id||e.className+' '+e.textContent.trim().slice(0,25),x:r.x,y:r.y,w:r.width,h:r.height,font:s.font,line:s.lineHeight,spacing:s.letterSpacing,padding:s.padding,margin:s.margin,gap:s.gap};}));
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const current=await capture();
 await p.evaluate(()=>document.documentElement.classList.remove('wolfcue-glass'));const original=await capture();
 await p.evaluate(()=>document.documentElement.classList.add('wolfcue-glass'));
 assert.deepEqual(current,original,`${scene}/${width}: geometry changed`);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${scene}: horizontal overflow`);
 results.push({type:'geometry',scene,width,elements:current.length});
}
try{
 for(const [width,height]of [[320,568],[375,667],[390,844],[430,932],[844,390]]){
  const {c,p}=await context({width,height});
  await geometry(p,'home',width);if(width===390)await shot(p,'home');
  await p.locator('#start').click();await p.locator('#traditionalMode').click();await geometry(p,'counts',width);
  await p.locator('[data-count="12"]').click();await geometry(p,'boards',width);
  await p.locator('#boardChoices button').first().click();await geometry(p,'setup',width);
  await fixture(p,'confirm');await geometry(p,'host',width);if(width===390)await shot(p,'host');
  await p.locator('#timerOpen').click();await geometry(p,'timer',width);await p.keyboard.press('Escape');
  await fixture(p,'exileVote');await p.locator('#voteNotesOpen').click();await geometry(p,'vote',width);
  const last=p.locator('#exileVoters [data-voter]').last();await last.scrollIntoViewIfNeeded();await last.click();assert.equal(await last.getAttribute('aria-pressed'),'true');await p.locator('#exileVoteClose').click();
  await fixture(p,'finished');await geometry(p,'recap',width);await c.close();
 }
 for(const width of [320,390]){
  const {c,p}=await context({width,height:844});await p.locator('#encyclopediaOpen').click();
  let checked=0;for(const camp of ['#libraryWolves','#libraryGood']){
   await p.locator(camp).click();const cards=p.locator('#roleLibrary [data-role]');
   for(let i=0;i<await cards.count();i++){
    const card=cards.nth(i),id=await card.getAttribute('data-role'),asset=assets.find(a=>a.id===id);assert.ok(asset);console.log(`catalog ${width} ${id}`);
    await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(img=>img.decode());assert.ok((await card.locator('img').getAttribute('src')).endsWith(asset.derived),`${id}/${width}: ${await card.locator('img').getAttribute('src')}`);
    await card.click();await p.locator('#previewFront img').evaluate(img=>img.decode());assert.ok((await p.locator('#previewFront img').getAttribute('src')).endsWith(asset.derived));
    if(width===390&&id==='seer')await shot(p,'seer-card');
    await p.locator('#previewCard').click();assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'true');await p.keyboard.press('Escape');checked++;
   }
  }
  assert.equal(checked,31);await geometry(p,'library',width);if(width===390){await p.locator('#encyclopedia').evaluate(e=>e.scrollTop=0);await shot(p,'library');}
  results.push({type:'catalog',width,roles:checked,listAndFlip:true});await c.close();
 }
 const {c,p}=await context({width:390,height:844});
 for(const asset of assets){const response=await p.request.get(new URL(asset.derived,base).href);assert.equal(response.status(),200);assert.equal(createHash('sha256').update(await response.body()).digest('hex'),asset.sha256);}
 results.push({type:'assetIntegrity',files:assets.length});
 await c.route('**/art/catalog-clear/seer-v1.png',r=>r.abort());await p.locator('#encyclopediaOpen').click();await p.locator('#libraryGood').click();await p.locator('#roleLibrary [data-role="seer"]').click();await p.waitForFunction(()=>document.querySelector('#previewFront img')?.getAttribute('src')?.includes('art/catalog/'));await p.locator('#previewFront img').evaluate(img=>img.decode());results.push({type:'originalImageFallback'});await c.close();
 const offline=await browser.newContext({viewport:{width:390,height:844}}),o=await offline.newPage();o.on('pageerror',e=>errors.push(String(e)));await o.goto(base);await o.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await o.evaluate(async paths=>{for(const path of paths)await fetch(path);},assets.map(a=>a.derived));
 await o.waitForFunction(async paths=>(await Promise.all(paths.map(p=>caches.match(new URL(p,location.href).href)))).every(Boolean),assets.map(a=>a.derived),{timeout:60000});
 await offline.setOffline(true);await o.reload();await o.locator('#encyclopediaOpen').click();await o.locator('#libraryGood').click();await o.locator('[data-role="seer"]').click();await o.locator('#previewFront img').evaluate(img=>img.decode());assert.ok((await o.locator('#previewFront img').getAttribute('src')).includes('catalog-clear'));
 results.push({type:'offline',cachedRoles:31,appShell:true,flipFront:true});await offline.close();
 assert.deepEqual(errors,[]);
 await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,errors,networkFailures,results},null,2));console.log(JSON.stringify({base,passed:results.length,failed:0}));
}catch(error){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(error),errors,networkFailures,results},null,2));throw error;}finally{await browser.close();server?.kill();}
