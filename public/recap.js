import {voteDetails} from './votes.js';
import {ROLE_DATA} from './data.js';
import {CATALOG_ART_V2} from './catalog-v2.js';
import {identityDeathReason} from './recap-deaths.js';
import {recapNights,personSnapshot} from './records.js';
import {realWolf,infected,converted} from './identity.js';
export const SKILL_LABELS={bond:'綁定','wolf-inspect':'狼人查驗',dance:'共舞',mask:'面具',charm:'魅惑',heartbreak:'殉情',duel:'決鬥',vote:'放逐投票','sheriff-badge':'警徽',infect:'感染','wolf-attack':'狼刀',antidote:'解藥',poison:'毒藥',shield:'守護',inspect:'查驗',swap:'交換',gun:'槍',learn:'學習',trade:'交易',fear:'恐懼',sleep:'夢遊','role-model':'榜樣',hunt:'狩獵',transform:'轉化',gravekeeper:'守墓查驗','evil-knight-reflect':'反傷'};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
export function skillIcon(skill){const icon=el('img','skill-icon');icon.src='skills/icon-'+skill+'.svg';icon.alt=SKILL_LABELS[skill];return icon;}
export function cardModel(event){
 const lucky=event.displayRole==='lucky',r=ROLE_DATA[event.portraitRole||event.actorRole];
 const target=event.skill==='swap'?event.rawTargets.map(id=>id+'號').join(' ↔ '):event.rawTargets.map((id,i)=>id===event.effectiveTargets[i]?id+'號':id+'號 → '+event.effectiveTargets[i]+'號').join('、');
 return {name:event.key==='basic'?basicKnifeName(event):event.displayName|| (lucky?'幸運兒':ROLE_DATA[event.displayRole]?.name||r?.name||''),tone:event.tone|| (r?.kind==='wolf'?'wolf':r?.kind==='villager'?'villager':'god'),image:r?.image,crop:r?.recapCrop||null,facePriority:!!r?.facePriority,align:r?.recapAlign||'xMidYMid slice',artSize:r?.artSize||[1060,1484],target,actors:event.actors.map(id=>id+'號').join('、')};
}

// The joint wolf attack keeps its generic label. A lone takeover wolf uses
// the identity stored with that specific night, never a later final identity.
const conversionLabel=name=>name.replace(/^轉化者\(([^)]+)\)$/,'轉化者（$1）');
function basicKnifeName(e){
 if(e.actors?.length!==1)return '狼人';
 const snapshot=e.actorSnapshots?.[0],name=snapshot?.name||'';
 if(name==='感染者'||e.displayName?.includes('（已感染）'))return '感染者';
 if(name.startsWith('轉化者'))return conversionLabel(name);
 if(e.displayName?.startsWith('轉化者'))return conversionLabel(e.displayName);
 if(e.actorRole==='mechanical')return name.startsWith('機械狼')?name:'機械狼';
 if(e.actorRole==='stoneGargoyle')return '石像鬼';
 if(e.actorRole==='fragrance')return '尋香魅影';if(e.actorRole==='younger')return '狼弟';if(e.actorRole==='mask')return '假面';
 return '狼人';
}

