import {PAGE_BACKGROUNDS,HOST_BACKGROUNDS} from './data.js';

// HOST-02: transient view of the existing timer, with no timer/save state of its own.
export function createMiniTimer({read,pause,reset,restore}){
 const root=document.createElement('div');root.id='miniTimer';root.className='mini-timer';root.hidden=true;root.setAttribute('role','group');root.setAttribute('aria-label','縮小發言計時器，長按拖曳');
 const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
 root.innerHTML='<span class="mini-time">'+svg('M9 2h6M12 2v3M18 5l2-2M12 9v5l3 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0')+'<strong id="miniTimerDigits">01:00</strong></span>';
 const button=(id,label,path,handler)=>{const b=document.createElement('button');b.type='button';b.id=id;b.setAttribute('aria-label',label);b.innerHTML=svg(path);b.onclick=handler;root.append(b);return b;};
 const toggle=button('miniTimerPause','暫停計時器','M9 5v14M15 5v14',pause);
 button('miniTimerReset','重置回原設定時長','M4 10a8 8 0 1 1 0 6M4 4v6h6',reset);
 const expand=button('miniTimerExpand','還原完整計時器','M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',()=>open());
 const safe=document.createElement('span');safe.className='mini-safe-probe';safe.inert=true;document.body.append(root,safe);
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let owner=null,mini=false,position=null,screen=null,prior=null,drag=null,hold=null,animation=null;
 function bounds(){
  const v=window.visualViewport,c=getComputedStyle(safe),b={left:(v?.offsetLeft||0)+parseFloat(c.paddingLeft)+8,top:(v?.offsetTop||0)+parseFloat(c.paddingTop)+8,right:(v?.offsetLeft||0)+(v?.width||innerWidth)-parseFloat(c.paddingRight)-8,bottom:(v?.offsetTop||0)+(v?.height||innerHeight)-parseFloat(c.paddingBottom)-8};
  // Keep the tools and original next/back hit areas reachable after a drag/rotation too.
  const tools=document.querySelector('#host footer').getBoundingClientRect();if(tools.width&&tools.top>=b.top+root.offsetHeight+8)b.bottom=Math.min(b.bottom,tools.top-8);return b;
 }
 function place(initial=false){
  if(root.hidden)return;const b=bounds();root.style.maxWidth=Math.max(0,b.right-b.left)+'px';const r={width:root.offsetWidth,height:root.offsetHeight};
  if(initial||!position){const footer=document.querySelector('#host footer').getBoundingClientRect();position={x:(b.left+b.right-r.width)/2,y:Math.min(b.bottom,footer.top-8)-r.height};}
  position={x:Math.max(b.left,Math.min(position.x,b.right-r.width)),y:Math.max(b.top,Math.min(position.y,b.bottom-r.height))};
  root.style.left=position.x+'px';root.style.top=position.y+'px';
 }
 function enter(node){animation?.cancel();if(!motion.matches)animation=node.animate([{opacity:.3,transform:'translateY(5px) scale(.97)'},{opacity:1,transform:'none'}],{duration:200,easing:'ease-out'});}
 function end(){clearTimeout(hold);hold=null;const priorDrag=drag;drag=null;if(priorDrag?.active&&root.hasPointerCapture(priorDrag.id))root.releasePointerCapture(priorDrag.id);root.classList.remove('dragging');}
 function open(){if(!mini)return;end();mini=false;root.hidden=true;restore();enter(document.getElementById('timerDialog'));document.getElementById(read().mode==='countdown'?'timerMinimize':'timerStart').focus({preventScroll:true});}
 root.addEventListener('pointerdown',e=>{
  if(e.target.closest('button')||!e.isPrimary||e.button!==0)return;end();drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:position&&{...position},active:false};
  hold=setTimeout(()=>{if(!drag)return;drag.active=true;root.setPointerCapture(drag.id);root.classList.add('dragging');},200);
 });
 root.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active){if(Math.hypot(dx,dy)>8)end();return;}e.preventDefault();position={x:drag.start.x+dx,y:drag.start.y+dy};place();});
 root.addEventListener('touchmove',e=>{if(drag?.active&&e.touches.length===1)e.preventDefault();},{passive:false});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,end);
 const resize=()=>{if(drag)end();place();};window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);new ResizeObserver(()=>place()).observe(root);
 return {
  sync(nextScreen,nextOwner){if(owner!==nextOwner){end();owner=nextOwner;mini=false;position=null;prior=null;}screen=nextScreen;root.hidden=!mini||screen!=='host';if(!root.hidden)place();},
  minimize(){if(read().mode!=='countdown')return;mini=true;document.getElementById('timerDialog').close();root.hidden=screen!=='host';place();enter(root);expand.focus({preventScroll:true});},
  restore:open,
  paint(state){
   document.getElementById('timerMinimize').hidden=state.mode!=='countdown';document.getElementById('miniTimerDigits').textContent=String(Math.floor(state.seconds/60)).padStart(2,'0')+':'+String(state.seconds%60).padStart(2,'0');
   toggle.setAttribute('aria-label',state.running?'暫停計時器':'繼續計時器');toggle.innerHTML=svg(state.running?'M9 5v14M15 5v14':'M8 4l12 8-12 8Z');toggle.disabled=state.mode!=='countdown'||state.seconds===0;
   if(mini&&state.mode==='countdown'&&state.seconds===0&&prior?.seconds>0&&!motion.matches&&!root.hidden)root.animate([{boxShadow:'0 0 0 1px #B2DBE570'},{boxShadow:'0 0 18px 3px #B2DBE5b0'},{boxShadow:'0 0 0 1px #B2DBE570'}],{duration:900,easing:'ease-in-out'});
   prior=state;
  },
  get minimized(){return mini;}
 };
}

