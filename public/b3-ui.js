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
