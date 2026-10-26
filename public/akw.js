import {setBallot,tallyVotes} from './votes.js';
export const isAkw=s=>s.boardId==='awakenedKingWitch12';
export const akwState=()=>({gifts:[],clawUses:[],attempts:[]});
export function akwNight(s){return s.nightAction.akw??={gift:null,giftSkip:false,helpers:[],proposal:null,verdict:null,ballots:null,draft:null,ballotUI:{mode:'individual',index:0}};}
export const akwActor=(s,role)=>s.players.find(p=>p.active&&p.role===role);
export function clawRemaining(s,id){
 if(!isAkw(s))return 0;
 const role=s.players.find(p=>p.id===id)?.role;
 const initial=role==='awakenedKing'?2:s.akw.gifts.some(g=>g.target===id)?1:0;
 return initial-s.akw.gifts.filter(g=>g.actor===id).length-s.akw.clawUses.filter(g=>g.actor===id).length;
}
export function giftCandidates(s){const king=akwActor(s,'awakenedKing');return king?.alive&&clawRemaining(s,king.id)>0?s.players.filter(p=>p.active&&p.alive&&p.role==='wolf'&&!s.akw.gifts.some(g=>g.target===p.id)).map(p=>p.id):[];}
export function commitGift(s){
 const n=akwNight(s),king=akwActor(s,'awakenedKing');
 if(!n.gift||!giftCandidates(s).includes(n.gift))return null;
 if(s.akw.gifts.some(g=>g.night===s.night))return null;
 const gift={actor:king.id,target:n.gift,night:s.night};s.akw.gifts.push(gift);return {...gift};
}
export function helperCandidates(s){
 const used=s.akw.attempts.flatMap(a=>a.helpers);
 return s.players.filter(p=>p.active&&p.alive&&!used.includes(p.id)).map(p=>p.id);
}
export const helpersNeeded=s=>s.akw.attempts.length+1;
export function akwPotionBlocked(s,type){
 const witch=akwActor(s,'awakenedWitch'),n=s.nightAction;
 if(!witch?.alive)return '女巫已出局';
 if(type==='antidote'){
  if(!s.potions.antidote&&n.antidote!==true)return '解藥已使用';
  if(akwNight(s).proposal!==null)return '本晚已使用毒藥，解藥不可使用';
  if(!n.attack)return '今晚沒有狼刀目標';
  if(!s.rules.selfRescue&&n.attack===witch.id)return '本局不允許女巫自救';
 }else{
  if(n.antidote===true)return '本晚已使用解藥，毒藥不可使用';
  if(s.akw.attempts.length>=3)return '毒藥調配次數已用完';
  if(helperCandidates(s).length<helpersNeeded(s))return '符合資格的協助者人數不足';
 }
 return '';
}
export function canSubmitPoison(s){
 const n=akwNight(s),target=s.nightAction.poisonTarget;
 return !akwPotionBlocked(s,'poison')&&s.nightAction.poison===true&&s.players.some(p=>p.id===target&&p.active&&p.alive)&&
  n.proposal===null&&n.helpers.length===helpersNeeded(s)&&new Set(n.helpers).size===n.helpers.length&&n.helpers.every(id=>helperCandidates(s).includes(id));
}
export function submitPoison(s){
 if(!canSubmitPoison(s))return null;
 const n=akwNight(s),proposal={night:s.night,actor:akwActor(s,'awakenedWitch').id,target:s.nightAction.poisonTarget,helpers:[...n.helpers].sort((a,b)=>a-b),verdict:null,ballots:null};
 n.proposal=s.akw.attempts.length;s.akw.attempts.push(proposal);return structuredClone(proposal);
}
export const currentProposal=s=>isAkw(s)&&s.nightAction.akw?.proposal!=null?s.akw.attempts[s.nightAction.akw.proposal]||null:null;
export function poisonBallotDraft(s){
 const proposal=currentProposal(s);if(!proposal)return null;
 return structuredClone(akwNight(s).draft||akwNight(s).ballots||{key:s.night+':akwDecision',voters:[...proposal.helpers],targets:[1,2],kind:'assist',sheriff:null,ballots:{}});
}
export const poisonBallotsComplete=draft=>!!draft&&draft.voters.every(id=>[1,2].includes(draft.ballots[id]));
export const poisonBallotResult=draft=>poisonBallotsComplete(draft)?tallyVotes(draft).groups.some(g=>g.target===2)?false:true:null;
export function savePoisonDraft(s,draft,ui){
 const proposal=currentProposal(s);if(!proposal||draft?.key!==s.night+':akwDecision'||JSON.stringify(draft.voters)!==JSON.stringify(proposal.helpers))return false;
 const clean={...structuredClone(draft),targets:[1,2],sheriff:null,kind:'assist',ballots:{}};
 for(const id of clean.voters)if([1,2].includes(draft.ballots[id]))setBallot(clean,id,draft.ballots[id]);
 akwNight(s).draft=clean;akwNight(s).ballotUI=structuredClone(ui);return true;
}
export function submitPoisonBallots(s,draft){
 if(!poisonBallotsComplete(draft)||!savePoisonDraft(s,draft,akwNight(s).ballotUI))return false;
 const n=akwNight(s);n.ballots=structuredClone(n.draft);n.draft=null;n.verdict=poisonBallotResult(n.ballots);return true;
}
export const poisonVoteMismatch=s=>!!currentProposal(s)&&!!s.nightAction.akw?.ballots&&poisonBallotResult(s.nightAction.akw.ballots)!==s.nightAction.akw.verdict;
export function confirmPoisonDecision(s){
 const proposal=currentProposal(s),n=akwNight(s);if(!proposal||typeof n.verdict!=='boolean')return null;
 proposal.verdict=n.verdict;proposal.ballots=n.ballots&&!poisonVoteMismatch(s)?structuredClone(n.ballots):null;
 return structuredClone(proposal);
}
export const akwPoisonEffective=s=>currentProposal(s)?.verdict===true;
export function clawAllowed(s,d){
 if(!isAkw(s)||!d||s.winner||clawRemaining(s,d.id)<1)return false;
 if(!['exile','shot'].includes(d.cause)&&!(d.cause==='attack'&&d.context==='night'&&(!d.source||d.source==='basic')))return false;
 // The common batch de-duplicates deaths; effective poison still vetoes a claw.
 if(d.context==='night'){
  const evidence=[...(s.nightResolution?.events||[]),...(s.nightState?.batches||[]).flatMap(b=>b.events||[])];
  if(evidence.some(e=>e.id===d.id&&e.cause==='poison'&&!e.blocked&&e.executed!==false))return false;
 }
 return true;
}
export function consumeClaw(s,d,target){
 if(!clawAllowed(s,d))return false;
 if(target!=null&&(!s.players.some(p=>p.id===target&&p.active&&p.alive)||target===d.id||s.akw.clawUses.some(u=>u.actor===d.id&&u.target===target)))return false;
 s.akw.clawUses.push({night:s.night,actor:d.id,target,used:target!=null});return true;
}
export function akwSeatSuffix(s,p){
 if(!isAkw(s))return '';
 return (p.role==='wolf'&&s.akw.gifts.some(g=>g.target===p.id)?'（繼承）':'')+
  (currentProposal(s)?.helpers.includes(p.id)?'（協）':'');
}
