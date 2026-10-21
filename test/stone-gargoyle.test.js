import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {BOARDS,ROLE_DATA,availableBoards} from '../public/data.js';
import {createGame,next,previous,choose,selectSeat,selectable,canNext,subtitle,nightSteps,upgradeGame,canSelfDestruct,beginSelfDestruct,markersForSeat,potionBlocked,roleResult} from '../public/engine.js';
import {initializeTakeover,knifeKinds,specialBoard,originalKnifeActors} from '../public/takeover.js';
import {basicActor,settleNight,trueWinner} from '../public/night.js';
import {recapNights} from '../public/records.js';
import {cardModel,outcomeLabel} from '../public/recap.js';
const go=s=>assert.equal(next(s),true,'blocked '+s.step);
const id=(s,r)=>s.players.find(p=>p.active&&p.role===r).id;
const events=s=>s.nightRecords.flatMap(r=>r.events);
test('SK requested pose artwork is distinct, intact and optional in progressive cache',()=>{
 const art=JSON.parse(readFileSync(new URL('../docs/sk-stone-art.json',import.meta.url))),r=ROLE_DATA.stoneGargoyle,bytes=readFileSync(new URL('../'+art.image,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),art.sha256);assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],r.artSize);assert.equal('public/'+r.image,art.image);assert.notEqual(r.image,ROLE_DATA.gargoyle.image);assert.equal(r.thumbnail,r.image);
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),manifest=JSON.parse(readFileSync(new URL('../public/cache-manifest.js',import.meta.url),'utf8').replace(/^self.CACHE_REVISIONS=/,'').replace(/;\s*$/,''));assert.ok(sw.slice(sw.indexOf('const ASSETS'),sw.indexOf('importScripts')).includes(r.image));assert.ok(!sw.slice(sw.indexOf('const CORE'),sw.indexOf('const OPTIONAL')).includes(r.image));assert.equal(manifest[r.image],art.sha256);
});
function ready(count=12,alone=false){const s=createGame('stoneGargoyle'+count,{sheriff:false});let i=0;for(const [r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.night=2;if(alone)s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);initializeTakeover(s);return s;}
for(const count of [10,12]){
 test('SK '+count+' roles, defaults, exact copy and ordered normal classification',()=>{
  const b=BOARDS['stoneGargoyle'+count];assert.equal(Object.values(b.roles).reduce((a,n)=>a+n,0),count);assert.deepEqual(b.roles,{stoneGargoyle:1,wolf:count===12?3:2,seer:1,witch:1,gravekeeper:1,...(count===12?{hunter:1}:{}),villager:4});assert.equal(b.defaults.swallow,count===12);assert.equal(b.swallowThreshold,count===12?2:1);assert.equal(b.online,false);
  const boards=availableBoards(count,'normal').map(b=>b.id);assert.equal(boards.indexOf(b.id),boards.indexOf('kingDream'+count)+1);assert.equal(boards.indexOf('evilKnight'+count),boards.indexOf(b.id)+1);assert.equal(ROLE_DATA.gargoyle.name,'覺醒石像鬼');assert.equal(ROLE_DATA.stoneGargoyle.skill,'夜晚不與狼人相認，不能自爆。每晚可以查驗一名存活玩家的具體身分。當普通狼人全部出局後，便會回歸狼隊，接手基本狼刀。');
 });
 test('SK '+count+' first night identifies only once; full fixed first/later sequences',()=>{
  const s=createGame('stoneGargoyle'+count,{sheriff:false}),assign={};let i=1;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))assign[r]=Array.from({length:n},()=>i++);
  const ordinary=['wolves','attack','wolvesClose','witch','antidote','poison','witchClose','seer','inspect','inspectResult','seerClose','gravekeeper','gravekeeperClose',...(count===12?['hunter','gesture','hunterClose']:[])];
  assert.deepEqual(nightSteps(s),['dark','stoneIdentify','stoneIdentified',...ordinary,'stoneGargoyle','stoneInspect','stoneResult','stoneGargoyleClose','dawn']);
  const identities={stoneIdentify:'stoneGargoyle',wolves:'wolf',witch:'witch',seer:'seer',gravekeeper:'gravekeeper',hunter:'hunter'};
  go(s);go(s);assert.equal(s.step,'stoneIdentify');assert.equal(canNext(s),false);
  while(s.step!=='dawn'){
   if(identities[s.step]&&!s.rolesConfirmed)for(const target of assign[identities[s.step]])assert.equal(selectSeat(s,target),true);
   else if(['attack','antidote','poison'].includes(s.step))choose(s,'skip');
   else if(s.step==='inspect')selectSeat(s,assign.villager[0]);
   else if(s.step==='stoneGargoyle')assert.equal(selectable(s,assign.villager[0]),false);
   else if(s.step==='stoneInspect'){assert.equal(canNext(s),false);selectSeat(s,assign.stoneGargoyle[0]);assert.equal(events(s).some(e=>e.key==='stoneInspect'),false);}
   else if(s.step==='stoneResult'){assert.equal(subtitle(s),'-');assert.deepEqual(s.nightAction.stoneResult,{target:assign.stoneGargoyle[0],role:'stoneGargoyle'});}
   go(s);
  }
  assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='stoneGargoyle').length,1);assert.equal(events(s).filter(e=>e.key==='stoneInspect').length,1);assert.equal(events(s).find(e=>e.key==='stoneInspect').result,'石像鬼');assert.equal(events(s).some(e=>e.key==='basic'),false);
  s.step='nextNight';go(s);assert.deepEqual(nightSteps(s),['dark','stoneGargoyle','stoneGargoyleKnifeState','stoneInspect','stoneResult','stoneGargoyleClose',...ordinary,'dawn']);assert.equal(s.nightAction.stoneResult,null);assert.equal(s.nightAction.stoneInspect,null);
 });
 test('SK '+count+' ordinary wolves block takeover, including mid-night elimination',()=>{
  const s=ready(count);assert.equal(specialBoard(s),'stoneGargoyle');assert.equal(originalKnifeActors(s).length,count===12?3:2);assert.equal(s.takeover.actor,null);s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='stoneGargoyleKnifeState';assert.deepEqual(knifeKinds(s),[]);assert.equal(choose(s,'knife'),false);assert.equal(basicActor(s),undefined);assert.equal(trueWinner(s),null);s.step='nextNight';go(s);assert.equal(s.takeover.actor,id(s,'stoneGargoyle'));
 });
 for(const targetKind of ['self','other','empty'])test('SK '+count+' '+targetKind+' knife + required inspection commit only at close',()=>{
  const s=ready(count,true),actor=id(s,'stoneGargoyle'),target=targetKind==='self'?actor:id(s,'villager');s.step='stoneGargoyleKnifeState';choose(s,'knife');if(targetKind==='empty')choose(s,'skip');else selectSeat(s,target);assert.equal(s.nightAction.basicSubmitted,false);go(s);assert.equal(s.step,'stoneInspect');assert.equal(canNext(s),false);assert.equal(choose(s,'skip'),false);selectSeat(s,target);const caption=subtitle(s);choose(s,'knife');assert.equal(subtitle(s),caption);assert.deepEqual(s.action,targetKind==='empty'?[]:[target]);choose(s,'skill');assert.deepEqual(s.action,[target]);assert.equal(markersForSeat(s,target).filter(m=>m.type==='wolf-inspect').length,1);assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);
  go(s);assert.equal(s.step,'stoneResult');go(s);assert.equal(s.step,'stoneGargoyleClose');assert.equal(events(s).length,0);const before=JSON.stringify(s);go(s);assert.equal(s.nightAction.basicSubmitted,true);assert.equal(s.step,'wolves');assert.equal(events(s).filter(e=>e.key==='basic').length,targetKind==='empty'?0:1);assert.equal(events(s).filter(e=>e.key==='stoneInspect').length,1);assert.equal(events(s).filter(e=>e.key==='stoneKnifeState').length,1);assert.equal(events(s).find(e=>e.key==='stoneKnifeState').eligible,true);assert.equal(previous(s),true);assert.equal(JSON.stringify(s),before);go(s);go(s);assert.equal(s.step,'attack');assert.equal(subtitle(s),'選擇你們今晚要襲擊的對象');const n=structuredClone(s.nightAction);assert.equal(selectSeat(s,target),false);assert.equal(choose(s,'skip'),false);assert.deepEqual(s.nightAction,n);go(s);assert.equal(s.step,'wolvesClose');go(s);
  assert.equal(potionBlocked(s,'antidote'),targetKind==='empty'?'今晚沒有狼刀目標':'');const basic=events(s).find(e=>e.key==='basic');if(basic){assert.equal(cardModel(basic).name,'石像鬼');assert.equal(basic.actorRole,'stoneGargoyle');}
  const inspect=events(s).find(e=>e.key==='stoneInspect');assert.equal(inspect.skill,'wolf-inspect');const recorded=inspect.result;s.players[target-1].role='wolf';assert.equal(inspect.result,recorded);
 });
 test('SK '+count+' dead role retains locked fixed stages and no inspection record',()=>{
  const s=ready(count);s.players[id(s,'stoneGargoyle')-1].alive=false;s.step='stoneGargoyle';for(const step of ['stoneGargoyle','stoneGargoyleKnifeState','stoneInspect','stoneResult','stoneGargoyleClose']){assert.equal(s.step,step);assert.equal(canNext(s),true);assert.equal(selectSeat(s,id(s,'villager')),false);go(s);}assert.equal(s.nightAction.stoneResult,null);assert.ok(!events(s).some(e=>e.key==='stoneInspect'||e.key==='basic'));assert.equal(events(s).find(e=>e.key==='stoneKnifeState').result,'角色已出局');
 });
 test('SK '+count+' independent wolf victory and forbidden self explosion',()=>{
  const s=ready(count,true);s.step='discussion';assert.equal(canSelfDestruct(s),false);assert.equal(beginSelfDestruct(s),false);assert.equal(trueWinner(s),null);s.players[id(s,'stoneGargoyle')-1].alive=false;assert.equal(trueWinner(s),'好人陣營');
 });
}
for(const defense of ['none','guard','antidote','both'])test('SK existing defense resolution '+defense,()=>{
 const s=ready(12,true),target=id(s,'villager');
 // Synthetic shared-engine defense fixture: the shipped stone boards have no guard.
 if(['guard','both'].includes(defense))s.players[id(s,'seer')-1].role='guard';
 s.step='stoneGargoyleKnifeState';choose(s,'knife');selectSeat(s,target);go(s);selectSeat(s,target);go(s);go(s);go(s);if(['guard','both'].includes(defense))s.nightAction.guard=target;if(['antidote','both'].includes(defense))s.nightAction.antidote=true;const r=settleNight(s,{phase:'wolf'});assert.equal(r.events.filter(e=>e.source==='basic').length,1);assert.equal(r.deaths.some(d=>d.id===target),['none','both'].includes(defense));
});
test('SK submitted source survives its same-night death and excludes dead inspection targets',()=>{const s=ready(12,true),actor=id(s,'stoneGargoyle'),target=id(s,'villager');s.step='stoneGargoyleKnifeState';choose(s,'knife');selectSeat(s,target);go(s);s.players[target-1].alive=false;assert.equal(selectSeat(s,target),false);s.players[target-1].alive=true;selectSeat(s,target);go(s);go(s);go(s);s.players[actor-1].alive=false;assert.equal(settleNight(s,{phase:'wolf'}).events.find(e=>e.source==='basic').sourceActor,actor);});
for(const clockwise of [false,true])test('DAY-01 cached draw direction '+clockwise+'; sheriff keeps original caption',()=>{const s=ready();s.step='discussion';s.draw={seat:7,clockwise,revealed:true};assert.equal(subtitle(s),'7號玩家'+(clockwise?'順':'逆')+'時針開始發言');s.sheriff=2;assert.equal(subtitle(s),'');s.step='direction';assert.equal(subtitle(s),'警長決定警左警右');assert.equal(choose(s,'left'),false);});
test('SK same-night poison leaves first-night actor able to inspect until announcement',()=>{
 const s=ready();s.night=1;s.takeover.ready=false;s.step='poison';choose(s,'use');selectSeat(s,id(s,'stoneGargoyle'));go(s);assert.equal(s.winner,null);assert.ok(s.nightState.deaths.some(d=>d.id===id(s,'stoneGargoyle')));assert.equal(s.players[id(s,'stoneGargoyle')-1].alive,true);s.step='stoneInspect';assert.equal(selectSeat(s,id(s,'seer')),true);go(s);assert.equal(s.nightAction.stoneResult.role,'seer');go(s);go(s);assert.equal(events(s).filter(e=>e.key==='stoneInspect').length,1);
});
test('SK formal wolf victory stops remaining inspection and poison stages',()=>{
 const s=ready(12,true),seer=id(s,'seer');s.players.filter(p=>['witch','gravekeeper','hunter'].includes(p.role)).forEach(p=>p.alive=false);s.step='stoneGargoyleKnifeState';choose(s,'knife');selectSeat(s,seer);go(s);selectSeat(s,seer);go(s);go(s);go(s);assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'finished');assert.equal(next(s),false);assert.equal(events(s).some(e=>e.key==='poison'),false);
});
test('SK gravekeeper consumes the same formal exile snapshot without conversion',()=>{
 const s=ready();s.exiles=[{day:1,id:id(s,'wolf'),wolf:true}];assert.ok(nightSteps(s).includes('graveResult'));s.step='graveResult';go(s);const e=events(s).find(e=>e.key==='gravekeeper');assert.equal(e.result,'狼人');assert.equal(s.gargoyle.target,null);assert.equal(s.gargoyle.joinNight,null);
});
test('SK final ordinary wolf daytime exile grants next-night takeover only',()=>{
 const s=ready();s.night=1;s.takeover.ready=false;const wolves=s.players.filter(p=>p.role==='wolf');wolves.slice(1).forEach(p=>p.alive=false);s.step='exileVote';s.votePool=s.players.filter(p=>p.active&&p.alive).map(p=>p.id);selectSeat(s,wolves[0].id);go(s);assert.equal(s.winner,null);while(s.step!=='nextNight'){assert.ok(['lastWords','eliminated'].includes(s.step));go(s);}go(s);assert.equal(s.night,2);assert.equal(s.takeover.actor,id(s,'stoneGargoyle'));
});
