import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {localConfig} from './local-env.mjs';
import jsQR from 'jsqr';
const count=Number(process.env.PLAYER_COUNT||10);
const c=localConfig(),base='http://127.0.0.1:5173/',out='../qa-online-20261020'+(count===12?'-12':'');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),contexts=[],checks=[],errors=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log('PASS',name);};
async function page(width=390,height=844){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});contexts.push(context);
 await context.route('**/online.js',route=>{
  let s=readFileSync('../public/online.js','utf8').replace("https://cnseutkrrjkdkpikjcdz.supabase.co",c.API_URL).replace('sb_publishable_Ss6qWldmmSVAuFgdqp1ooQ_v5ukr-n8',c.ANON_KEY);
  return route.fulfill({contentType:'application/javascript',body:s});
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());return p;
}
async function until(p,fn){await p.waitForFunction(fn,count,{timeout:20000});}
try{
 const h=await page();await h.goto(base);await h.locator('#start').click();
 await h.screenshot({path:out+'/01-mode.png'});
 await h.locator('#traditionalMode').click();await h.locator('[data-count="'+count+'"]').click();await h.locator('[data-board="'+count+'"]').click();await h.locator('#setupStart').click();
 check('Traditional hosting still enters original confirm',await h.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')).step==='confirm'));
 // New isolated browser host starts online mode; no existing game is overwritten by waiting.
 const host=await page();await host.goto(base);await host.locator('#start').click();await host.locator('#onlineMode').click();await host.locator('[data-count="'+count+'"]').click();await host.locator('[data-board="'+count+'"]').click();await host.locator('#setupStart').click();
 await until(host,n=>document.querySelectorAll('#onlineRing button').length===n&&document.querySelector('#onlineQR canvas').width===208);
 check('QR canvas contains rendered pixels',await host.evaluate(()=>document.querySelector('#onlineQR canvas').getContext('2d').getImageData(0,0,1,1).data[3]===255));
 const saved=await host.evaluate(()=>JSON.parse(localStorage.getItem('wolfcue-online-host-v1')));
 const invitation=base+'#room='+saved.roomId+'&invite='+saved.inviteToken;
 const pixels=await host.evaluate(()=>{const c=document.querySelector('#onlineQR canvas');return {width:c.width,height:c.height,data:Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data)};});
 check('Decorated 208px QR decodes exact invitation',jsQR(Uint8ClampedArray.from(pixels.data),pixels.width,pixels.height)?.data===invitation);
 await host.screenshot({path:out+'/02-host-room.png'});
 await host.locator('#onlineDeal').click();await until(host,()=>document.querySelector('#onlineNotice').textContent.includes('遊玩人數不足，無法發牌'));
 check('Insufficient players: clickable exact message',true);
 await host.reload();await until(host,n=>document.querySelectorAll('#onlineRing button').length===n);
 check('Host reload recovers same room',(await host.evaluate(()=>JSON.parse(localStorage.getItem('wolfcue-online-host-v1')).roomId))===saved.roomId);
 const players=[];
 for(let i=0;i<count;i++){
  const p=await page();players.push(p);await p.goto(invitation);
  await until(p,n=>document.querySelectorAll('#onlineRing button').length===n);
  if(i===0)await p.screenshot({path:out+'/03-player-select.png'});
  await p.locator('#onlineRing button').nth(i).click();
  await until(p,()=>!!document.querySelector('#onlineRing .mine'));
 }
 await until(host,n=>document.querySelector('#onlineCount').textContent.includes(n+' / '+n));
 await host.screenshot({path:out+'/04-host-full.png'});
 await host.locator('#onlineDeal').click();await until(host,()=>document.body.dataset.screen==='host');
 check('Dealt enters unchanged first-night confirm',await host.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')).step==='confirm'));
 const p=players[0];await until(p,()=>!document.querySelector('#onlineCard').hidden);
 check('Dealt player initially covered',!(await p.locator('#onlineCard').getAttribute('class')).includes('revealed'));
 await p.screenshot({path:out+'/05-player-card-back.png'});
 await p.locator('#onlineCard').click();await until(p,()=>document.querySelector('#onlineCard').classList.contains('revealed'));
 check('Own role revealed only after authenticated request',await p.locator('.online-card-front strong').textContent());
 await p.screenshot({path:out+'/06-synthetic-role.png'});
 await p.locator('#onlineLibrary').click();
 check('Library immediately clears visible role',await p.locator('.online-card-front strong').count()===0);
 await p.locator('#onlineBookBack').click();check('Returning from library remains covered',!(await p.locator('#onlineCard').getAttribute('class')).includes('revealed'));
 await p.reload();await until(p,()=>!document.querySelector('#onlineCard').hidden);check('Player refresh preserves seat but covers role',await p.locator('#onlineCardSeat').textContent()==='1 號玩家');
 await p.locator('#onlineCard').click();await until(p,()=>document.querySelector('#onlineCard').classList.contains('revealed'));
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 check('Privacy event immediately removes role DOM',await p.locator('.online-card-front strong').count()===0);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 for(const [w,ht]of [[320,568],[375,667],[390,844],[430,932],[844,390],[1024,768]]){
  await p.setViewportSize({width:w,height:ht});
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  check('No horizontal overflow '+w+'x'+ht,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const box=await p.locator('#onlineHome').boundingBox();check('Bottom action visible '+w+'x'+ht,box&&box.y>=0&&box.y+box.height<=ht+1);
 }
 await p.setViewportSize({width:390,height:844});
 // End via the authorized backend contract, not a fabricated engine victory.
 const end=await host.evaluate(async({api,key,room,dealId})=>{
  const s=JSON.parse(localStorage.getItem('wolfcue-online-auth'));
  const r=await fetch(api+'/functions/v1/room',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'end',roomId:room,body:{dealId}})});return r.status;
 },{api:c.API_URL,key:c.ANON_KEY,room:saved.roomId,dealId:await host.evaluate(()=>JSON.parse(localStorage.getItem('wolfcue-online-host-v1')).dealId)});
 check('Authorized terminal callback accepted',end===200);
 await until(p,()=>document.body.dataset.screen==='home');check('Terminal state covers and returns player home',true);
 check('No browser exceptions',errors.length===0);
}finally{
 writeFileSync(out+'/ui-results.json',JSON.stringify({checks,errors,environment:'desktop Edge with local real Supabase; NOT physical Safari/PWA'},null,2));
 await browser.close();
}
