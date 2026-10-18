import {eligibleVoters,eligibleExileTarget} from './night.js';

// A submitted tally selects an outcome; the existing next step alone settles it.
export const VOTE_STEPS=['sheriffVote','sheriffRevote','exileVote','exileRevote'];
export const voteKind=stage=>stage.startsWith('sheriff')?'sheriff':'exile';
export const voteKey=s=>s.night+':'+s.step;
export function voteEligibility(s){
 const kind=voteKind(s.step),nominees=s.nominees?.length?s.nominees:s.candidates||[],excluded=s.step.endsWith('Revote')?s.votePool:kind==='sheriff'?nominees:[];
 return {voters:eligibleVoters(s).filter(p=>!excluded.includes(p.id)).map(p=>p.id).sort((a,b)=>a-b),
  targets:(s.votePool||[]).filter(id=>{const p=s.players.find(p=>p.id===id);return kind==='exile'?eligibleExileTarget(s,p):p?.active&&p.alive;}).sort((a,b)=>a-b)};
}
export function createVoteDraft(s){
 if(!VOTE_STEPS.includes(s.step))return null;
 const kind=voteKind(s.step),formal=voteRound(s);
 if(s.step==='exileVote'&&formal){const copy=structuredClone(formal.editDraft||formal);delete copy.editDraft;return copy;}
 return formal?.submitted?structuredClone(formal):{key:voteKey(s),day:s.night,stage:s.step,kind,label:s.step.endsWith('Revote')?'PK 重新投票':'第一輪投票',...voteEligibility(s),sheriff:kind==='exile'?s.sheriff:null,ballots:{},confirmed:false};
}
// Optional editing data lives in the existing round array, so undo and restart
// retain their original snapshot semantics. Older saves simply have no draft.
export function saveVoteDraft(s,draft,ui){
 if(s.step!=='exileVote'||draft?.key!==voteKey(s))return false;
 const eligibility=voteEligibility(s),copy={...structuredClone(draft),...eligibility,ballots:{},submitted:false,locked:false,confirmed:false,ui:structuredClone(ui)};
 delete copy.editDraft;
 for(const voter of copy.voters)if(eligibility.targets.includes(draft.ballots[voter])||draft.ballots[voter]==='abstain')copy.ballots[voter]=draft.ballots[voter];
 const formal=voteRound(s);
 if(formal?.submitted)formal.editDraft=copy;
 else{s.votePatterns=(s.votePatterns||[]).filter(r=>r.key!==copy.key);s.votePatterns.push(copy);}
 return true;
}
export const validVoteCount=round=>round.voters.filter(id=>round.targets.includes(round.ballots[id])).length;
export function voteRound(s,create=false){
 if(!VOTE_STEPS.includes(s.step))return null;
 let round=s.votePatterns?.find(r=>r.key===voteKey(s));
 if(!round&&create){round=createVoteDraft(s);(s.votePatterns??=[]).push(round);}
 return round||null;
}
export const voteLocked=s=>s.step!=='exileVote'&&!!voteRound(s)?.locked&&!!voteRound(s)?.submitted;
const highest=round=>{const groups=tallyVotes(round).groups;return groups.filter(g=>g.votes===groups[0]?.votes).map(g=>g.target).sort((a,b)=>a-b);};
export function voteSelectionMatches(s){
 if(!voteRound(s)?.submitted)return false;
 const ids=highest(voteRound(s));return JSON.stringify([...s.action].sort((a,b)=>a-b))===JSON.stringify(ids)&&s.choice===(ids.length>1?'tie':'target');
}
export function voteResultMatches(s){return !voteLocked(s)||voteSelectionMatches(s);}
export const voteRecapMismatch=s=>s.step==='exileVote'&&!!voteRound(s)?.submitted&&(s.action.length>0||s.choice==='tie')&&!voteSelectionMatches(s);
export function submitVote(s,draft){
 if(!draft||!VOTE_STEPS.includes(s.step)||draft.key!==voteKey(s))return {ok:false,reason:'stage'};
 const eligibility=voteEligibility(s),kind=voteKind(s.step),sheriff=kind==='exile'?s.sheriff:null;
 if(JSON.stringify(draft.voters)!==JSON.stringify(eligibility.voters)||JSON.stringify(draft.targets)!==JSON.stringify(eligibility.targets)||draft.sheriff!==sheriff)return {ok:false,reason:'eligibility'};
 const ordinary=s.step==='exileVote',round={...structuredClone(draft),submitted:true,locked:true,confirmed:false,ballots:{}};delete round.legacy;delete round.editDraft;
 for(const voter of round.voters)setBallot(round,voter,draft.ballots[voter]??(ordinary?'abstain':null));
 const ids=highest(round);if(!ids.length&&!ordinary)return {ok:false,reason:'empty'};
 s.votePatterns=(s.votePatterns||[]).filter(r=>r.key!==round.key);s.votePatterns.push(round);
 // No valid votes supply no suggested outcome. Leave the original manual
 // resolution/PK route intact rather than inventing an all-abstain rule.
 if(ids.length){s.action=ids;s.choice=ids.length>1?'tie':'target';}
 return {ok:true};
}
export function abandonVote(s){s.votePatterns=(s.votePatterns||[]).filter(r=>r.key!==voteKey(s));}
export function migrateVoteNotes(s){
 // Old drafts were saved automatically and must not become submitted results.
 s.votePatterns=(s.votePatterns||[]).filter(r=>r.confirmed).map(r=>({...r,submitted:true,locked:false,legacy:true}));
 for(const event of s.dayEvents||[])if(event.voteRounds)event.voteRounds=event.voteRounds.filter(r=>r.confirmed).map(r=>({...r,submitted:true,locked:false,legacy:true}));
 return s;
}
export function setBallot(round,voter,target,toggle=false){
 if(!round||!round.voters.includes(voter)||target!==null&&target!=='abstain'&&!round.targets.includes(target))return false;
 if(target===null||toggle&&round.ballots[voter]===target)delete round.ballots[voter];else round.ballots[voter]=target;
 return true;
}
export function tallyVotes(round){
 const groups=new Map(),abstainers=[];let recorded=0;
 for(const voter of round.voters){const target=round.ballots[voter];if(target==='abstain'){recorded++;abstainers.push(voter);continue;}if(!round.targets.includes(target))continue;
  recorded++;if(!groups.has(target))groups.set(target,{target,votes:0,voters:[]});const group=groups.get(target);group.votes+=round.kind==='exile'&&round.sheriff===voter?1.5:1;group.voters.push(voter);
 }
 const ranked=[...groups.values()].sort((a,b)=>b.votes-a.votes||a.target-b.target);
 for(const group of ranked)group.tied=ranked.some(other=>other!==group&&other.votes===group.votes);
 return {recorded,total:round.voters.length,groups:ranked,abstainers};
}
export function confirmVoteNotes(s){const round=voteRound(s);if(round?.submitted)round.confirmed=s.step==='exileVote'?voteSelectionMatches(s):voteResultMatches(s);}
export function savedVoteNotes(s,kind){return (s.votePatterns||[]).filter(r=>r.day===s.night&&r.kind===kind&&r.submitted&&r.confirmed&&tallyVotes(r).recorded>0).map(r=>structuredClone(r));}
export function voteGroups(round,{showTies=true}={}){
 const {groups,abstainers}=tallyVotes(round),list=document.createElement('div');list.className='vote-groups';
 const people=ids=>{const p=document.createElement('p');p.className='vote-people';for(const id of ids){const person=document.createElement('span');person.textContent=id+'號';if(round.sheriff===id){const badge=document.createElement('img');badge.src='art/moon-eclipse-sheriff-badge.svg';badge.alt='警徽';person.append(badge);}p.append(person);}return p;};
 for(const group of groups){const box=document.createElement('div'),title=document.createElement('strong');title.textContent=group.target+'號：'+group.votes+'票'+(showTies&&group.tied?' · 同票':'');box.append(title,people(group.voters));list.append(box);}
 if(abstainers.length){const box=document.createElement('div'),title=document.createElement('strong');title.textContent='棄票：'+abstainers.length+'人';box.append(title,people(abstainers));list.append(box);}
 return list;
}
export function voteDetails(rounds){
 const actual=(rounds||[]).filter(r=>tallyVotes(r).recorded>0);if(!actual.length)return null;
 const details=document.createElement('details');details.className='vote-records';const summary=document.createElement('summary');summary.textContent='查看投票紀錄';details.append(summary);
 for(const round of actual){if(actual.length===1){const label=document.createElement('h4');label.textContent=round.label;details.append(label,voteResultCard(round));}else{const section=document.createElement('details'),heading=document.createElement('summary');heading.textContent=round.label;section.append(heading,voteResultCard(round));details.append(section);}}
 return details;
}