// Presentation state only: never receives or writes a game/save/history object.
export function backgroundSource(screen,phase){
 return screen==='online'?'art/backgrounds/online-plaza-v3.png':screen==='host'?HOST_BACKGROUNDS[phase==='夜晚'?'night':'day']:PAGE_BACKGROUNDS[screen];
}
export function hostPresentation(phase,step,night){
 const preparing=step==='confirm';return {phase:preparing?'白天':phase,label:'第'+night+'天・'+(preparing?'準備階段':phase),preparing};
}
export function createB3Backdrop(){
 const root=document.createElement('div');root.className='b3-backdrop';root.setAttribute('aria-hidden','true');
 const layers=[0,1].map(()=>{const e=document.createElement('div');e.className='b3-scene';root.append(e);return e;});document.body.prepend(root);
 const loaded=new Map(),pending=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let screen=null,phase=null,wanted=null,current=null,index=0,epoch=0,animation=null,quiet=true,lastStep=null;
 function cancel(){animation?.cancel();animation=null;}
 function clearScene(){cancel();for(const e of layers){e.style.opacity='0';e.style.removeProperty('--b3-image');delete e.dataset.source;}current=null;delete root.dataset.source;}
 function load(src,priority='low'){
  if(loaded.has(src))return Promise.resolve(true);if(pending.has(src))return pending.get(src);
  const task=new Promise(resolve=>{const image=new Image();image.fetchPriority=priority;image.onload=async()=>{try{await image.decode();}catch{}loaded.set(src,image);resolve(true);};image.onerror=()=>resolve(false);image.src=src;});
  pending.set(src,task);task.finally(()=>pending.delete(src));return task;
 }
 function paint(src,animate){
  if(src===current)return;cancel();const outgoing=layers[index];index=1-index;const incoming=layers[index];
  incoming.style.setProperty('--b3-image',`url('${src}')`);incoming.dataset.source=src;incoming.style.opacity='1';incoming.style.zIndex='1';outgoing.style.zIndex='0';current=src;root.dataset.source=src;
  if(animate&&!motion.matches){const running=incoming.animate([{opacity:0},{opacity:1}],{duration:1000,easing:'ease-in-out'});animation=running;running.finished.then(()=>{if(animation===running){outgoing.style.opacity='0';animation=null;}}).catch(()=>{});}
  else outgoing.style.opacity='0';
 }
 function setScreen(next,nextPhase,{preparing=false}={}){
  const firstLobby=screen===null&&next==='home';
  if(firstLobby)document.body.dataset.lobbyManaged='true';
  const transition=screen==='host'&&next==='host'&&phase!==nextPhase&&!quiet&&!document.hidden;
  quiet=false;if(screen!==next)lastStep=null;screen=next;phase=nextPhase;wanted=backgroundSource(next,nextPhase);const ticket=++epoch;
  // A fresh/restored confirm screen must never retain a previously painted night.
  if((next==='online'&&current!==wanted)||(preparing&&current===HOST_BACKGROUNDS.night&&!loaded.has(wanted)))clearScene();
  document.body.dataset.b3Phase=next==='host'?(nextPhase==='夜晚'?'night':'day'):'lobby';
  // Online entry uses its neutral canvas while loading, never the prior scene.
  // Other screens retain the existing fallback and host day/night transitions.
  if(loaded.has(wanted))paint(wanted,transition);
  else load(wanted,'high').then(ok=>{if(ok&&ticket===epoch)paint(wanted,transition||firstLobby);});
 }
 function script(step){
  const title=document.getElementById('subtitle');if(lastStep===step)return;
  const prior=lastStep;lastStep=step;title.getAnimations().forEach(a=>a.cancel());
  if(prior&&['dark','dawn'].includes(step)&&!motion.matches&&!document.hidden)title.animate([{opacity:.45,filter:'blur(2px)'},{opacity:1,filter:'blur(0px)'}],{duration:1000,easing:'ease-out'});
 }
 function resume(){quiet=true;cancel();layers.forEach((e,i)=>e.style.opacity=current&&i===index?'1':'0');document.getElementById('subtitle')?.getAnimations().forEach(a=>a.cancel());}
 document.addEventListener('visibilitychange',resume);window.addEventListener('pageshow',resume);motion.addEventListener('change',resume);
 window.addEventListener('online',()=>{const src=wanted,ticket=epoch;if(src&&!loaded.has(src))load(src,'high').then(ok=>{if(ok&&ticket===epoch)paint(src,screen==='home');});});
 // Lobby starts first; silent host preparation remains optional and never gates show().
 load(PAGE_BACKGROUNDS.home,'high').then(()=>{const prepare=()=>load(HOST_BACKGROUNDS.day).then(()=>load(HOST_BACKGROUNDS.night));if('requestIdleCallback'in window)requestIdleCallback(prepare,{timeout:2000});else setTimeout(prepare,0);});
 return {setScreen,script};
}

