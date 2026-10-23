import {createClient,toCanvas} from './online-vendor.js';
import {catalogImage,catalogFallback} from './catalog-art.js';
import {BOARDS,ROLE_DATA} from './data.js';
const URL='https://cnseutkrrjkdkpikjcdz.supabase.co';
const KEY='sb_publishable_Ss6qWldmmSVAuFgdqp1ooQ_v5ukr-n8';
const HOST='wolfcue-online-host-v1',INVITES='wolfcue-online-invites-v1',END='wolfcue-online-end-v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const client=createClient(URL,KEY,{auth:{storageKey:'wolfcue-online-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const closed=s=>['ended','expired','dissolved'].includes(s);
export function installOnline({show,onHostReady,onHome,onLibrary,onLibraryClose}){
 let room=null,state=null,isHost=false,busy=false,channel=null,interval=null,seq=0,roleTicket=0,animating=false,library=false,active=false,starting=false,refreshing=false,refreshAgain=false,pendingSeat=null;
 const root=document.createElement('section');root.id='online';root.className='screen online-screen';root.hidden=true;
 root.innerHTML='<header class="online-head"><h1 id="onlineTitle">線上發牌（Beta版）</h1><button id="onlineLibrary">圖鑑</button><button id="onlineDissolve" hidden>解散房間</button></header><p id="onlineNotice" role="status" aria-live="polite"></p><div id="onlineScroll" class="online-scroll"><div id="onlineQR" hidden><div class="online-qr-frame"><canvas aria-label="房間邀請 QR Code"></canvas></div><div class="online-qr-info"><p id="onlineCode"></p><button id="onlineCopy">複製連結</button></div></div><p id="onlineCount"></p><div id="onlineRing" class="online-ring" aria-label="選擇座位"></div><button id="onlineCard" class="online-card" hidden aria-label="點擊翻牌"><span class="online-card-inner"><span class="online-card-back"><span class="online-moons" aria-hidden="true"><i></i><i></i><i></i></span><img src="wolfcue-mark.svg" alt="WolfCue 狼序"><strong>WolfCue 狼序</strong><strong id="onlineCardSeat"></strong><span>點擊翻牌</span></span><span class="online-card-front" aria-hidden="true"></span></span></button></div><footer class="online-footer"><button id="onlineDeal" class="primary" hidden>開始發牌</button><button id="onlineLeave" hidden>離開座位</button><button id="onlineHome">回首頁</button></footer>';
 document.querySelector('main').append(root);
 const $=id=>document.getElementById(id),notice=t=>{$('onlineNotice').textContent=t;};
 const cover=()=>{
  roleTicket++;animating=false;
  $('onlineCard').classList.remove('revealed');
  $('onlineCard').classList.add('privacy-covered');
  $('onlineCard').setAttribute('aria-label','點擊翻牌');
  $('onlineCard').querySelector('.online-card-front').replaceChildren();
  $('onlineCard').querySelector('.online-card-front').setAttribute('aria-hidden','true');
 };
 async function auth(){
  const run=async()=>{let {data:{session}}=await client.auth.getSession();if(!session){const r=await client.auth.signInAnonymously();if(r.error)throw Error('登入失敗，請檢查網路後重試');session=r.data.session;}return session;};
  return navigator.locks?navigator.locks.request('wolfcue-online-auth',run):run();
 }
 async function api(action,body={},roomId=room){
  const session=await auth();
  const r=await fetch(URL+'/functions/v1/room',{method:'POST',cache:'no-store',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,roomId,body})});
  const data=await r.json();if(!r.ok||data.error){const error=Error(data.message||({ROOM_FULL:'房間人數已滿，無法加入',NOT_FULL:'遊玩人數不足，無法發牌'}[data.error])||'操作未確認，請重新同步後再試');error.code=data.error;throw error;}
  return data;
 }
 function leaveView(){cover();active=false;++seq;clearInterval(interval);if(channel)client.removeChannel(channel);channel=null;library=false;}
 function home(){leaveView();onHome();}
 function forgetRoom(id){
  try{
   if(read(HOST)?.roomId===id)localStorage.removeItem(HOST);
   if(read(END)?.roomId===id)localStorage.removeItem(END);
   const invites=read(INVITES);if(invites&&Object.hasOwn(invites,id)){delete invites[id];save(INVITES,invites);}
  }catch{/* Storage failure must not keep an already closed role card visible. */}
  const url=new globalThis.URL(location.href),hash=new URLSearchParams(url.hash.slice(1));
  if(url.searchParams.get('room')===id){url.searchParams.delete('room');url.searchParams.delete('invite');}
  if(hash.get('room')===id)url.hash='';
  if(url.href!==location.href)history.replaceState(null,'',url);
 }
 function exitRoom(id=room){
  if(room&&id!==room){forgetRoom(id);return;}
  if(library)onLibraryClose?.();
  leaveView();forgetRoom(id);room=null;state=null;isHost=false;pendingSeat=null;
  for(const name of ['onlineCard','onlineQR','onlineDissolve','onlineDeal','onlineLeave'])$(name).hidden=true;
  $('onlineRing').replaceChildren();$('onlineCount').textContent='';$('onlineCode').textContent='';$('onlineCardSeat').textContent='';
  const canvas=document.querySelector('#onlineQR canvas');canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
  $('onlineTitle').textContent='線上發牌（Beta版）';notice('');onHome();
 }
 function unavailable(error,id=room){if(error.code!=='ROOM_UNAVAILABLE')return false;exitRoom(id);return true;}
 async function refresh(){
  if(!active||document.hidden||busy)return;
  if(refreshing){refreshAgain=true;return;}
  refreshing=true;
  const n=++seq;
  try{const s=await api('state');if(n===seq&&active){await apply(s);}}
  catch(e){if(n===seq&&active&&!unavailable(e)){cover();notice('連線中斷，正在重新同步…');}}
  finally{refreshing=false;if(refreshAgain){refreshAgain=false;queueMicrotask(refresh);}}
 }
 async function subscribe(){
  clearInterval(interval);if(channel)await client.removeChannel(channel);
  const session=await auth();await client.realtime.setAuth(session.access_token);
  channel=client.channel('wolfcue:'+room,{config:{private:true}}).on('broadcast',{event:'changed'},e=>{
   if(active&&e.payload?.roomId===room&&closed(e.payload.status))exitRoom();else refresh();
  })
   .subscribe(s=>{if(!active)return;if(s==='SUBSCRIBED')refresh();else if(['CHANNEL_ERROR','TIMED_OUT'].includes(s)){cover();notice('正在重新同步…');}});
  interval=setInterval(refresh,8000);
 }
 function link(s){const u=new globalThis.URL(location.href);u.search='';u.hash='room='+s.roomId+'&invite='+s.inviteToken;return u.href;}
 async function apply(s){
  if(!active||!room||s?.roomId!==room)return;
  if(s?.roomId===room&&closed(s.status)){exitRoom();return;}
  if(state?.roomId===s.roomId&&s.version<state.version)return;
  const prior=state;state=s;
  if(s.status==='dealt'&&isHost){
   if(starting)return;starting=true;if(library){onLibraryClose?.();library=false;}
   try{const h=read(HOST);if(!h||h.roomId!==s.roomId)throw Error('房間恢復資料不存在');
    await onHostReady(h,s);h.dealId=s.dealId;h.started=true;save(HOST,h);leaveView();
   }catch(e){notice(e.message);}finally{starting=false;}return;
  }
  if(s.status==='dealt'&&prior?.status!=='dealt'){if(library){onLibraryClose?.();show('online');}library=false;cover();notice('正在發牌…');}
  const oldSeat=prior?.seats?.find(x=>x.mine),mine=s.seats?.find(x=>x.mine);
  if(oldSeat&&(!mine||mine.lease!==oldSeat.lease)){cover();notice(mine?'座位已更新':'座位已被清除，請重新選座');}
  paint();if(s.status==='dealt')notice('');
 }
 function paint(){
  if(!state)return;
  const b=BOARDS[state.boardId],mine=state.seats.find(s=>s.mine),dealt=state.status==='dealt';
  $('onlineTitle').textContent=b?.name||'線上發牌（Beta版）';
  $('onlineLibrary').hidden=false;
  $('onlineDissolve').hidden=!isHost||dealt;
  $('onlineQR').hidden=!isHost||dealt||library;
  $('onlineRing').hidden=dealt||library;
  $('onlineCount').hidden=dealt||library;
  $('onlineCard').hidden=isHost||!dealt||library||!mine;
  $('onlineHome').hidden=isHost;
  $('onlineLeave').hidden=isHost||dealt||!mine||library;
  $('onlineDeal').hidden=!isHost||dealt;
  $('onlineDeal').textContent=busy?'發牌中…':'開始發牌';
  $('onlineDeal').disabled=busy;
  $('onlineDeal').classList.toggle('not-full',state.seats.filter(s=>s.occupied).length<state.capacity);
  $('onlineCount').textContent=`已入座 ${state.seats.filter(s=>s.occupied).length} / ${state.capacity} 人`;
  if(mine)$('onlineCardSeat').textContent=`${mine.seat} 號玩家`;
  const ring=$('onlineRing');
  if(ring.children.length!==state.capacity){
   ring.replaceChildren();
   for(let seat=1;seat<=state.capacity;seat++){
    const e=document.createElement('button'),a=(seat-1)*2*Math.PI/state.capacity;
    e.dataset.seat=seat;e.style.left=(50+40*Math.sin(a))+'%';e.style.top=(50-40*Math.cos(a))+'%';
    const number=document.createElement('strong'),label=document.createElement('small');number.textContent=String(seat).padStart(2,'0');e.append(number,label);
    e.onclick=()=>{const target=state.seats.find(s=>s.seat===seat),own=state.seats.find(s=>s.mine);mutate(isHost?'clear':'seat',isHost?{seat,lease:target.lease}:{seat,...(own?{lease:own.lease}:{})},isHost?`清除 ${seat} 號座位？`:null);};
    ring.append(e);
   }
  }
  for(const s of state.seats){
   const e=ring.children[s.seat-1],label=e.querySelector('small');
   const text=pendingSeat===s.seat?'確認中…':s.mine?'自己 ✓':s.occupied?'已入座':'空位';
   if(label.textContent!==text)label.textContent=text;
   e.setAttribute('aria-label',`${s.seat}號，${label.textContent}`);
   e.className=s.mine?'mine':s.occupied?'occupied':'';
   e.classList.toggle('pending',pendingSeat===s.seat);
   e.disabled=busy||dealt||(!isHost&&s.occupied)|| (isHost&&!s.occupied);
  }
 }
 async function mutate(action,body={},confirmation=null){
  if(busy)return;if(confirmation&&!confirm(confirmation))return;
  busy=true;pendingSeat=action==='seat'||action==='clear'?body.seat:null;++seq;cover();paint();
  try{const s=await api(action,body);notice('');await apply(s);}
  catch(e){if(unavailable(e))return;notice(e.message);try{await apply(await api('state'));}catch(error){if(!unavailable(error))cover();}}
  finally{busy=false;pendingSeat=null;paint();}
 }
 $('onlineDeal').onclick=()=>{const h=read(HOST);if(h)mutate('deal',{requestId:h.dealRequest});};
 $('onlineLeave').onclick=()=>{const mine=state?.seats.find(s=>s.mine);if(mine)mutate('leave',{lease:mine.lease},'離開目前座位？');};
 $('onlineDissolve').onclick=()=>mutate('dissolve',{},'解散房間並回首頁？');
 $('onlineHome').onclick=()=>{if(confirm('回首頁？角色卡會蓋牌；可用原連結再次進入。'))home();};
 $('onlineCopy').onclick=async()=>{try{await navigator.clipboard.writeText(link(read(HOST)));notice('連結已複製');}catch{notice('無法複製，請掃描 QR Code');}};
 $('onlineLibrary').onclick=()=>{
  if(!state)return;cover();library=true;paint();onLibrary(state.boardId);
 };
 $('onlineCard').onclick=async()=>{
  if(animating||busy||document.hidden)return;
  if($('onlineCard').classList.contains('revealed')){cover();return;}
  cover();const ticket=roleTicket;animating=true;
  try{
   const mine=state?.seats.find(s=>s.mine);if(!mine)return;
   const data=await api('my_role',{lease:mine.lease});
   if(ticket!==roleTicket||document.hidden||library||!active)return;
   if(data.roomId===room&&closed(data.status)){exitRoom();return;}
   const role=ROLE_DATA[data.role];if(!role)throw Error('角色資料尚未同步');
   const img=document.createElement('img'),title=document.createElement('strong');catalogFallback(img,role.image);img.src=catalogImage(data.role,role.image);img.alt=role.name;title.textContent=role.name;title.className=role.kind;
   const front=$('onlineCard').querySelector('.online-card-front');front.replaceChildren(img,title);front.setAttribute('aria-hidden','false');
   $('onlineCard').classList.remove('privacy-covered');$('onlineCard').classList.add('revealed');$('onlineCard').setAttribute('aria-label','點擊蓋牌');
   setTimeout(()=>{if(ticket===roleTicket)animating=false;},350);
  }catch(e){cover();if(!unavailable(e))notice(e.message);}
 };
 async function host(config){
  leaveView();isHost=true;active=true;state=null;room=null;show('online');notice('正在建立房間…');
  let h=read(HOST);if(!h||h.started){h={boardId:config.boardId,rules:config.rules,requestId:crypto.randomUUID(),dealRequest:crypto.randomUUID()};save(HOST,h);}
  try{
   const s=await api(h.roomId?'recover':'create',h.roomId?{}:{boardId:h.boardId,requestId:h.requestId},h.roomId||null);
   room=s.roomId;h={...h,...s};save(HOST,h);notice('');await apply(s);
   if(active){$('onlineCode').textContent='房號 '+s.roomCode;const canvas=document.querySelector('#onlineQR canvas');await toCanvas(canvas,link(h),{scale:4,margin:4});canvas.style.removeProperty('width');canvas.style.removeProperty('height');canvas.style.setProperty('--online-qr-size',(canvas.width/2)+'px');await subscribe();}
  }catch(e){if(unavailable(e,h?.roomId))return;notice(e.message);const retry=document.createElement('button');retry.textContent='重新連線';retry.onclick=()=>host(config);$('onlineNotice').append(retry);}
 }
 async function player(id,invite){
  leaveView();isHost=false;active=true;state=null;room=id;show('online');notice('正在加入房間…');
  $('onlineHome').hidden=false;$('onlineLibrary').hidden=false;
  try{
   const invites=read(INVITES)||{};if(invite){invites[id]=invite;save(INVITES,invites);}
   const s=await api('join',{inviteToken:invite||invites[id]||''});notice('');await apply(s);if(active)await subscribe();
  }catch(e){if(unavailable(e,id))return;cover();notice(e.message);$('onlineRing').replaceChildren();$('onlineCard').hidden=true;
   if(!e.message.includes('房間人數已滿'))setTimeout(()=>{if(active&&!state&&room===id)player(id,invite);},8000);
  }
 }
 async function end(game){
  const h=read(HOST);if(game?.step==='finished'&&h?.started&&h.dealId){save(END,{roomId:h.roomId,dealId:h.dealId});}
  const pending=read(END);if(!pending||end.running)return;end.running=true;
  try{await api('end',{dealId:pending.dealId},pending.roomId);localStorage.removeItem(END);if(read(HOST)?.roomId===pending.roomId)localStorage.removeItem(HOST);}
  catch{/* Retain pending terminal notification for next connectivity event. */}finally{end.running=false;}
 }
 async function dissolve(){
  const h=read(HOST)||(isHost&&room?{roomId:room}:null);if(!h?.roomId)return;
  const result=await api('dissolve',{},h.roomId);
  if(result.roomId!==h.roomId||!closed(result.status)||!result.deleted)throw Error('房間刪除尚未確認，請重試');
  forgetRoom(h.roomId);if(room===h.roomId)exitRoom(h.roomId);
 }
 document.addEventListener('visibilitychange',()=>{cover();++seq;if(!document.hidden){refresh();end();}});
 window.addEventListener('online',()=>{refresh();end();});window.addEventListener('pagehide',cover);
 window.addEventListener('storage',e=>{if(e.key==='wolfcue-online-auth'){cover();refresh();}});
 return {host,end,dissolve,closeLibrary(){library=false;cover();paint();show('online');refresh();},detach(){const h=read(HOST);if(h?.started)localStorage.removeItem(HOST);},async resume(){
  const hash=new URLSearchParams(location.hash.slice(1)),u=new globalThis.URL(location.href),id=hash.get('room')||u.searchParams.get('room');
  if(id){const invite=hash.get('invite');u.hash='';u.searchParams.set('room',id);history.replaceState(null,'',u);await player(id,invite);return true;}
  const h=read(HOST);if(h&&!h.started){await host(h);return true;}end();return false;
 }};
}
