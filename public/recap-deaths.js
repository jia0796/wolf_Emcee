// Read-only labels for authoritative deaths; never re-run damage or alter saved records.
const UNKNOWN='死因未記錄';
const targets=e=>e.effectiveTargets||e.rawTargets||(Number.isInteger(e.id)?[e.id]:[]);
const applied=e=>e.executed!==false&&!e.blocked&&!e.unsettled;
const roleOf=e=>e.sourceRole||e.actorRole||e.actorSnapshots?.[0]?.role;
const eventType=e=>e.type||e.key||e.cause;

function dayDeath(p,events){
 const match=[...events].reverse().find(e=>{
  if(!applied(e))return false;const type=eventType(e);
  if(p.cause==='selfDestruct')return type==='selfDestruct'&&e.actors?.includes(p.id);
  if(p.cause==='duel')return type==='duel'&&(e.result==='決鬥失敗'?e.actors:targets(e))?.includes(p.id);
  const types={exile:['exile'],shot:['shot','awakenedPatrol'],lastBlade:['lastBlade'],heartbreak:['heartbreak','fragranceHeartbreak'],awakenedSubstitute:['awakenedSubstitute']};
  return types[p.cause]?.includes(type)&&targets(e).includes(p.id);
 });
 if(!match)return null;
 return {id:p.id,cause:p.cause,sourceActor:match.sourceActor||match.actors?.[0],sourceRole:roleOf(match),skillSource:match.skillSource||(match.displayRole==='lucky'?'lucky':null),source:eventType(match)==='fragranceHeartbreak'?'fragranceBond':eventType(match)==='heartbreak'?'heartbreak':null,event:match};
}

function sameSave(death,events){
 if(death.source==='guardAndAntidote')return true;
 if(death.source!=='basic')return false;
 const onVictim=e=>applied(e)&&targets(e).includes(death.id);
 return events.some(e=>onVictim(e)&&e.skill==='antidote')&&events.some(e=>onVictim(e)&&['guard','shield'].includes(e.key));
}

export function identityDeathReason(s,p){
 const records=[...(s.nightRecords||[])].sort((a,b)=>b.night-a.night);
 const pending=s.nightState?.deaths??s.nightResolution?.deaths??[];
 if(p.alive&&!pending.some(d=>d.id===p.id))return '';
 // A later day death takes precedence over an earlier, different saved cause.
 let found;
 for(const r of records){const d=r.deaths?.find(d=>d.id===p.id&&(!p.cause||d.cause===p.cause));if(d){found={death:d,events:r.events||[]};break;}}
 if(!found){const d=pending.find(d=>d.id===p.id&&(!p.cause||d.cause===p.cause));if(d)found={death:d,events:records.find(r=>r.night===s.night)?.events||[]};}
 const events=found?.events||[],eventDetail=dayDeath({...p,cause:found?.death.cause||p.cause},found?events:s.dayEvents||[]);
 const death={...(eventDetail||{}),...(found?.death||{}),id:p.id,cause:found?.death.cause||p.cause};
 if(death.cause==='attack'){
  if(sameSave(death,events))return '奶穿';
  if(death.source==='extra')return '機械狼刀';
  if(death.source==='revenge')return '復仇刀';
  return death.source==='basic'?'狼人襲擊':UNKNOWN;
 }
 if(death.cause==='poison'){
  if(death.source==='reflection')return '毒藥反彈';
  if(death.source==='luckyPoison'||death.skillSource==='lucky')return '幸運兒潑毒';
  if(death.source==='learnedPoison'||death.sourceRole==='mechanical')return '機械狼毒';
  return death.source==='witch'||death.sourceRole==='witch'?'女巫潑毒':UNKNOWN;
 }
 if(death.cause==='shot'){
  if(death.skillSource==='lucky')return '幸運兒開槍';
  if(death.sourceRole==='mechanical')return '機械狼槍';
  if(death.sourceRole==='king')return '狼王開槍';
  return ['hunter','awakenedHunter'].includes(death.sourceRole)?'獵人開槍':UNKNOWN;
 }
 if(death.cause==='heartbreak'){
  if(death.source==='fragranceBond')return '魅影綁定';
  if(death.source==='heartbreak'||death.sourceRole==='beauty')return '殉情';
  return UNKNOWN;
 }
 if(death.cause==='duel')return death.sourceActor===p.id||p.role==='duelist'?'以死謝罪':'騎士制裁';
 if(death.cause==='hunt')return death.sourceActor===p.id||p.role==='demon'?'狩獵失敗':'獵魔狩獵';
 return ({exile:'放逐',selfDestruct:'狼人自爆',lastBlade:'屠邊刀',dreamRepeat:'攝夢連攝',dreamLink:'攝夢連帶',reflect:'惡靈反傷',tradeFailure:'交易失敗',dance:'共舞身亡',awakenedSubstitute:'替死'})[death.cause]||UNKNOWN;
}
