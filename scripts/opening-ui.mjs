import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5173/';
const out=process.env.OPEN_OUTPUT||'docs/opening-evidence/local';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
const check=(name,ok,data={})=>{assert.ok(ok,name);checks.push({name,pass:true,...data});console.log('PASS',name);};
async function make(options={}){
 const c=await browser.newContext({viewport:{width:options.width||390,height:options.height||844},serviceWorkers:'block',reducedMotion:options.reduce?'reduce':'no-preference'}),p=await c.newPage();
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://*.supabase.co/**',r=>r.abort());
 await p.addInitScript(()=>{window.openingEvents=[];new MutationObserver(()=>{const active=!!document.querySelector('.wolfcue-opening');if(active!==window.openingEvents.at(-1)?.active)window.openingEvents.push({active,time:performance.now()});}).observe(document,{subtree:true,childList:true});});
 if(options.init)await p.addInitScript(options.init);
 if(options.logoFail)await p.route('**/wolfcue-mark.svg',r=>r.abort());
 if(options.cssFail)await p.route('**/b3.css',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text()).replace('.wolfcue-opening{position:fixed','.wolfcue-opening{position:static')});});
 if(options.imagesFail)await p.route('**/art/backgrounds/**',r=>r.abort());
 return {c,p};
}
async function ready(p){await p.goto(base,{waitUntil:'domcontentloaded'});}
async function done(p){await p.waitForFunction(()=>document.body.dataset.screen&&!document.querySelector('.wolfcue-opening'));}
async function timeline(p){return p.evaluate(()=>{const on=openingEvents.find(e=>e.active),off=openingEvents.find(e=>!e.active&&e.time>on?.time);return {on,off,duration:off?.time-on?.time};});}
let complete=false;
try{
 for(const width of [320,375,390,430]){
  const {c,p}=await make({width,height:width===320?568:844});await ready(p);await p.locator('.opening-badge').waitFor();
  check(width+': original wolf SVG and exact brand',await p.evaluate(()=>document.querySelector('.opening-brand strong').textContent==='狼序 WolfCue'&&document.querySelector('.opening-brand p').textContent==='狼人殺主持工具'&&document.querySelector('.opening-trace path').getAttribute('d')===document.querySelector('.opening-badge path').getAttribute('d')));
  await p.evaluate(()=>{document.querySelector('#start').click();document.querySelector('#encyclopediaOpen').click();});await p.keyboard.press('Tab');await p.keyboard.press('Enter');
  check(width+': pointer/programmatic click and keyboard cannot activate home',await p.evaluate(()=>!document.querySelector('#hostModeDialog').open&&document.body.dataset.screen==='home'&&document.querySelector('main').inert));
  await p.waitForTimeout(1150);if(width===390)await p.screenshot({path:out+'/opening.png'});await done(p);const t=await timeline(p);check(width+': normal total 1.8s including fade',t.duration>=1650&&t.duration<2250,t);
  check(width+': overlay and inert fully removed',await p.evaluate(()=>!document.querySelector('.wolfcue-opening')&&!document.querySelector('main').inert));
  await p.locator('#start').click();check(width+': home usable',await p.locator('#hostModeDialog').isVisible());await p.locator('#hostModeClose').click();
  if(width===390)await p.screenshot({path:out+'/home-after.png'});
  await p.reload({waitUntil:'domcontentloaded'});await done(p);check(width+': reload skips',!(await timeline(p)).on);
  await p.locator('#encyclopediaOpen').click();await p.locator('#libraryReturn').click();check(width+': internal home skips',await p.locator('.wolfcue-opening').count()===0);await c.close();
 }
 for(const [name,options]of Object.entries({reduced:{reduce:true},inheritedSession:{init:()=>sessionStorage.setItem('wolfcue-opening-tab-v1','seen')},priorHost:{init:()=>sessionStorage.setItem('eclipse-host-v1-screen','host')},storageUnavailable:{init:()=>{Storage.prototype.setItem=()=>{throw Error('blocked');};}}})){
  const {c,p}=await make(options);await ready(p);await done(p);check(name+': skipped safely',!(await timeline(p)).on);await c.close();
 }
 for(const [name,options]of Object.entries({logoFailure:{logoFail:true},missingOpeningCSS:{cssFail:true},runtimeError:{},watchdog:{init:()=>{const original=setTimeout;window.setTimeout=(fn,ms,...args)=>ms>1600&&ms<2000?0:original(fn,ms,...args);}}})){
  const {c,p}=await make(options);await ready(p);
  if(name==='runtimeError')await p.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'simulated presentation failure'})));
  await done(p);const t=await timeline(p);check(name+': fails open within 2.5s tolerance',!t.on||t.duration<2850,t);
  if(name==='watchdog')check('independent watchdog, normal completion disabled',t.duration>=2350,t);
  await p.locator('#start').click();check(name+': no stuck input lock',await p.locator('#hostModeDialog').isVisible());await c.close();
 }
 {const {c,p}=await make({imagesFail:true});await ready(p);await done(p);check('missing background: usable neutral home, no old image',await p.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage==='none'&&getComputedStyle(document.body).backgroundImage==='none'));await p.locator('#start').click();await p.screenshot({path:out+'/offline-fallback.png'});check('missing background does not gate interaction',await p.locator('#hostModeDialog').isVisible());await c.close();}
 {const {c,p}=await make();let release;const gate=new Promise(r=>release=r);await p.route('**/lobby-shared.png',async r=>{await gate;await r.continue().catch(()=>{});});await ready(p);await done(p);check('slow lobby never extends opening',!(await p.locator('.wolfcue-opening').count()));release();await p.waitForFunction(()=>document.querySelector('.b3-backdrop').dataset.source==='art/backgrounds/lobby-shared.png');check('late lobby fades independently',await p.evaluate(()=>document.querySelectorAll('.b3-scene')[0].getAnimations().length+document.querySelectorAll('.b3-scene')[1].getAnimations().length>0));await c.close();}
 {const {c,p}=await make();await ready(p);await p.mouse.move(190,680);await p.mouse.down();await done(p);await p.mouse.up();await p.keyboard.up('Enter');check('press spanning dismissal cannot click through',await p.evaluate(()=>!document.querySelector('#hostModeDialog').open));await p.locator('#start').click();check('next intentional press works',await p.locator('#hostModeDialog').isVisible());await c.close();}
 {const {c,p}=await make();await ready(p);await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await done(p);check('BFCache restoration cancels rather than replaying',await p.locator('.wolfcue-opening').count()===0);await c.close();}
 {const {c,p}=await make();await p.goto(base+'?room=00000000-0000-4000-8000-000000000000#invite=fake-test',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.dataset.screen==='online');check('QR invitation bypasses opening',!(await timeline(p)).on);await c.close();}
 {const {c,p}=await make();await ready(p);await done(p);const p2=await c.newPage();await p2.goto(base,{waitUntil:'domcontentloaded'});await p2.locator('.wolfcue-opening').waitFor();check('independent new tab plays despite same localStorage',true);await c.close();}

 {const {c,p}=await make();await ready(p);await p.keyboard.down('Space');await done(p);await p.keyboard.up('Space');check('held keyboard release does not activate a home action',await p.evaluate(()=>!document.querySelector('#hostModeDialog').open&&document.body.dataset.screen==='home'));await p.locator('#start').click();await c.close();}
 {const {c,p}=await make();await ready(p);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await done(p);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});check('background/foreground cancels without replay',await p.locator('.wolfcue-opening').count()===0);await c.close();}
 {const {c,p}=await make();await ready(p);await p.evaluate(()=>document.querySelector('.wolfcue-opening').getAnimations()[0].cancel());await done(p);check('animation cancellation unlocks immediately',(await timeline(p)).duration<1000);await c.close();}
 {const {c,p}=await make();await ready(p);await done(p);const saved=await p.evaluate(async()=>{const {createGame}=await import('./engine.js');const state=createGame('12');const raw=JSON.stringify(state);localStorage.setItem('eclipse-host-v1',raw);sessionStorage.setItem('eclipse-host-v1-screen','host');return raw;});await p.reload({waitUntil:'domcontentloaded'});await p.locator('#host').waitFor({state:'visible'});check('host save reload bypasses animation and preserves history',!(await timeline(p)).on&&await p.evaluate(raw=>JSON.stringify(JSON.parse(localStorage.getItem('eclipse-host-v1')).history)===JSON.stringify(JSON.parse(raw).history),saved));await c.close();}
 check('no uncaught browser errors',errors.length===0,{errors});complete=true;
}finally{writeFileSync(out+'/results.json',JSON.stringify({complete,base,checks,errors},null,2));await browser.close();}
