import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CATALOG_ART_V2} from '../public/catalog-v2.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5400/';
const out=new URL(process.env.UI_OUTPUT||'../../output/asset-current-audit/offline-local/',import.meta.url);
await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5400'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const cacheName=(await readFile(new URL('../public/sw.js',import.meta.url),'utf8')).match(/const CACHE='([^']+)'/)[1];
const audit=JSON.parse(await readFile(new URL('../docs/catalog-source-audit.json',import.meta.url)));
const manifest=JSON.parse(await readFile(new URL('../docs/catalog-v2-assets.json',import.meta.url)));
const paths=audit.changed.flatMap(({id})=>{const row=manifest.find(r=>r.id===id);return ['full','thumbnail'].map(key=>({path:row[key],hash:row[key+'Sha256']}));});
const browser=await chromium.launch({channel:'msedge',headless:true}),c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage(),results=[],errors=[];
p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:90000});
 const hashes=await p.evaluate(async({paths,cacheName})=>{
  const cache=await caches.open(cacheName),rows=[];
  for(const row of paths){const response=await fetch(row.path);if(!response.ok)throw Error('HTTP '+response.status);await response.arrayBuffer();
   const saved=await cache.match(new URL(row.path,location.href).href);if(!saved)throw Error('Uncached '+row.path);
   rows.push({path:row.path,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await saved.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')});}
  return rows;
 },{paths,cacheName});
 assert.deepEqual(hashes,paths);results.push({cacheName,verifiedCachedAssets:paths.length});
 await c.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#encyclopediaOpen').click();
 for(const {id}of audit.changed){
  const wolves=['mechanical','seedWolf','mask'].includes(id);await p.locator(wolves?'#libraryWolves':'#libraryGood').click();
  await p.locator('[data-role="'+id+'"]').click();await p.locator('#previewFront img').evaluate(i=>i.decode());
  assert.equal(await p.locator('#previewFront img').getAttribute('src'),CATALOG_ART_V2[id].full);
  if(id==='guard')await p.screenshot({path:fileURLToPath(new URL('guard-offline.png',out)),animations:'disabled'});
  await p.locator('#previewCard').click();assert.equal(await p.locator('#previewCard').getAttribute('aria-pressed'),'true');
  await p.keyboard.press('Escape');results.push({role:id,offlineCurrentArtAndFlip:true});
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,realDevices:'待真機驗收'},null,2));
 console.log(JSON.stringify({passed:results.length,failed:0,cacheName}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({completed:results.length,error:String(e),results,errors},null,2));throw e;}
finally{await browser.close();server?.kill();}
