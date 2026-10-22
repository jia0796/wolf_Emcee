import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5173/',out=new URL('../docs/dsk-mec-bro-evidence/ui/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const pass=name=>{results.push({name,pass:true});console.log(name);};
let context;
async function fixture(p,options={}){await p.evaluate(async o=>{const {createGame,next}=await import('./engine.js'),{BOARDS}=await import('./data.js');const s=createGame(o.board||'classic12');let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.night=o.night||1;
 if(o.gesture){s.step=o.night===1?'mechanicalFirstGesture':'mechanicalHunterGesture';s.mechanical.role=o.learned;s.players.find(p=>p.role==='mechanical').alive=!o.dead;}
 else{s.step='announcement';s.deaths=[{id:s.players.find(p=>p.role==='hunter').id,cause:'attack'}];next(s);if(o.legacy)s.step='skill';}
 localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');},options);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#host').waitFor({state:'visible'});}
try{
 for(const width of [320,375,390,430]){
  context=await browser.newContext({viewport:{width,height:width===320?568:844},serviceWorkers:'block'});await context.route('**/*.supabase.co/**',r=>r.abort());const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
  for(const night of [1,2]){await fixture(p,{night});assert.equal(await p.locator('#next').isDisabled(),true);assert.match(await p.locator('#subtitle').textContent(),night===1?/遺言/:/淘汰，沒有遺言/);assert.equal(await p.locator('#operationCard img[src="skills/icon-gun.svg"]').count(),1);
   await p.getByRole('button',{name:'不開槍',exact:true}).click();assert.equal(await p.getByRole('button',{name:'開槍',exact:true}).getAttribute('aria-pressed'),'false');assert.equal(await p.locator('#next').isDisabled(),false);await p.getByRole('button',{name:'開槍',exact:true}).click();assert.equal(await p.locator('#next').isDisabled(),true);
   const target=p.locator('.seat:not(:disabled)').first();await target.click();assert.equal(await p.locator('#next').isDisabled(),false);await target.click();assert.equal(await p.locator('#next').isDisabled(),true);await target.click();await p.reload();assert.equal(await p.locator('#next').isDisabled(),false);await p.locator('#next').click();await p.locator('#back').click();assert.equal(await p.locator('#next').isDisabled(),false);const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,0);assert.ok(['lastWords','eliminated'].includes(s.step));
   const boxes=await p.locator('#actions button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};}));assert.ok(boxes.every(r=>r.left>=0&&r.right<=width+1));
   await p.screenshot({path:new URL(`death-${width}-${night}.png`,out).pathname.slice(1)});pass(`DSK ${width}px night${night}: modes, target, cancel, reload, undo`);
  }
  await fixture(p,{legacy:true,night:2});assert.match(await p.locator('#subtitle').textContent(),/淘汰，沒有遺言/);assert.equal(await p.locator('#next').isDisabled(),true);pass(`DSK ${width}px legacy skill recovery`);
  await context.close();
 }
 context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await context.route('**/*.supabase.co/**',r=>r.abort());const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(base);
 for(const night of [1,2,3,4])for(const learned of [null,'hunter','medium']){await fixture(p,{board:'mechanical12',gesture:true,night,learned});assert.equal(await p.locator('#subtitle').textContent(),night===1?'若學獵人，今晚的開槍手勢':'今晚的開槍手勢');assert.equal((await p.locator('#gestureResult').textContent()).includes('可以開槍'),learned==='hunter');assert.equal(await p.locator('.seat:not(:disabled)').count(),0);pass(`MEC night${night} learned ${learned}: fixed subtitle and conditional gesture`);}
 await fixture(p,{board:'mechanical12',gesture:true,night:3,learned:'hunter',dead:true});assert.equal(await p.locator('#gestureResult').textContent(),'');assert.equal(await p.locator('#next').isDisabled(),false);pass('MEC dead learned hunter keeps subtitle, no gesture');
 await p.evaluate(()=>{localStorage.removeItem('eclipse-host-v1');sessionStorage.clear();});await p.goto(base);await p.locator('#start').click();await p.locator('#traditionalMode').click();await p.locator('[data-count="12"]').click();await p.locator('#boardsSpecial').click();await p.locator('[data-board="brothers12"]').click();await p.locator('.rules-form summary').click();assert.equal(await p.locator('#brothersRules').isVisible(),true);assert.equal(await p.locator('#ruleRevengeInvincible').inputValue(),'false');await p.locator('#ruleRevengeInvincible').selectOption('true');await p.locator('#setupStart').click();await p.reload();await p.locator('#rulesOpen').click();assert.match(await p.locator('#gameRules').textContent(),/狼弟的復仇刀是否為無敵刀：開啟/);await p.screenshot({path:new URL('brothers-rule.png',out).pathname.slice(1)});await p.locator('#rulesClose').click();pass('BRO setup OFF default, ON persists through refresh and rule summary');
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({base,passed:results.length,failed:0,results,errors,realDevice:'未驗收'},null,2));
}catch(e){await writeFile(new URL('failed.json',out),JSON.stringify({passed:results.length,error:String(e),stack:e.stack,results,errors},null,2));throw e;}finally{await browser.close();}
