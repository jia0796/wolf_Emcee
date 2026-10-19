import {PAGE_BACKGROUNDS,HOST_BACKGROUNDS} from './data.js';

// Presentation state only: never receives or writes a game/save/history object.
export function backgroundSource(screen,phase){
 return screen==='host'?HOST_BACKGROUNDS[phase==='夜晚'?'night':'day']:PAGE_BACKGROUNDS[screen];
}
export function createB3Backdrop(){
 const root=document.createElement('div');root.className='b3-backdrop';root.setAttribute('aria-hidden','true');
 const layers=[0,1].map(()=>{const e=document.createElement('div');e.className='b3-scene';root.append(e);return e;});document.body.prepend(root);
 const loaded=new Map(),pending=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let screen=null,phase=null,wanted=null,current=null,index=0,epoch=0,animation=null,quiet=true,lastStep=null;
 function cancel(){animation?.cancel();animation=null;}
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
 function setScreen(next,nextPhase){
  const transition=screen==='host'&&next==='host'&&phase!==nextPhase&&!quiet&&!document.hidden;
  quiet=false;if(screen!==next)lastStep=null;screen=next;phase=nextPhase;wanted=backgroundSource(next,nextPhase);const ticket=++epoch;
  document.body.dataset.b3Phase=next==='host'?(nextPhase==='夜晚'?'night':'day'):'lobby';
  // Keep the previous usable scene/legacy background while an uncached image loads.
  if(loaded.has(wanted))paint(wanted,transition);
  else load(wanted,'high').then(ok=>{if(ok&&ticket===epoch)paint(wanted,transition);});
 }
 function script(step){
  const title=document.getElementById('subtitle');if(lastStep===step)return;
  const prior=lastStep;lastStep=step;title.getAnimations().forEach(a=>a.cancel());
  if(prior&&['dark','dawn'].includes(step)&&!motion.matches&&!document.hidden)title.animate([{opacity:.45,filter:'blur(2px)'},{opacity:1,filter:'blur(0px)'}],{duration:1000,easing:'ease-out'});
 }
 function resume(){quiet=true;cancel();layers.forEach((e,i)=>e.style.opacity=i===index?'1':'0');document.getElementById('subtitle')?.getAnimations().forEach(a=>a.cancel());}
 document.addEventListener('visibilitychange',resume);window.addEventListener('pageshow',resume);motion.addEventListener('change',resume);
 window.addEventListener('online',()=>{const src=wanted,ticket=epoch;if(src&&!loaded.has(src))load(src,'high').then(ok=>{if(ok&&ticket===epoch)paint(src,false);});});
 // Lobby starts first; silent host preparation remains optional and never gates show().
 load(PAGE_BACKGROUNDS.home,'high').then(()=>{const prepare=()=>load(HOST_BACKGROUNDS.night).then(()=>load(HOST_BACKGROUNDS.day));if('requestIdleCallback'in window)requestIdleCallback(prepare,{timeout:2000});else setTimeout(prepare,0);});
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
