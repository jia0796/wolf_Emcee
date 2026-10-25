import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.UI_OUTPUT||'../../output/recap-identity-days-20261025/local/',import.meta.url);await mkdir(out,{recursive:true});
const base=process.env.UI_BASE||'http://127.0.0.1:5398/';
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5398'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
browser.on('context',context=>context.setDefaultNavigationTimeout(90000));
const pass=(name,data={})=>{results.push({name,...data});console.log(name);};
const saved=p=>p.evaluate(()=>localStorage.getItem('eclipse-host-v1'));
async function fixture(p,{winner='好人陣營',legacy=false}={}){
 await p.evaluate(async({winner,legacy})=>{
  const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js'),{personSnapshot}=await import('./records.js');
  const s=createGame('12');let i=0;for(const [role,n]of Object.entries(BOARDS['12'].roles))for(let j=0;j<n;j++)s.players[i++].role=role;
  s.rolesConfirmed=true;s.step='finished';s.winner=winner;s.winnerReason='測試用已結算復盤';s.night=3;
  const event=(key,actor,target,skill,extra={})=>({key,night:s.night,order:1,actors:[actor],actorRole:s.players[actor-1].role,rawTargets:[target],effectiveTargets:[target],actorSnapshots:[personSnapshot(s,actor)],targetSnapshots:[personSnapshot(s,target)],skill,executed:true,...extra});
  s.nightRecords=[
   {night:1,events:[event('basic',2,9,'wolf-attack'),event('inspect',5,2,'inspect',{result:'狼人'})],deaths:[{id:9,cause:'attack',source:'basic'}],settled:true},
   {night:2,events:[event('basic',3,8,'wolf-attack')],deaths:[{id:8,cause:'attack',source:'basic'}],settled:true},
   {night:3,events:[event('basic',4,6,'wolf-attack'),event('poison',6,4,'poison')],deaths:[{id:6,cause:'attack',source:'basic'},{id:4,cause:'poison',source:'witch',sourceRole:'witch'}],settled:true}
  ];
  s.dayEvents=[{...event('exile',1,1,'vote'),type:'exile',day:1},{...event('shot',1,5,'gun'),type:'shot',day:1,sourceRole:'king',skillSource:'native'},
   {...event('shot',8,2,'gun'),type:'shot',day:2,sourceRole:'hunter',skillSource:'native'},{...event('exile',1,3,'vote'),type:'exile',day:2}];
  for(const [id,cause]of [[9,'attack'],[1,'exile'],[5,'shot'],[8,'attack'],[2,'shot'],[3,'exile'],[6,'attack'],[4,'poison']])Object.assign(s.players[id-1],{alive:false,cause});
  s.nightState.deaths=structuredClone(s.nightRecords[2].deaths);
  if(legacy){delete s.players[8].cause;s.nightRecords[0].deaths=[];s.nightRecords=s.nightRecords.filter(r=>r.night!==2);s.dayEvents=s.dayEvents.filter(e=>e.day!==2);s.legacyRecap=true;}
  localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','finished');
 },{winner,legacy});await p.reload();await p.locator('#finished').waitFor();
}
async function decode(p){await p.evaluate(async()=>{const urls=[...new Set([...document.querySelectorAll('.final-identity-card image')].map(e=>e.getAttribute('href')))];await Promise.all(urls.map(async src=>{const img=new Image();img.src=src;await img.decode();}));});}
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',out)),animations:'disabled'});
try{
 for(const [width,height]of [[320,568],[375,667],[390,844],[430,932],[844,390],[768,1024],[1440,900]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base,{waitUntil:'networkidle'});await fixture(p);await decode(p);
  const before=await saved(p);assert.equal(await p.locator('.final-identities>.recap-section-title').textContent(),'身分回顧');assert.equal(await p.locator('.recap-victory h3').count(),0);assert.equal(await p.locator('.recap-victory h2').textContent(),'好人陣營獲勝');assert.match(await p.locator('.recap-victory p').textContent(),/^勝利原因：/);
  assert.equal(await p.locator('.final-identity-grid').first().getAttribute('data-camp'),'good');
  assert.deepEqual(await p.locator('.final-identity-grid[data-camp="good"]>.final-identity-card').evaluateAll(es=>es.map(e=>Number(e.dataset.seat))),[5,6,7,8,9,10,11,12]);
  for(const grid of await p.locator('.final-identity-grid').all())assert.equal(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),4);
  assert.equal(await p.locator('.final-identity-card.is-dead').count(),8);assert.equal(await p.locator('.final-identities').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true);assert.equal(await p.locator('#nightRecap').evaluate(e=>getComputedStyle(e).overflowY),'visible');assert.equal(await p.locator('#finished').evaluate(e=>getComputedStyle(e).overflowY),'auto');
  for(const [id,label]of [[1,'放逐'],[2,'獵人開槍'],[4,'女巫潑毒'],[5,'狼王開槍'],[9,'狼人襲擊'],[7,'存活']])assert.equal(await p.locator('.final-identity-card[data-seat="'+id+'"] .identity-status').textContent(),label);
  const boxes=await p.locator('.final-identity-card').evaluateAll(es=>es.map(e=>{const c=e.getBoundingClientRect(),n=e.querySelector('.identity-number').getBoundingClientRect(),name=getComputedStyle(e.querySelector('.identity-name')),status=e.querySelector('.identity-status').getBoundingClientRect(),art=e.querySelector('.recap-image'),style=getComputedStyle(e);return {dead:e.classList.contains('is-dead'),filter:getComputedStyle(art).filter,opacity:style.opacity,horizontal:e.scrollWidth>e.clientWidth+1&&style.overflow!=='hidden',badge:n.width===n.height&&n.left>=c.left&&n.top>=c.top,vertical:name.writingMode==='vertical-rl',statusWithin:status.right<=c.right+1&&status.bottom<=c.bottom};}));
  assert.ok(boxes.every(b=>!b.horizontal&&b.badge&&b.vertical&&b.statusWithin&&b.opacity==='1'),JSON.stringify({width,boxes}));assert.ok(boxes.filter(b=>b.dead).every(b=>b.filter.includes('brightness')));assert.ok(boxes.filter(b=>!b.dead).every(b=>b.filter==='none'));
  const order=await p.locator('#nightRecap').evaluate(e=>[...e.children].map(n=>n.className));assert.ok(order.indexOf('final-identities')<order.indexOf('recap-title'));assert.ok(order.indexOf('recap-title')<order.indexOf('recap-days'));
  assert.deepEqual(await p.locator('.recap-day-summary').allTextContents(),['第一天','第二天','第三天']);assert.equal(await p.locator('.recap-day[open]').count(),0);
  assert.equal(await p.locator('.recap-segment .recap-section-title').count(),0);
  await p.locator('.recap-day[data-day="1"]>summary').click();assert.equal(await p.locator('.recap-day[data-day="1"]').evaluate(e=>e.open),true);assert.equal(await p.locator('.recap-day[data-day="1"] .recap-segment.night').getAttribute('aria-label'),'夜晚');assert.equal(await p.locator('.recap-day[data-day="1"] .recap-segment.day').getAttribute('aria-label'),'白天');
  const icons=await p.locator('.recap-day[data-day="1"] .recap-segment').evaluateAll(es=>es.map(e=>({events:getComputedStyle(e,'::after').pointerEvents,image:getComputedStyle(e,'::after').backgroundImage,background:getComputedStyle(e,'::after').backgroundColor})));assert.ok(icons.every(x=>x.events==='none'));assert.notEqual(icons[0].image,icons[1].image);
  assert.ok(await p.locator('.recap-day[data-day="1"] [data-event="inspect"]').isVisible());
  if(width===390){await shot(p,'day-one');await p.locator('.recap-day[data-day="1"]>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=0);await shot(p,'identity-top');await p.locator('.final-identity-grid[data-camp="wolf"]').scrollIntoViewIfNeeded();await shot(p,'identity-wolves');}
  await p.locator('.recap-day[data-day="3"]>summary').click();await p.locator('.recap-day[data-day="3"] .night-result').last().scrollIntoViewIfNeeded();assert.ok(await p.locator('.recap-day[data-day="3"] [data-event="poison"]').isVisible());
  assert.ok(await p.locator('#playAgain').isVisible());assert.ok(await p.locator('#finishHome').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await saved(p),before);
  await p.reload();assert.equal(await p.locator('.recap-day[open]').count(),0);assert.equal(await saved(p),before);pass('four-column overview, deaths, day disclosures, footer and immutable save',{width,height,icons});await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);await fixture(p,{winner:'狼人陣營',legacy:true});assert.equal(await p.locator('.final-identity-grid').first().getAttribute('data-camp'),'wolf');assert.equal(await p.locator('[data-seat="9"] .identity-status').textContent(),'死因未記錄');assert.deepEqual(await p.locator('.recap-day-summary').allTextContents(),['第一天','第三天']);
  await p.locator('.recap-day-summary').first().focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.recap-day').first().evaluate(e=>e.open),true);await p.keyboard.press('Space');assert.equal(await p.locator('.recap-day').first().evaluate(e=>e.open),false);pass('wolf winner first, legacy gaps and missing reason; keyboard Enter/Space');
  await p.addStyleTag({content:'html{font-size:24px!important}'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.locator('.recap-day-summary').last().click();await shot(p,'large-text');pass('150 percent root font and reduced motion');await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);await p.waitForFunction(()=>navigator.serviceWorker.controller!==null);await fixture(p);await decode(p);await c.setOffline(true);await p.reload();await p.locator('#finished').waitFor();await decode(p);await p.locator('.recap-day-summary').first().click();assert.ok(await p.locator('.recap-day[data-day="1"] [data-event="inspect"]').isVisible());pass('offline restart loads new death module, four-column style and day events');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),results,errors},null,2));throw e;}finally{await browser.close();server?.kill();}
