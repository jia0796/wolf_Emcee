import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ROLE_DATA} from '../public/data.js';
import {CATALOG_CLEAR} from '../public/catalog-art.js';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE||'http://127.0.0.1:5388/';
const output=new URL(process.env.UI_OUTPUT||'../docs/online-card-art-evidence/local/',import.meta.url);await mkdir(output,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:'5388'},stdio:'pipe'});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited: '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const room={roomId:'11111111-1111-4111-8111-111111111111',boardId:'12',capacity:12,status:'dealt',version:2,seats:Array.from({length:12},(_,i)=>({seat:i+1,occupied:true,mine:i===0,lease:'synthetic-lease-'+i}))};
async function screen(width){
 const c=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});let role='seer',rejectRole=false;
 await c.route('**/*.supabase.co/**',r=>r.abort());
 await c.route('**/online-vendor.js',r=>r.fulfill({contentType:'text/javascript',body:`export function toCanvas(){};export function createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:'synthetic-test-only'}}})},realtime:{setAuth:async()=>{}},channel:()=>{const c={on:()=>c,subscribe:()=>c};return c},removeChannel:async()=>{}}}`}));
 await c.route('**/functions/v1/room',async r=>{const req=r.request().postDataJSON(),denied=rejectRole&&req.action==='my_role';await r.fulfill({status:denied?403:200,contentType:'application/json',body:JSON.stringify(denied?{error:'FORBIDDEN',message:'測試：角色權限未確認'}:req.action==='my_role'?{roomId:room.roomId,status:'dealt',role}:room)});});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.setDefaultNavigationTimeout(90000);
 await p.goto(base+'#room='+room.roomId+'&invite=synthetic-preview',{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');
 await p.locator('#onlineCard').waitFor({state:'visible'});return {c,p,setRole:r=>role=r,deny:()=>rejectRole=true};
}
const save=(p,name)=>p.screenshot({path:fileURLToPath(new URL(name+'.png',output)),animations:'disabled'});
async function reveal(p,role){
 const card=p.locator('#onlineCard');await card.click();await p.waitForFunction(()=>document.querySelector('#onlineCard').classList.contains('revealed'));
 const img=card.locator('.online-card-front img');await img.evaluate(i=>i.decode());assert.equal(await img.getAttribute('src'),CATALOG_CLEAR[role]);assert.equal(await img.getAttribute('alt'),ROLE_DATA[role].name);
 assert.equal(await card.locator('.online-card-front strong').textContent(),ROLE_DATA[role].name);
 const style=await card.locator('.online-card-front').evaluate(e=>{const s=getComputedStyle(e),img=e.querySelector('img'),r=img.getBoundingClientRect();return {border:s.borderTopWidth,radius:s.borderRadius,background:s.backgroundImage,fit:getComputedStyle(img).objectFit,ratio:r.height/e.clientHeight};});
 assert.equal(style.border,'1px');assert.equal(style.radius,'18px');assert.ok(style.background.includes('linear-gradient'));assert.equal(style.fit,'contain');assert.ok(Math.abs(style.ratio-.9)<.01);await p.waitForTimeout(360);
}
async function cover(p){await p.locator('#onlineCard').click();assert.equal(await p.locator('.online-card-front').getAttribute('aria-hidden'),'true');assert.equal(await p.locator('.online-card-front').locator('*').count(),0);}
try{
 for(const width of [390,320,430]){
  const {c,p,setRole,deny}=await screen(width);if(width===390){await p.locator('.online-card-back img').evaluate(i=>i.decode());await save(p,'back-screen');await p.locator('#onlineCard').screenshot({path:fileURLToPath(new URL('back.png',output))});}
  for(const role of width===390?Object.keys(ROLE_DATA):['seer']){setRole(role);await reveal(p,role);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width===390&&['seer','wolf','villager'].includes(role)){await save(p,role+'-screen');await p.locator('#onlineCard').screenshot({path:fileURLToPath(new URL(role+'.png',output))});}
   await cover(p);results.push({width,role,approvedImage:true,originalFrameAndTitle:true,coverClearsRole:true});}
  deny();await p.locator('#onlineCard').click();await p.getByText('測試：角色權限未確認',{exact:true}).waitFor();assert.equal(await p.locator('.online-card-front').locator('*').count(),0);assert.equal(await p.locator('#onlineCard').getAttribute('aria-label'),'點擊翻牌');results.push({width,unconfirmedRoleRemainsCovered:true});await c.close();
 }
 const {c,p}=await screen(390);await c.route('**/art/catalog-clear/seer-v1.png',r=>r.abort());await p.locator('#onlineCard').click();await p.waitForFunction(()=>document.querySelector('.online-card-front img')?.getAttribute('src')?.startsWith('art/catalog/'));await p.locator('.online-card-front img').evaluate(i=>i.decode());assert.equal(await p.locator('.online-card-front img').getAttribute('src'),ROLE_DATA.seer.image);results.push({failedDerivativeFallsBack:true});await c.close();
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',output),JSON.stringify({base,passed:results.length,failed:0,errors,backend:'Synthetic API/Auth/Realtime adapter; no cloud writes or real multiplayer claim',results},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
}catch(error){await writeFile(new URL('failure.json',output),JSON.stringify({completed:results.length,error:String(error),errors,results},null,2));throw error;}finally{await browser.close();server?.kill();}
