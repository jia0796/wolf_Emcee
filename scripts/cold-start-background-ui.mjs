import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.COUNCIL_URL||'http://127.0.0.1:5173/';
const out=process.env.COUNCIL_OUT||'../qa-cold-start';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const checks=[],errors=[];let completed=false;
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);console.log('PASS',name);};
async function open({width=390,legacy=false,failImages=false,oldCSS=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 // No rooms or real user data are touched by this visual regression.
 await page.route('https://*.supabase.co/**',r=>r.abort());
 if(legacy||oldCSS)await page.route('**/style.css',r=>r.fulfill({contentType:'text/css',body:execFileSync('git',['show','3c519f2:public/style.css'],{encoding:'utf8'})}));
 if(legacy)await page.route('**/',r=>r.fulfill({contentType:'text/html',body:execFileSync('git',['show','3c519f2:public/index.html'],{encoding:'utf8'})}));
 if(failImages)await page.route('**/art/backgrounds/**',r=>r.abort());
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/app.js',async r=>{await gate;await r.continue().catch(()=>{});});
 await page.addInitScript(()=>{window.startupFrames=[];const sample=()=>{if(document.body&&window.startupFrames.length<300)window.startupFrames.push({screen:document.body.dataset.screen||null,image:getComputedStyle(document.body,'::before').backgroundImage});requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await page.goto(base,{waitUntil:'commit'});await page.waitForFunction(()=>document.body&&getComputedStyle(document.body,'::before').position==='fixed');
 // Wait for actual paints with app initialization deliberately suspended.
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return {page,context,release};
}
const sample=p=>p.evaluate(()=>({screen:document.body.dataset.screen||null,image:getComputedStyle(document.body,'::before').backgroundImage,body:getComputedStyle(document.body).backgroundImage}));
try{
 if(process.env.COUNCIL_BASELINE!=='0'){
  const old=await open({legacy:true});check('Old release reproduces pre-JS shared.png fallback',(await sample(old.page)).image.includes('/shared.png'));
  await old.page.screenshot({path:out+'/before-startup.png',timeout:10000});old.release();await old.context.close();
 }
 for(const width of [320,375,390,430]){
  const c=await open({width});const s=await sample(c.page);
  check(`${width}: delayed app script has no legacy image`,s.screen===null&&s.image==='none'&&s.body==='none');
  if(width===390)await c.page.screenshot({path:out+'/startup-neutral.png',timeout:10000});
  c.release();await c.page.waitForFunction(()=>document.querySelector('.b3-backdrop')?.dataset.source==='art/backgrounds/lobby-shared.png');
  check(`${width}: current lobby loads and Start remains actionable`,await c.page.locator('#start').isEnabled());
  check(`${width}: all sampled frames exclude shared.png`,await c.page.evaluate(()=>startupFrames.length>0&&startupFrames.every(f=>!f.image.match(/\/shared\.png/))));
  if(width===390){
   await c.page.screenshot({path:out+'/current-home.png',timeout:10000});
   await c.page.locator('#start').click();await c.page.locator('#traditionalMode').click();await c.page.locator('[data-count="12"]').click();await c.page.locator('[data-board="12"]').click();await c.page.locator('#setupStart').click();
   for(const [action,source] of [[null,'host-day'],['#next','host-night'],['#back','host-day']]){
    if(action)await c.page.locator(action).click();await c.page.waitForFunction(src=>document.querySelector('.b3-backdrop')?.dataset.source===`art/backgrounds/${src}.png`,source);check(`Traditional ${action||'prepare'}: ${source}`,true);
   }
   await c.page.reload({waitUntil:'domcontentloaded'});await c.page.waitForFunction(()=>document.querySelector('.b3-backdrop')?.dataset.source==='art/backgrounds/host-day.png');check('Reload retains preparation day scene',true);
  }
  await c.context.close();
 }
 const cached=await open({oldCSS:true});check('New HTML neutralizes old cached CSS before scripts',(await sample(cached.page)).image==='none');cached.release();await cached.context.close();
 const failed=await open({failImages:true});failed.release();await failed.page.locator('#start').waitFor();check('Failed images preserve interactive home without legacy art',!(await sample(failed.page)).image.match(/\/shared\.png/)&&await failed.page.locator('#start').isEnabled());await failed.page.locator('#start').click();check('Image failure does not block mode selection',await failed.page.locator('#traditionalMode').isVisible());await failed.context.close();
 check('No browser exceptions',errors.length===0);completed=true;
}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify({base,completed,passed:checks.length,checks,errors,environment:'Desktop Edge; physical iPhone/PWA not verified'},null,2));}