// Independent, click-through decorations; no children are added to vote/role lists.
export function installB3ScrollHints(){
 const selector='#counts,.board-window,.setup-content,#encyclopedia,#nightRecap,.preview-back,.judge-box,.judge-content,.script-box,.vote-scroll,#exileVoters,#exileCandidateGrid,.exile-header,.exile-footer,dialog:not(#rolePreview)';
 const pairs=new Map();let frame=null;
 const schedule=()=>{if(frame===null)frame=requestAnimationFrame(update);};
 const resize=new ResizeObserver(schedule);
 function update(){
  frame=null;
  for(const [e,hint]of pairs)if(!e.isConnected){resize.unobserve(e);hint.remove();pairs.delete(e);}
  for(const e of document.querySelectorAll(selector))if(!pairs.has(e)){
   const hint=document.createElement('span');hint.className='b3-scroll-hint';hint.setAttribute('role','presentation');hint.inert=true;hint.dataset.for=e.id||e.classList[0];hint.hidden=true;(e.closest('dialog')||document.body).append(hint);pairs.set(e,hint);resize.observe(e);
  }
  for(const [e,hint]of pairs){
   let visible=e.getClientRects().length&&!e.closest('[hidden],[inert],[aria-hidden="true"]')&&e.scrollHeight-e.clientHeight-e.scrollTop>2;
   const r=e.getBoundingClientRect();let left=Math.max(0,r.left+e.clientLeft),right=Math.min(innerWidth,r.left+e.clientLeft+e.clientWidth),top=Math.max(0,r.top+e.clientTop),bottom=Math.min(innerHeight,r.top+e.clientTop+e.clientHeight);
   for(let parent=e.parentElement;visible&&parent;parent=parent.parentElement){const css=getComputedStyle(parent),box=parent.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(css.overflowY)){top=Math.max(top,box.top+parent.clientTop);bottom=Math.min(bottom,box.top+parent.clientTop+parent.clientHeight);}if(/auto|scroll|hidden|clip/.test(css.overflowX)){left=Math.max(left,box.left);right=Math.min(right,box.right);}}
   visible=visible&&right-left>4&&bottom-top>4;hint.hidden=!visible;e.dataset.b3Scroll=visible?'more':'end';
   if(visible){
    const owner=hint.closest('dialog'),box=owner?.getBoundingClientRect(),x=owner?left-box.left-owner.clientLeft+owner.scrollLeft:left,y=owner?Math.max(top,bottom-12)-box.top-owner.clientTop+owner.scrollTop:Math.max(top,bottom-12);
    Object.assign(hint.style,{position:owner?'absolute':'fixed',left:x+'px',top:y+'px',width:(right-left)+'px',height:Math.min(12,bottom-top)+'px'});
   }
  }
 }
 const mutation=new MutationObserver(records=>{if(records.some(r=>!r.target.classList?.contains('b3-scroll-hint')&&(r.type!=='childList'||[...r.addedNodes,...r.removedNodes].some(n=>!n.classList?.contains('b3-scroll-hint')))))schedule();});
 mutation.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class','inert','aria-hidden','data-screen']});
 document.addEventListener('scroll',schedule,{capture:true,passive:true});document.addEventListener('load',schedule,true);document.addEventListener('transitionend',schedule,true);window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',schedule);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);schedule();
}

