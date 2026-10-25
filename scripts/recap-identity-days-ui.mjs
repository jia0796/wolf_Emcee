import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.UI_OUTPUT||'../../output/recap-tabs-20261025/local/',import.meta.url);await mkdir(out,{recursive:true});
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
  s.dayEvents[0].voteRounds=['sheriffVote','sheriffRevote','exileVote','exileRevote'].map((stage,i)=>({key:'1:'+stage,day:1,stage,kind:stage.startsWith('sheriff')?'sheriff':'exile',label:['警長第一輪','警長 PK','放逐第一輪','放逐 PK'][i],voters:[1,2,3,4],targets:[1,2],sheriff:stage.startsWith('exile')?1:null,ballots:{1:1,2:1,3:2,4:'abstain'},submitted:true,confirmed:true}));
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
  const order=await p.locator('#nightRecap').evaluate(e=>[...e.children].map(n=>n.className));assert.ok(order.indexOf('final-identities')<order.indexOf('recap-window'));
  assert.deepEqual(await p.locator('.recap-day-tab').allTextContents(),['第一天','第二天','第三天']);assert.equal(await p.locator('.recap-day:not([hidden])').count(),1);assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第一天');
  assert.equal(await p.locator('.recap-segment .recap-section-title').count(),0);
  const beforeCollapse=await saved(p);await p.locator('.final-identities>summary').click();assert.equal(await p.locator('.final-identities').evaluate(e=>e.open),false);await p.locator('.final-identities>summary').click();assert.equal(await p.locator('.final-identities').evaluate(e=>e.open),true);assert.equal(await saved(p),beforeCollapse);
  await p.locator('.final-identities>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=e.scrollHeight);
  assert.equal(await p.locator('.recap-day[data-day="1"] .recap-segment.night').getAttribute('aria-label'),'夜晚');assert.equal(await p.locator('.recap-day[data-day="1"] .recap-segment.day').getAttribute('aria-label'),'白天');
  const icons=await p.locator('.recap-day[data-day="1"] .recap-segment').evaluateAll(es=>es.map(e=>({events:getComputedStyle(e,'::after').pointerEvents,image:getComputedStyle(e,'::after').backgroundImage})));assert.ok(icons.every(x=>x.events==='none'));assert.notEqual(icons[0].image,icons[1].image);
  await p.locator('.vote-records>summary').click();for(const summary of await p.locator('.vote-records>details>summary').all())await summary.click();
  const palette=await p.locator('.vote-records .vote-result-content .vote-highest').evaluateAll(es=>es.map(e=>({border:getComputedStyle(e).borderColor,bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e.querySelector('strong')).color})));assert.equal(palette.length,4);assert.ok(palette.every(x=>x.border==='rgb(178, 219, 229)'&&x.color==='rgb(244, 248, 249)'&&x.bg==='rgba(34, 70, 88, 0.65)'));
  const windowBox=await p.locator('.recap-window').boundingBox();assert.ok(windowBox.height<=height-110);if(width===390&&height===844)assert.ok(windowBox.height>=650&&windowBox.height<=660);assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').evaluate(e=>getComputedStyle(e).boxShadow),'none');
  const pinned=await p.locator('.recap-window-header').boundingBox();await p.locator('.recap-days').evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await p.locator('.recap-days').evaluate(e=>e.scrollTop>0));assert.deepEqual(await p.locator('.recap-window-header').boundingBox(),pinned);
  const row=await p.locator('.recap-day-tab').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert.ok(row.every(y=>Math.abs(y-row[0])<1));
  if(width===390){await shot(p,'vote-records');await p.locator('.recap-days').evaluate(e=>e.scrollTop=0);await shot(p,'day-one');await p.locator('.final-identities>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=0);await shot(p,'identity-top');await p.locator('.final-identities>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=e.scrollHeight);}
  await p.locator('.recap-day-tab[data-day="3"]').click();assert.equal(await p.locator('.recap-days').evaluate(e=>e.scrollTop),0);assert.equal(await p.locator('.recap-day[data-day="1"]').isVisible(),false);assert.ok(await p.locator('.recap-day[data-day="3"] [data-event="poison"]').isVisible());await p.locator('.recap-day[data-day="3"] .night-result').last().scrollIntoViewIfNeeded();
  assert.ok(await p.locator('#playAgain').isVisible());assert.ok(await p.locator('#finishHome').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await saved(p),before);
  await p.reload();assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第一天');assert.equal(await saved(p),before);pass('four-column identity collapse, fixed header, horizontal day tabs, four ballot palettes and immutable save',{width,height,icons});await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);await fixture(p,{winner:'狼人陣營',legacy:true});assert.equal(await p.locator('.final-identity-grid').first().getAttribute('data-camp'),'wolf');assert.equal(await p.locator('[data-seat="9"] .identity-status').textContent(),'死因未記錄');assert.deepEqual(await p.locator('.recap-day-tab').allTextContents(),['第一天','第三天']);
  await p.locator('.final-identities>summary').click();await p.locator('.recap-day-tab').first().focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第三天');await p.keyboard.press('Home');assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第一天');await p.keyboard.press('End');assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第三天');pass('wolf winner first, legacy gaps, missing reason and arrow/Home/End tabs');
  await p.addStyleTag({content:'html{font-size:24px!important}'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(p,'large-text');pass('150 percent root font and reduced motion');await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);await p.waitForFunction(()=>navigator.serviceWorker.controller!==null);await fixture(p);await decode(p);await c.setOffline(true);await p.reload();await p.locator('#finished').waitFor();await decode(p);await p.locator('.recap-day-tab').first().click();assert.ok(await p.locator('.recap-day[data-day="1"] [data-event="inspect"]').isVisible());pass('offline restart loads new death module, four-column style, day tabs and events');await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:320,height:568},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);await fixture(p);
  await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('eclipse-host-v1'));for(let n=4;n<=12;n++)s.nightRecords.push({night:n,events:[],deaths:[],settled:true});localStorage.setItem('eclipse-host-v1',JSON.stringify(s));});await p.reload();await p.locator('.final-identities>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=e.scrollHeight);const before=await saved(p);
  assert.equal(await p.locator('.recap-day-tab').count(),12);const tabs=p.locator('.recap-day-tabs');assert.ok(await tabs.evaluate(e=>e.scrollWidth>e.clientWidth));const ys=await p.locator('.recap-day-tab').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert.ok(ys.every(y=>Math.abs(y-ys[0])<1));
  await tabs.evaluate(e=>e.scrollLeft=e.scrollWidth);await p.locator('.recap-day-tab').last().click();assert.equal(await p.locator('.recap-day-tab[aria-selected=true]').textContent(),'第十二天');assert.equal(await p.locator('.recap-day:not([hidden])').getAttribute('data-day'),'12');assert.equal(await saved(p),before);await shot(p,'horizontal-days');pass('twelve saved days stay on one row, swipe overflow and last day directly clickable');
  await p.evaluate(async()=>{const {renderRecap}=await import('./recap.js');const {createGame}=await import('./engine.js');const s=createGame('12');s.nightRecords=[];s.dayEvents=[];renderRecap(document.getElementById('nightRecap'),s);});assert.equal(await p.locator('.recap-day-tab').count(),0);assert.ok(await p.locator('.recap-empty').isVisible());pass('empty history does not fabricate a day');await c.close();
 }
 {
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
  await p.evaluate(async()=>{const {createGame,choose,next}=await import('./engine.js'),{BOARDS}=await import('./data.js');const s=createGame('awakenedBeauty12',{sheriff:false});let i=0;for(const [role,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;s.deathsCommitted=true;s.night=2;s.players[7].alive=false;s.step='eliminated';s.queue=[{id:8,cause:'exile',context:'day',day:2}];s.continuation='nextNight';s.operation='native';Object.assign(s.awb,{target:9,linkNight:2,lastUsedNight:2});choose(s,'patrol:1');if(!next(s))throw Error('patrol did not execute');s.step='finished';s.winner='好人陣營';s.winnerReason='巡獵替死測試';localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','finished');});await p.reload();await p.locator('#finished').waitFor();const before=await saved(p);
  await p.locator('.final-identities>summary').click();await p.locator('#finished').evaluate(e=>e.scrollTop=e.scrollHeight);const first=p.locator('.recap-day:not([hidden]) [data-event="shot"]'),second=p.locator('.recap-day:not([hidden]) [data-event="awakenedSubstitute"]');assert.equal(await first.count(),1);assert.equal(await second.count(),1);assert.deepEqual(await first.locator('.recap-person strong').allTextContents(),['覺醒獵人','覺醒狼美人']);assert.deepEqual(await second.locator('.recap-person strong').allTextContents(),['覺醒狼美人','平民']);assert.deepEqual(await second.locator('.recap-person span').allTextContents(),['1號','9號']);assert.equal(await saved(p),before);await shot(p,'patrol-substitution');pass('real day patrol renders hunter -> beauty and beauty -> substitute in separate cards');await c.close();
 }
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,skipped:0,results,errors,realDevices:'待真機驗收'},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(e){await writeFile(new URL('failure.json',out),JSON.stringify({base,completed:results.length,error:String(e),results,errors},null,2));throw e;}finally{await browser.close();server?.kill();}
