import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const out=new URL(process.env.UI_OUT||'../../output/room-code-nightorder/',import.meta.url);await mkdir(out,{recursive:true});
const server=process.env.UI_BASE?null:spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'5408'},stdio:'pipe'});
if(server)await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[],errors=[];const pass=name=>{results.push(name);console.log(name);};
const base=process.env.UI_BASE||'http://127.0.0.1:5408/';
const room={roomId:'11111111-1111-4111-8111-111111111111',roomCode:'ABCDEF123456',joinCode:'A78B2',boardId:'12',capacity:12,status:'waiting',version:1,seats:Array.from({length:12},(_,i)=>({seat:i+1,occupied:false,mine:false}))};
async function open(width=390,height=844){
 const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
 await c.route('**/*.supabase.co/**',r=>r.abort());
 await c.route('**/online-vendor.js',r=>r.fulfill({contentType:'text/javascript',body:`export async function toCanvas(){};export function createClient(){return {auth:{getSession:async()=>({data:{session:{access_token:'fixture-only'}}})},realtime:{setAuth:async()=>{}},channel:()=>{const c={on:()=>c,subscribe:()=>c};return c},removeChannel:async()=>{}}}`}));
 const calls=[];let mode='ok';await c.route('**/functions/v1/room',async r=>{const body=r.request().postDataJSON();calls.push(body);await new Promise(r=>setTimeout(r,50));const data=body.action==='join_code'&&mode!=='ok'?{error:mode,message:mode==='RATE_LIMITED'?'嘗試次數較多，請稍後再試':'房間不存在或已關閉，請確認房號'}:{...room,...(['create','recover'].includes(body.action)?{inviteToken:'fixture-only-invite'}:{})};await r.fulfill({status:data.error?409:200,contentType:'application/json',body:JSON.stringify(data)});});
 const p=await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(String(e)));await p.goto(base,{waitUntil:'networkidle'});await p.locator('#start').waitFor();return {c,p,calls,mode:v=>mode=v};
}
async function fixture(p,{helpers=3,legacy=null}={}){
 await p.evaluate(async({helpers,legacy})=>{
  const {createGame}=await import('./engine.js'),{BOARDS}=await import('./data.js');const s=createGame(legacy?'mechanical12':'awakenedKingWitch12',{sheriff:false});let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;
  if(legacy){s.night=legacy==='mechanicalFirstGesture'?1:2;s.step=legacy;}
  else{s.night=3;s.step='akwDecision';s.akw.attempts=[{night:3,actor:5,target:9,helpers:[3,5,12].slice(0,helpers),verdict:null,ballots:null}];s.nightAction.akw={gift:null,giftSkip:false,helpers:[3,5,12].slice(0,helpers),proposal:0,verdict:null,ballots:null,draft:null,ballotUI:{mode:'batch',index:0}};}
  localStorage.setItem('eclipse-host-v1',JSON.stringify(s));sessionStorage.setItem('eclipse-host-v1-screen','host');
 },{helpers,legacy});await p.reload({waitUntil:'networkidle'});await p.locator('#host').waitFor();
}
try{
 for(const [width,height]of [[320,568],[390,844],[430,932],[844,390]]){
  const {c,p,calls,mode}=await open(width,height);
  assert.deepEqual(await p.locator('#home .menu button').allTextContents(),['開始主持','加入房間','角色圖鑑']);await p.screenshot({path:fileURLToPath(new URL(`home-${width}.png`,out))});
  await p.locator('#joinRoomOpen').click();await p.locator('#joinRoomCode').fill('I1234');await p.locator('#joinRoomDialog [type=submit]').click();assert.match(await p.locator('#joinRoomError').textContent(),/5 碼/);assert.equal(calls.length,0);
  await p.locator('#joinRoomCode').fill('a78b2');mode('ROOM_UNAVAILABLE');await p.locator('#joinRoomDialog [type=submit]').click();await p.getByText('房間不存在或已關閉，請確認房號',{exact:true}).waitFor();assert.ok(await p.locator('#joinRoomDialog').isVisible());
  mode('RATE_LIMITED');await p.locator('#joinRoomDialog [type=submit]').click();await p.getByText('嘗試次數較多，請稍後再試',{exact:true}).waitFor();
  mode('ok');await p.locator('#joinRoomCode').fill(' a78b2 ');await p.locator('#joinRoomDialog [type=submit]').click();await p.locator('#onlineRing button').first().waitFor();assert.equal(calls.filter(x=>x.action==='join_code').length,3);assert.equal(calls.at(-1).body.code,'A78B2');assert.equal(await p.locator('#joinRoomDialog').isVisible(),false);
  await p.reload({waitUntil:'networkidle'});await p.locator('#onlineRing button').first().waitFor();const rejoin=calls.findLast(x=>x.action==='join');assert.deepEqual(rejoin.body,{});assert.equal(rejoin.roomId,room.roomId);assert.equal(await p.locator('.online-card-front img').count(),0);
  pass(`Join ${width}x${height}: validation/errors/normalization/rejoin/privacy`);
  await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await p.goto(base);await p.locator('#joinRoomOpen').click();await p.screenshot({path:fileURLToPath(new URL(`join-${width}.png`,out))});await p.locator('#joinRoomDialog [data-cancel]').first().click();
  await fixture(p);await p.locator('#akwBallotOpen').click();assert.equal(await p.locator('#akwBallotDialog [data-mode]').count(),0);assert.equal(await p.locator('#akwBallotDialog [data-done]').isDisabled(),true);
  const dialogBox=await p.locator('#akwBallotDialog').boundingBox();if(height>600)assert.ok(dialogBox.height<600,'compact height');const helperBoxes=await p.locator('[data-helper]').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width}}));for(let i=1;i<helperBoxes.length;i++)if(helperBoxes[i].y===helperBoxes[i-1].y)assert.ok(helperBoxes[i].x-helperBoxes[i-1].x-helperBoxes[i-1].w>=9);
  const choices=p.locator('#akwBallotDialog [data-opinion]');const a=await choices.nth(0).boundingBox(),b=await choices.nth(1).boundingBox();assert.ok(b.x-a.x-a.width>=11,'opinion buttons have 12px separation');
  const done=await p.locator('#akwBallotDialog [data-done]').boundingBox(),abandon=await p.locator('#akwBallotDialog [data-abandon]').boundingBox();assert.ok(abandon.y-done.y-done.height>=11,'footer actions separated');assert.ok(abandon.y+abandon.height<=height,'footer fits viewport');
  await p.locator('[data-opinion="1"]').click();assert.equal(await p.locator('[data-helper="5"]').getAttribute('aria-pressed'),'true');await p.locator('[data-opinion="2"]').click();assert.equal(await p.locator('[data-helper="12"]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-close]').click();await p.reload({waitUntil:'networkidle'});await p.locator('#akwBallotOpen').click();assert.match(await p.locator('[data-helper="3"]').textContent(),/同意/);assert.match(await p.locator('[data-helper="5"]').textContent(),/不同意/);assert.equal(await p.locator('[data-helper="12"]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-opinion="1"]').click();assert.equal(await p.locator('[data-done]').isEnabled(),true);assert.ok(await p.locator('#akwBallotDialog').isVisible());
  await p.screenshot({path:fileURLToPath(new URL(`ballot-${width}.png`,out))});await p.locator('[data-helper="5"]').click();await p.locator('[data-opinion="1"]').click();await p.locator('[data-done]').click();
  let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));assert.equal(s.nightAction.akw.verdict,true);assert.equal(s.step,'akwDecision');assert.equal(s.akw.attempts[0].verdict,null);
  await p.locator('#akwBallotOpen').click();await p.locator('[data-abandon]').click();s=await p.evaluate(()=>JSON.parse(localStorage.getItem('eclipse-host-v1')));assert.equal(s.nightAction.akw.ballots,null);assert.equal(s.nightAction.akw.draft,null);
  pass(`Ballot ${width}x${height}: gaps, focus, automatic advance, draft/reload, edit, submit and abandon`);await c.close();
 }
 const {c,p}=await open();
 for(const helpers of [1,2]){await fixture(p,{helpers});await p.locator('#akwBallotOpen').click();assert.equal(await p.locator('[data-helper]').count(),helpers);await p.locator('[data-opinion="1"]').click();if(helpers===2){assert.equal(await p.locator('[data-done]').isDisabled(),true);await p.locator('[data-opinion="2"]').click();}assert.equal(await p.locator('[data-done]').isEnabled(),true);await p.locator('[data-close]').click();pass(`Ballot ${helpers} helpers`);}
 await fixture(p,{helpers:1});await p.locator('#akwBallotOpen').click();await p.locator('[data-opinion="1"]').click();
 await p.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('fixture quota failure');};});
 await p.locator('[data-done]').click();assert.ok(await p.locator('#akwBallotDialog').isVisible());assert.match(await p.locator('[data-notice]').textContent(),/儲存失敗/);
 await p.locator('[data-close]').click();assert.ok(await p.locator('#akwBallotDialog').isVisible());
 await p.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);await p.locator('[data-done]').click();assert.equal(await p.locator('#akwBallotDialog').isVisible(),false);pass('ballot storage failure blocks submit/close; retry succeeds');
 for(const legacy of ['mechanicalFirstGesture','mechanicalHunter','mechanicalHunterGesture','mechanicalHunterClose']){await fixture(p,{legacy});assert.equal(await p.locator('#subtitle').textContent(),legacy==='mechanicalFirstGesture'?'機械狼請閉眼':'獵人請閉眼');assert.equal(await p.locator('#gestureResult').textContent(),'');pass(`Legacy caption ${legacy} safely restored`);}
 await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await p.goto(base);await p.locator('#start').click();await p.locator('#traditionalMode').click();await p.locator('[data-count="12"]').click();await p.locator('#boardsSpecial').click();await p.locator('[data-board="awakenedKingWitch12"]').click();assert.equal(await p.locator('#setupOrder').textContent(),'守衛 → 狼人 → 覺醒黑狼王親傳 → 覺醒女巫 → 預言家 → 獵人 → 協助者集體表決 → 天亮');await p.screenshot({path:fileURLToPath(new URL('night-order.png',out))});pass('AKW setup order labels, no blank stages');
 await c.close();
 const host=await open();await host.p.locator('#start').click();await host.p.locator('#onlineMode').click();await host.p.locator('[data-count="12"]').click();await host.p.locator('[data-board="12"]').click();await host.p.locator('#setupStart').click();await host.p.locator('#onlineQR').waitFor();assert.equal(await host.p.locator('#onlineCode').textContent(),'房號 A78B2');
 await host.p.evaluate(()=>navigator.clipboard.writeText=async text=>{window.copiedInvite=text;});await host.p.locator('#onlineCopy').click();const copied=await host.p.evaluate(()=>window.copiedInvite);assert.match(copied,/#room=11111111-1111-4111-8111-111111111111&invite=fixture-only-invite$/);pass('host displays short code while copy preserves UUID invitation link');await host.c.close();assert.deepEqual(errors,[]);
}finally{await browser.close();server?.kill();await writeFile(new URL('results.json',out),JSON.stringify({environment:base+' headless Edge, mocked online transport',passed:results.length,results,errors},null,2));}