// OPEN-01–10. Tab-local presentation only; no game snapshots or durable flags.
export function openingEligible({navigation,seen,previousScreen,screen,roomLink,onlineRecovery,reduced,visible,reliable=true}){
 return reliable&&navigation==='navigate'&&!seen&&!previousScreen&&screen==='home'&&!roomLink&&!onlineRecovery&&!reduced&&visible;
}
export function installWolfCueOpening({screen,previousScreen}){
 const key='wolfcue-opening-tab-v1';let motion,eligible=false;
 try{
  motion=matchMedia('(prefers-reduced-motion: reduce)');
  const seen=sessionStorage.getItem(key),url=new URL(location.href),hash=new URLSearchParams(url.hash.slice(1));
  const online=JSON.parse(localStorage.getItem('wolfcue-online-host-v1'));
  eligible=openingEligible({navigation:performance.getEntriesByType('navigation')[0]?.type,seen,previousScreen,screen,roomLink:url.searchParams.has('room')||hash.has('room')||hash.has('invite'),onlineRecovery:!!online&&!online.started,reduced:motion.matches,visible:document.visibilityState==='visible'});
  sessionStorage.setItem(key,'seen');if(sessionStorage.getItem(key)!=='seen')return;
 }catch{return;} // Unknown restoration/storage state: skip, never guess.
 if(!eligible)return;
 const root=document.createElement('div');root.className='wolfcue-opening';root.tabIndex=-1;root.setAttribute('role','status');root.setAttribute('aria-label','狼序 WolfCue，狼人殺主持工具');
 root.innerHTML='<div class="opening-art" aria-hidden="true"></div><div class="opening-brand" aria-hidden="true"><strong>狼序 WolfCue</strong><p>狼人殺主持工具</p></div>';
 const before=document.activeElement,locked=[],animations=[],started=performance.now(),controller=new AbortController();
 let active=true,held=false,normalTimer,observer;
 const eventTypes=['pointerdown','pointerup','pointercancel','click','dblclick','keydown','keyup'];
 function unlisten(){for(const type of eventTypes)window.removeEventListener(type,guard,true);}
 function guard(e){
  if(!active){
   // A press begun under the overlay must not finish as a click on the home.
   if(e.type==='pointerdown'||(e.type==='keydown'&&!e.repeat)){held=false;unlisten();return;}
   if(!held){unlisten();return;}
  }
  if(e.type==='pointerdown'||e.type==='keydown')held=true;
  e.preventDefault();e.stopImmediatePropagation();
 }
 function finish(){
  if(!active)return;active=false;clearTimeout(watchdog);clearTimeout(normalTimer);controller.abort();observer?.disconnect();
  for(const a of animations)a.cancel();root.remove();for(const [node,inert]of locked)node.inert=inert;
  window.removeEventListener('error',finish);window.removeEventListener('unhandledrejection',finish);window.removeEventListener('pagehide',finish);window.removeEventListener('pageshow',restored);document.removeEventListener('visibilitychange',hidden);motion.removeEventListener('change',finish);
  if(!held)unlisten();if(before?.isConnected&&!before.closest('[hidden],[inert]'))before.focus({preventScroll:true});
 }
 function hidden(){if(document.hidden)finish();}
 function restored(e){if(e.persisted)finish();}
 // Independent of image loading, animation events and the normal timeline.
 const watchdog=setTimeout(finish,2500);
 try{
  document.body.append(root);
  if(getComputedStyle(root).position!=='fixed'||!root.animate){finish();return;}
  for(const node of document.body.children)if(node!==root){locked.push([node,node.inert]);node.inert=true;}
  for(const type of eventTypes)window.addEventListener(type,guard,{capture:true,passive:false});root.focus({preventScroll:true});
  window.addEventListener('error',finish);window.addEventListener('unhandledrejection',finish);window.addEventListener('pagehide',finish);window.addEventListener('pageshow',restored);document.addEventListener('visibilitychange',hidden);motion.addEventListener('change',finish);
  observer=new MutationObserver(()=>{if(document.body.dataset.screen!=='home')finish();});observer.observe(document.body,{attributes:true,attributeFilter:['data-screen']});
  const play=(node,frames,options)=>{const a=node.animate(frames,{fill:'both',...options});a.currentTime=performance.now()-started;animations.push(a);a.finished.catch(()=>finish());return a;};
  play(root,[{opacity:1},{opacity:0}],{delay:1450,duration:350,easing:'ease-in-out'});
  normalTimer=setTimeout(finish,Math.max(0,1800-(performance.now()-started)));
  // Reuse the actual approved SVG, including its exact contour; no new artwork.
  fetch('./wolfcue-mark.svg',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Logo unavailable');return r.text();}).then(text=>{
   if(!active)return;
   if(performance.now()-started>600){finish();return;}
   const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
   if(svg.localName!=='svg'||!svg.querySelector('path'))throw Error('Invalid logo');
   const art=root.querySelector('.opening-art'),badge=document.importNode(svg,true);badge.classList.add('opening-badge');badge.setAttribute('aria-hidden','true');
   const trace=document.createElementNS('http://www.w3.org/2000/svg','svg');trace.setAttribute('viewBox',svg.getAttribute('viewBox'));trace.classList.add('opening-trace');
   const contour=svg.querySelector('path').cloneNode(true);contour.removeAttribute('fill');contour.setAttribute('pathLength','1');trace.append(contour);art.append(badge,trace);
   play(contour,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:850,easing:'ease-in-out'});
   play(trace,[{opacity:1},{opacity:0}],{delay:750,duration:300});
   play(badge,[{opacity:0},{opacity:1}],{delay:550,duration:400});
   for(const [selector,delay]of [['strong',950],['p',1100]])play(root.querySelector('.opening-brand '+selector),[{opacity:0,filter:'blur(5px)',transform:'translateY(4px)'},{opacity:1,filter:'blur(0px)',transform:'translateY(0)'}],{delay,duration:250,easing:'ease-out'});
  }).catch(()=>finish());
 }catch{finish();}
 return finish;
}
