import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {localConfig} from './local-env.mjs';
import pg from 'pg';
const live=process.env.CLOSURE_LIVE==='1',c=live?null:localConfig();
const base=live?'https://jia0796.github.io/wolf_Emcee/':'http://127.0.0.1:5173/';
const out=process.env.CLOSURE_OUT||'../docs/room-dissolve-evidence/'+(live?'live':'local'),count=live?10:12;
mkdirSync(out,{recursive:true});process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],checks=[],roomIds=[];
const db=c?new pg.Pool({connectionString:c.DB_URL}):null;let complete=false,host;
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);console.log('PASS',name);};
async function make(){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 if(c)await context.route('**/online.js',r=>r.fulfill({contentType:'application/javascript',body:readFileSync('../public/online.js','utf8').replace('https://cnseutkrrjkdkpikjcdz.supabase.co',c.API_URL).replace('sb_publishable_Ss6qWldmmSVAuFgdqp1ooQ_v5ukr-n8',c.ANON_KEY)}));
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());return p;
}
async function create(p,n){
 await p.locator('#start').click();await p.locator('#onlineMode').click();await p.locator('[data-count="'+n+'"]').click();await p.locator('[data-board="'+n+'"]').click();await p.locator('#setupStart').click();
 await p.waitForFunction(()=>!document.querySelector('#onlineQR').hidden&&document.querySelector('#onlineCode').textContent.startsWith('房號 '));
 const h=await p.evaluate(()=>JSON.parse(localStorage.getItem('wolfcue-online-host-v1')));roomIds.push(h.roomId);return {...h,link:base+'#room='+h.roomId+'&invite='+h.inviteToken};
}
async function join(p,r,seat){await p.goto('about:blank');await p.goto(r.link,{waitUntil:'domcontentloaded'});await p.locator('#onlineRing button[data-seat="'+seat+'"]').click();await p.waitForFunction(n=>document.querySelector('#onlineRing .mine')?.dataset.seat===String(n),seat);}
async function home(p){await p.waitForFunction(()=>document.body.dataset.screen==='home',{timeout:18000});}
async function deleted(id){if(db)for(const table of ['rooms','room_access','room_seats','room_secrets','deal_transactions','player_roles'])assert.equal((await db.query('select count(*)::int n from wolfcue_private.'+table+' where '+(table==='rooms'?'id':'room_id')+'=$1',[id])).rows[0].n,0,table);}
async function wiped(p,id){return p.evaluate(room=>{const u=new URL(location.href),invites=JSON.parse(localStorage.getItem('wolfcue-online-invites-v1')||'{}');return !u.searchParams.has('room')&&!u.hash&&!invites[room]&&document.querySelectorAll('.online-card-front img').length===0&&document.querySelector('#onlineCard').hidden;},id);}
try{
 host=await make();await host.goto(base,{waitUntil:'domcontentloaded'});
 const r=await create(host,10),p1=await make(),p2=await make();await join(p1,r,1);await join(p2,r,2);
 const duplicate=await p1.context().newPage();duplicate.on('pageerror',e=>errors.push(e.message));await duplicate.goto(r.link,{waitUntil:'domcontentloaded'});await duplicate.waitForFunction(()=>document.querySelector('#onlineRing .mine'));
 await p1.locator('#onlineLibrary').click();check('waiting player can remain in encyclopedia before dissolution',await p1.locator('#encyclopedia').isVisible());
 await host.locator('#onlineDissolve').click();await Promise.all([host,p1,p2,duplicate].map(home));await deleted(r.roomId);
 check('waiting dissolution removes room and returns every tab/library player home',true);
 check('closed player clears URL, invite and any role DOM',await wiped(p1,r.roomId)&&await wiped(duplicate,r.roomId));
 check('host clears only its room reference',await host.evaluate(()=>localStorage.getItem('wolfcue-online-host-v1')===null&&!!localStorage.getItem('wolfcue-online-auth')));
 await host.screenshot({path:out+'/waiting-host-home.png'});await p1.screenshot({path:out+'/waiting-player-home.png'});
 await p2.goto('about:blank');await p2.goto(r.link,{waitUntil:'domcontentloaded'});await home(p2);check('deleted invite cannot recreate or recover the room',await wiped(p2,r.roomId));await duplicate.close();
 const fresh=await create(host,count);check('same host can immediately create a new room after deletion',fresh.roomId!==r.roomId&&fresh.capacity===count);
 const players=[p1,p2];for(let i=2;i<count;i++)players.push(await make());for(let i=0;i<count;i++)await join(players[i],fresh,i+1);
 await host.waitForFunction(n=>document.querySelector('#onlineCount').textContent===`已入座 ${n} / ${n} 人`,count);await host.locator('#onlineDeal').click();await host.waitForFunction(()=>document.body.dataset.screen==='host');
 for(const p of players)await p.locator('#onlineCard').waitFor({state:'visible'});
 await p1.locator('#onlineCard').click();await p1.waitForFunction(()=>document.querySelector('#onlineCard').classList.contains('revealed'));
 check('dealt player can reveal own role before closure',true);await p1.screenshot({path:out+'/dealt-role-before-close.png'});await p2.locator('#onlineLibrary').click();
 const offline=players[2];await offline.context().setOffline(true);const game=await host.evaluate(()=>localStorage.getItem('eclipse-host-v1'));
 let mode='before',attempts=0;
 await host.route('**/functions/v1/room',async route=>{const body=route.request().postDataJSON();if(body.action!=='dissolve')return route.continue();attempts++;if(mode==='before')return route.abort();if(mode==='lost'){await route.fetch();return route.abort();}return route.continue();});
 await host.locator('#reset').click();await host.locator('#resetConfirm').click();await host.locator('#resetError').waitFor({state:'visible'});
 check('failed close retains exact game/history and host room reference',await host.evaluate(raw=>localStorage.getItem('eclipse-host-v1')===raw&&!!JSON.parse(localStorage.getItem('wolfcue-online-host-v1')).roomId,game));
 await host.screenshot({path:out+'/close-failure-retains-game.png'});
 mode='lost';await host.locator('#resetConfirm').click();await host.locator('#resetError').waitFor({state:'visible'});await deleted(fresh.roomId);
 check('lost successful close response retains host game until confirmation',await host.evaluate(raw=>localStorage.getItem('eclipse-host-v1')===raw,game));
 await Promise.all(players.filter(p=>p!==offline).map(home));
 check('dealt/revealed/library players all exit when server deletes room',await wiped(p1,fresh.roomId)&&await wiped(p2,fresh.roomId));
 await offline.context().setOffline(false);await offline.evaluate(()=>window.dispatchEvent(new Event('online')));await home(offline);
 check('offline player exits after reconnect even without terminal broadcast',await wiped(offline,fresh.roomId));
 mode='success';await host.locator('#resetConfirm').click();await home(host);
 check('idempotent retry confirms missing room and clears original game once',attempts===3&&await host.evaluate(()=>!localStorage.getItem('eclipse-host-v1')&&!localStorage.getItem('wolfcue-online-host-v1')));
 await host.unroute('**/functions/v1/room');await p1.screenshot({path:out+'/dealt-player-home.png'});
 await host.reload({waitUntil:'domcontentloaded'});await home(host);check('host reload cannot recover deleted room or cleared game',true);
 await p1.reload({waitUntil:'domcontentloaded'});await home(p1);check('player reload cannot return to deleted room',await wiped(p1,fresh.roomId));
 const next=await create(host,10);check('post-deal closure no longer blocks new room creation',next.roomId!==fresh.roomId);
 await host.locator('#onlineDissolve').click();await home(host);await deleted(next.roomId);
 check('all synthetic rooms removed at test completion',true);check('no uncaught browser exceptions',errors.length===0);complete=true;
}finally{await db?.end();await browser.close();writeFileSync(out+'/results.json',JSON.stringify({base,complete,passed:checks.length,checks,errors,roomIds,environment:'Desktop Edge; physical Safari/PWA not tested'},null,2));}