export function voteResultCard(round,{onEdit,open=true,onToggle}={}){
 const {groups,abstainers}=tallyVotes(round),valid=validVoteCount(round),card=document.createElement('details'),summary=document.createElement('summary'),content=document.createElement('div');
 card.className='vote-result';card.open=open;content.className='vote-result-content';
 const heading=document.createElement('span');heading.className='vote-result-heading';heading.textContent='已投票 '+valid+' 人 · 棄票 '+abstainers.length+' 人';summary.append(heading);
 if(onEdit){const edit=document.createElement('button');edit.type='button';edit.id='exileResultEdit';edit.className='quiet vote-edit';edit.textContent='修改票型';edit.onclick=e=>{e.preventDefault();e.stopPropagation();onEdit();};summary.append(edit);}
 const compact=document.createElement('div');compact.className='vote-result-compact';summary.append(compact);
 const people=(prefix,ids)=>{const line=document.createElement('p');line.className='vote-result-people';line.append(document.createTextNode(prefix));ids.forEach((id,i)=>{const span=document.createElement('span');span.textContent=String(id);if(id===round.sheriff){const image=document.createElement('img');image.src='art/moon-eclipse-sheriff-badge.svg';image.alt='警徽';span.append(image);}line.append(span,document.createTextNode(i===ids.length-1?'號':'、'));});return line;};
 const groupTitle=g=>{const line=document.createElement('div'),seat=document.createElement('strong'),votes=document.createElement('span');line.className='vote-result-line';seat.textContent=g.target+'號';votes.textContent=g.votes+'票';line.append(seat,votes);return line;};
 for(const g of groups){for(const [parent,small]of [[compact,true],[content,false]]){const row=document.createElement('div');row.className='vote-result-candidate'+(g.votes===groups[0].votes?' vote-highest':'');row.dataset.target=String(g.target);row.append(groupTitle(g));if(!small)row.append(people('投票：',g.voters));parent.append(row);}}
 if(!groups.length){for(const parent of [compact,content]){const empty=document.createElement('p');empty.className='vote-no-valid';empty.textContent='本輪無有效票';parent.append(empty);}}
 for(const [parent,small]of [[compact,true],[content,false]]){const section=document.createElement('div');section.className='vote-result-abstain';const count=document.createElement('p');count.textContent='棄票：'+abstainers.length+'人';section.append(count);if(!small&&abstainers.length)section.append(people('棄票座號：',abstainers));parent.append(section);}
 if(round.kind==='sheriff'){const zero=round.targets.filter(id=>!groups.some(g=>g.target===id));if(zero.length)for(const parent of [compact,content])parent.append(people('未獲票：',zero));}
 card.append(summary,content);let animation=null;
 summary.addEventListener('click',e=>{if(e.target.closest('button'))return;e.preventDefault();animation?.cancel();const closing=card.open;const done=()=>{card.open=!closing;content.style.display='';content.style.overflow='';onToggle?.(card.open);};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
  card.open=true;content.style.display='block';content.style.overflow='hidden';const height=content.scrollHeight;
  animation=content.animate(closing?[{height:height+'px',opacity:1},{height:'0px',opacity:0}]:[{height:'0px',opacity:0},{height:height+'px',opacity:1}],{duration:200,easing:'ease-out'});animation.onfinish=done;
 });
 return card;
}
