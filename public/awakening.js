import {BOARDS,ROLE_DATA} from './data.js';
import {realWolf} from './identity.js';

// Isolated AWB state. Existing boards/saves do not acquire new game behavior.
export const isAwb=s=>!!BOARDS[s.boardId]?.roles.awakenedBeauty;
export const awakeningState=()=>({target:null,linkNight:null,lastUsedNight:null,used:false,usedBatch:null,receipt:null,gunBlocked:[]});
export function charmAvailable(s){
 const p=s.players.find(p=>p.role==='awakenedBeauty');
 return isAwb(s)&&!!p?.alive&&!s.winner&&!s.awb?.used&&s.awb?.lastUsedNight!==s.night-1;
}
export const activeLink=s=>isAwb(s)&&!s.awb?.used&&s.awb?.linkNight===s.night&&!!s.awb?.target;
export function charmHint(s){
 if(!s.players.some(p=>p.role==='awakenedBeauty'&&p.alive))return '覺醒狼美人已出局';
 if(s.awb?.used)return '替死已使用，魅惑能力永久失效';
 if(!charmAvailable(s))return '本晚冷卻，無法魅惑';
 return '點選一名其他存活玩家，或選擇空魅惑';
}

// Pure projection. A committed receipt can be replayed only for its original
// batch, so later independent damage is not protected by an already spent power.
export function substituteBatch(s,deaths,events,{context='night',batch,prior=[]}={}){
 const unchanged={deaths,events,receipt:null};
 if(!isAwb(s))return unchanged;
 const beauty=s.players.find(p=>p.role==='awakenedBeauty'),a=s.awb;
 const hits=deaths.filter(d=>d.id===beauty?.id&&!d.bypassAwakenedSubstitute);
 if(!beauty?.alive||!hits.length||a?.linkNight!==s.night||!a.target||a.used&&a.usedBatch!==batch)return unchanged;
 const target=s.players.find(p=>p.id===a.target);
 const sameNightDead=context==='night'&&[...prior,...deaths,...(s.nightState?.deaths||[])].some(d=>d.id===target?.id);
 if(!target?.active||!target.alive&&!sameNightDead)return unchanged;
 const receipt={actor:beauty.id,target:target.id,night:s.night,context,batch,causes:[...new Set(hits.map(d=>d.cause))]};
 const source=hits[0],linked={id:target.id,cause:'awakenedSubstitute',source:'awakenedSubstitute',sourceActor:beauty.id,sourceRole:'awakenedBeauty',context,day:s.night,originalCause:source.cause,shooterCause:source.shooterCause??null,shooterContext:source.shooterContext??null,shooterRole:source.sourceRole??null};
 const out=deaths.filter(d=>d.id!==beauty.id);
 if(!out.some(d=>d.id===target.id)&&target.alive)out.push(linked);
 return {deaths:out,receipt,events:[...events.map(e=>e.id===beauty.id&&!e.blocked&&!e.bypassAwakenedSubstitute?{...e,blocked:'awakenedSubstitute'}:e),{...linked,blocked:null,batch}]};
}
export function consumeSubstitute(s,receipt){
 if(!receipt)return;
 s.awb??=awakeningState();Object.assign(s.awb,{used:true,usedBatch:receipt.batch,receipt:structuredClone(receipt)});
 s.awb.gunBlocked=[...new Set([...s.awb.gunBlocked,receipt.target])];
}
export function patrolContext(death){return death?.cause==='attack'&&death.context==='night'?'night':'day';}
export function patrolPlan(s,direction,death=s.queue?.[0]){
 if(!isAwb(s)||![-1,1].includes(direction)||!death||s.players.find(p=>p.id===death.id)?.role!=='awakenedHunter')return null;
 const count=BOARDS[s.boardId].playerCount,context=patrolContext(death);
 const adjacent=(death.id-1+direction+count)%count+1,path=[];
 for(let offset=1;offset<count;offset++){
  const id=(death.id-1+direction*offset+count*count)%count+1;path.push(id);
  const p=s.players.find(p=>p.id===id);
  if(!p?.active||!p.alive||!realWolf(s,p))continue;
  if(p.role==='awakenedBeauty'&&context==='day'&&activeLink(s)){
   const target=s.players.find(x=>x.id===s.awb.target);
   if(target?.alive)return {direction,adjacent,context,encountered:id,target:target.id,path,substitute:true};
  }
  return {direction,adjacent,context,encountered:id,target:id,path,substitute:false};
 }
 return null;
}