const reasonNames={awakenedSubstitute:'替死抵擋',danceProtection:'共舞免刀',masqueradeImmunity:'免疫毒藥',guard:'守護抵擋',antidote:'解藥救回',guardAndAntidote:'同守同救',wolfTarget:'狼人目標',knightImmunity:'免疫',demonImmunity:'免疫',immuneNightGun:'免疫',sleep:'夢遊免疫',shield:'守護抵擋'};
export function outcomeLabel(e){
 if(e.key==='awakenedPatrol')return '';
 if(e.key==='learn'||e.skill==='learn'||e.type==='badge'&&!e.rawTargets.length)return '';
 if(e.key==='dance'||e.key==='bond')return '';
 if(e.key==='danceDeath')return '共舞死亡';
 if(e.key==='maskInspect')return e.participated??e.result==='有參與共舞'?'參與':'未參與';
 if(e.key==='maskAssign')return e.rawTargets.some(id=>e.danceTargets?.includes(id))||e.participated||e.reversed?'陣營反轉':'未參與';
 if(e.unsettled)return '';
 if(e.skill==='transform')return '';
 if(e.skill==='hunt')return e.result?.startsWith('狩獵成功')?'狩獵成功':e.result?.startsWith('狩獵失敗')?'狩獵失敗':'';
 if(e.skill==='infect')return (e.infection?.success?'成功':'失敗')+(reasonNames[e.infection?.reason]?' · '+reasonNames[e.infection.reason]:'');
 if(e.skill==='trade')return e.tradeSuccess?'贈送'+(SKILL_LABELS[e.tradeAbility]||'能力'):'失敗';
 if(e.key==='evilKnightReflect')return e.outcome||'反傷';
 if(e.skill==='sleep')return e.outcome||(e.result==='連續攝夢致死'?'連攝':'');
 if(e.blocked)return reasonNames[e.blocked]||'抵擋';
 const reasons=[...new Set((e.damage||[]).map(d=>reasonNames[d.blocked]).filter(Boolean))];
 if(reasons.length)return reasons.join('、');
 return e.result||'';
}
function knownPerson(e,actor,index=0){
 const p=(actor?e.actorSnapshots:e.targetSnapshots)?.[index];if(p)return {...p};
 // Older records have no target identity snapshot: never infer it from final roles.
 const id=(actor?e.actors:e.effectiveTargets||e.rawTargets)?.[index],role=actor?e.actorRole:null,r=ROLE_DATA[role];
 return {id,role,name:r?.name||'未記錄',tone:r?.kind,image:r?.image};
}
function portrait(p){
 const box=el('div','recap-image');if(!p?.image)return box;
 const r=ROLE_DATA[p.role],current=CATALOG_ART_V2[p.role]?.full;
 // Resolve art from the event's recorded role, never from the player's final identity.
 // Keep historical snapshots intact; a failed new asset falls back to that snapshot's image.
 const draw=modern=>{
  const source=modern?current:p.image,crop=modern?[90,160,880,1040]:r?.recapCrop||(p.role==='mixed'?[80,120,930,1020]:null),size=modern?[1060,1484]:r?.artSize||(p.role==='mixed'?[1089,1445]:[1060,1484]);
  let node,img;
  if(crop){node=document.createElementNS('http://www.w3.org/2000/svg','svg');node.classList.add('recap-portrait','recap-fused-art');node.setAttribute('viewBox',crop.join(' '));node.setAttribute('preserveAspectRatio',modern?'xMidYMid slice':r?.recapAlign||'xMidYMid slice');node.setAttribute('role','img');node.setAttribute('aria-label',p.name||'');img=document.createElementNS('http://www.w3.org/2000/svg','image');img.setAttribute('href',source);img.setAttribute('width',String(size[0]));img.setAttribute('height',String(size[1]));node.append(img);}
  else{node=img=el('img','recap-portrait');img.src=source;img.alt=p.name||'';img.loading='lazy';}
  if(modern)img.onerror=()=>{img.onerror=null;box.replaceChildren();draw(false);};
  box.append(node);
 };
 draw(!!current);return box;
}
function personText(p,{noNumber=false}={}){const text=el('div','recap-person '+(p?.tone||'neutral'));text.append(el('strong',null,p?.name||'未記錄'));if(!noNumber&&p?.id)text.append(el('span',null,p.id+'號'));return text;}
function actorModel(e){const p=knownPerson(e,true);if(e.displayRole==='lucky'||e.skillSource==='lucky')p.name='幸運兒';if(e.key==='basic'){p.name=basicKnifeName(e);p.tone='wolf';p.role=e.portraitRole||e.actorRole;p.image=ROLE_DATA[p.role]?.image;}return p;}
export function eventCard(e){
 const card=el('article','event-card recap-event');card.dataset.event=e.type||e.key||e.skill||'';
 if(['selfDestruct','idiot'].includes(e.type)){const p=knownPerson(e,true);card.classList.add('single-event');card.append(portrait(p),personText(p),el('span','recap-arrow','→'),el('strong','recap-event-label',e.label));return card;}
 if(e.type==='exilePK'){card.append(el('p','pk-result',e.result));return card;}
 let left=actorModel(e);const vote=['sheriff','exile'].includes(e.type);
 if(vote)left={name:e.type==='sheriff'?'警長競選':'放逐投票',image:e.type==='sheriff'?'art/recap-sheriff.png':'art/recap-vote.png',tone:'neutral'};
 card.append(portrait(left),personText(left,{noNumber:vote||e.key==='basic'&&!['fragrance','stoneGargoyle'].includes(e.actorRole)}));
 const center=el('div','recap-effect'),label=outcomeLabel(e);if(label&&!vote)center.append(el('span','recap-outcome',label));if(e.key==='extraAttack')center.append(el('span','recap-outcome','額外狼刀'));if(e.skill){const icon=skillIcon(e.key==='maskInspect'?'wolf-inspect':e.skill);if(e.type==='awakenedSubstitute'||e.key?.startsWith('awakenedSubstitute:'))icon.alt='替死';if(e.key==='awakenedPatrol')icon.alt='巡獵';center.append(icon);}else center.append(el('span','recap-arrow','→'));card.append(center);
 if(e.key==='awakenedPatrol'&&!e.rawTargets.length){card.append(el('span','recap-no-target','不巡獵'));return card;}
 if(e.key==='stoneKnifeState'){card.append(el('span','recap-no-target','帶刀狀態'));return card;}
 if(e.key==='maskAssign'&&!e.rawTargets.length){card.append(el('strong','recap-no-target',e.unsettled?'未結算（遊戲已結束）':'空過'));return card;}
 if(e.type==='badge'&&!e.rawTargets.length){card.append(el('strong','badge-destroyed','X'),el('span','recap-event-label','撕毀警徽'));return card;}
 if(vote&&!e.rawTargets.length){card.append(el('strong','recap-no-target',e.result||'無人出局'));return card;}
 const targets=e.targetSnapshots||e.rawTargets||[];
 if(e.skill==='swap'||e.key==='dance'||e.key==='bond'||e.key==='awakenedInspect'){
  const people=el('div','recap-double-targets');targets.forEach((_,i)=>{const p=knownPerson(e,false,i),row=el('div','recap-target-row');row.append(personText(p),portrait(p));people.append(row);});card.append(people);
 }else{const p=knownPerson(e,false);card.append(personText(p),portrait(p));}
 if(e.rawTargets?.some((id,i)=>id!==e.effectiveTargets?.[i])){const raw=e.rawTargets.map((id,i)=>id+'號 → '+e.effectiveTargets[i]+'號').join('、');card.append(el('p','recap-mapping','原始 → 實際：'+raw));}
 return card;
}
// A patrol's stored target is the actual victim. For display, a paired saved
// substitution receipt identifies the wolf beauty encountered before that death.
export function patrolRecapEvent(event,next){
 if(event.key!=='awakenedPatrol'||!event.encountered||next?.type!=='awakenedSubstitute'||next.executed===false||next.actors?.[0]!==event.encountered||event.rawTargets?.length!==1||event.rawTargets[0]!==next.rawTargets?.[0])return event;
 const beauty=next.actorSnapshots?.find(p=>p.id===event.encountered&&p.role==='awakenedBeauty');if(!beauty)return event;
 return {...event,rawTargets:[beauty.id],effectiveTargets:[beauty.id],targetSnapshots:[{...beauty}]};
}
export function recapTimeline(s){
 const nights=recapNights(s),days=s.dayEvents||[],numbers=[...new Set([...nights.map(r=>r.night),...days.map(e=>e.day)])].sort((a,b)=>a-b),sections=[];
 for(const n of numbers){const r=nights.find(x=>x.night===n);if(r)sections.push({kind:'night',number:n,record:r,events:r.events.filter(e=>!!e.skill&&!e.statusOnly&&e.key!=='stoneKnifeState')});const saved=days.filter(e=>e.day===n&&e.executed!==false).map(e=>e.type?e:{...e,type:'shot',actors:[e.sourceActor],rawTargets:[e.id],effectiveTargets:[e.id]}),events=saved.map((e,i)=>patrolRecapEvent(e,saved[i+1]));if(events.length)sections.push({kind:'day',number:n,events});}
 if(s.blood?.lastEvent?.executed&&!days.some(e=>e.type==='lastBlade')){let day=sections.find(r=>r.kind==='day'&&r.number===s.night);if(!day){day={kind:'day',number:s.night,events:[]};sections.push(day);}day.events.push(s.blood.lastEvent);}
 return sections;
}
export function finalIdentityModel(s){const deaths=s.nightState?.deaths||s.nightResolution?.deaths||[],camps=s.winner==='好人陣營'?['good','wolf']:['wolf','good'];return camps.map(camp=>({camp,players:s.players.filter(p=>p.active&&(realWolf(s,p)?'wolf':'good')===camp).sort((a,b)=>(camp==='good'?(ROLE_DATA[a.role]?.kind==='god'?0:1)-(ROLE_DATA[b.role]?.kind==='god'?0:1):0)||a.id-b.id).map(p=>{const snap=personSnapshot(s,p.id);snap.alive=p.alive&&!deaths.some(d=>d.id===p.id);snap.deathReason=snap.alive?'':identityDeathReason(s,p);if(infected(s,p))snap.name='感染者';if(converted(s,p))snap.name='轉化者';snap.tone=realWolf(s,p)?'wolf':ROLE_DATA[p.role]?.kind;snap.original=infected(s,p)||converted(s,p)?ROLE_DATA[p.role]?.name:null;return snap;})}));}
export function recapDays(s){const groups=new Map();for(const segment of recapTimeline(s)){if(!groups.has(segment.number))groups.set(segment.number,[]);groups.get(segment.number).push(segment);}return [...groups].sort(([a],[b])=>a-b).map(([number,segments])=>({number,segments}));}
export function recapDayLabel(number){const digits='零一二三四五六七八九';let text=String(number);if(Number.isInteger(number)&&number>0&&number<100)text=number<10?digits[number]:(number<20?'':digits[Math.floor(number/10)])+'十'+(number%10?digits[number%10]:'');return '第'+text+'天';}
let recapViewId=0;
export function renderRecap(container,s){
 container.replaceChildren();
 const result=el('section','victory recap-victory');result.append(el('h2',null,s.winner+'獲勝'),el('p',null,'勝利原因：'+(s.winnerReason||'')));container.append(result);
 const final=el('details','final-identities');final.open=true;final.append(el('summary','recap-section-title','身分回顧'));
 for(const group of finalIdentityModel(s)){
  final.append(el('h4',null,group.camp==='wolf'?'狼人陣營':'好人陣營'));const grid=el('div','final-identity-grid');grid.dataset.camp=group.camp;
  for(const p of group.players){
   const status=p.alive?'存活':p.deathReason,card=el('article','final-identity-card '+p.tone+(p.alive?'':' is-dead')),text=el('div','recap-person '+p.tone),number=el('span','identity-number',p.id);
   card.dataset.seat=String(p.id);card.style.setProperty('--identity-art','url("'+(CATALOG_ART_V2[p.role]?.full||ROLE_DATA[p.role]?.image)+'")');card.setAttribute('aria-label',p.id+'號，'+p.name+'，'+(p.alive?'存活':'死亡：'+status)+(p.original?'，原職：'+p.original:''));number.setAttribute('aria-label',p.id+'號');
   text.append(el('strong','identity-name',p.name),el('span','identity-status',status));if(p.original)text.append(el('span','identity-original','原職：'+p.original));card.append(portrait(p),number,text);grid.append(card);
  }final.append(grid);
 }container.append(final);
 if(s.legacyRecap||!s.recapVersion)container.append(el('p','small','舊版存檔僅顯示實際保存的事件；缺少的白天與身分快照不補造。'));
 const view='recap-view-'+(++recapViewId),window=el('section','recap-window'),header=el('header','recap-window-header'),title=el('h3','recap-title','完整復盤'),tabs=el('div','recap-day-tabs'),days=el('div','recap-days'),entries=[];
 title.id=view+'-title';window.setAttribute('aria-labelledby',title.id);tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','選擇復盤天數');days.setAttribute('role','region');days.setAttribute('aria-label','每日復盤事件');days.tabIndex=0;header.append(title,tabs);window.append(header,days);
 const selectDay=index=>{entries.forEach(({tab,panel},i)=>{const selected=i===index;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;panel.hidden=!selected;});days.scrollTop=0;};
 for(const day of recapDays(s)){
  const tab=el('button','recap-day-tab',recapDayLabel(day.number)),panel=el('section','recap-day'),body=el('div','recap-day-body'),index=entries.length;
  tab.type='button';tab.id=view+'-tab-'+day.number;tab.dataset.day=String(day.number);tab.setAttribute('role','tab');tab.setAttribute('aria-controls',view+'-day-'+day.number);panel.id=view+'-day-'+day.number;panel.dataset.day=String(day.number);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.append(body);entries.push({tab,panel});
  tab.onclick=()=>selectDay(index);tab.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%entries.length;else if(e.key==='ArrowLeft')next=(index+entries.length-1)%entries.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=entries.length-1;else return;e.preventDefault();selectDay(next);entries[next].tab.focus();entries[next].tab.scrollIntoView({block:'nearest',inline:'nearest'});};tabs.append(tab);
  for(const segment of day.segments){
   const section=el('section','recap-segment '+segment.kind);section.setAttribute('aria-label',segment.kind==='night'?'夜晚':'白天');
   for(const event of segment.events){section.append(eventCard(event));const superseded=event.type==='exilePK'&&segment.events.some(e=>e!==event&&['exile','idiot'].includes(e.type)&&e.voteRounds?.some(r=>event.voteRounds?.some(first=>first.key===r.key)));if(!superseded){const details=voteDetails(event.voteRounds);if(details)section.append(details);}}
   if(segment.kind==='night'){const r=segment.record,result=el('article','night-result');result.append(el('h4',null,'當晚結果'),el('p',null,r.settled?(r.deaths.length?'死亡：'+[...r.deaths].sort((a,b)=>a.id-b.id).map(d=>d.id+'號').join('、'):'平安夜'):'本晚尚未結算'));section.append(result);}
   body.append(section);
  }days.append(panel);
 }
 if(entries.length)selectDay(0);else{tabs.hidden=true;days.append(el('p','recap-empty','尚無可顯示的復盤紀錄。'));}
 container.append(window);
}
