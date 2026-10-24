import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {createGame,next,choose,selectSeat,selectable,canNext,previous,upgradeGame,restartGame,nightSteps,subtitle,gunSources,hasLastWords,isPatrol} from '../public/engine.js';
import {settleNight} from '../public/night.js';
import {recapTimeline,finalIdentityModel} from '../public/recap.js';
import {recapSnapshot} from '../public/online-state.js';
import {awakeningState,charmAvailable,substituteBatch,consumeSubstitute,patrolPlan} from '../public/awakening.js';
const go=s=>assert.equal(next(s),true,s.step);
function ready(){const s=createGame('awakenedBeauty12',{sheriff:false});let i=0;for(const[r,n]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.deathsCommitted=true;return s;}
function link(s,target=9){Object.assign(s.awb,{target,linkNight:s.night,lastUsedNight:s.night});return s;}
function patrol(context='night',night=2){const s=ready();s.night=night;s.players[7].alive=false;s.step='eliminated';s.queue=[{id:8,cause:context==='night'?'attack':'exile',context,day:night}];s.continuation='nextNight';s.operation='native';return s;}
test('AWB independent exact configuration, no ordinary beauty rules, exact text and fixed night order',()=>{
 const b=BOARDS.awakenedBeauty12,s=ready();assert.equal(b.category,'special');assert.deepEqual(b.roles,{awakenedBeauty:1,wolf:3,seer:1,witch:1,guard:1,awakenedHunter:1,villager:4});assert.equal(s.rules.poisonRomance,undefined);assert.equal(s.rules.lastWolfRomance,undefined);
 const steps=nightSteps(s);assert.ok(steps.indexOf('guard')<steps.indexOf('wolves'));assert.ok(steps.indexOf('wolvesClose')<steps.indexOf('awakenedBeauty'));assert.ok(steps.indexOf('awakenedBeautyClose')<steps.indexOf('witch'));assert.ok(steps.indexOf('seerClose')<steps.indexOf('awakenedHunter'));
 const script={awakenedBeauty:'覺醒狼美人請睜眼',awakenedCharm:'選擇你今晚要魅惑的對象',awakenedBeautyClose:'覺醒狼美人請閉眼',awakenedHunter:'覺醒獵人請睜眼',patrolGesture:'今晚的巡獵手勢',awakenedHunterClose:'覺醒獵人請閉眼'};for(const[step,text]of Object.entries(script)){s.step=step;assert.equal(subtitle(s),text);}
 assert.equal(ROLE_DATA.awakenedHunter.skill,'遭放逐、狼刀出局時，可選擇自身左右方向發動巡獵，帶走該方向最近的一名狼人。');
 assert.equal(ROLE_DATA.awakenedBeauty.skill,'夜晚與其他狼人共同睜眼並參與狼刀，不能自刀或自爆。夜晚可魅惑一名其他存活玩家，當自己即將出局時，由當晚被魅惑的玩家替死。發動魅惑後下一晚無法再次魅惑。一旦觸發替死，魅惑能力將永久失效。');
});
test('AWB first night original identity registration and complete fixed stages',()=>{
 const s=createGame('awakenedBeauty12',{sheriff:false});go(s);go(s);assert.equal(s.step,'guard');selectSeat(s,7);go(s);choose(s,'skip');go(s);go(s);assert.equal(s.step,'wolves');for(const id of [1,2,3,4])assert.equal(selectSeat(s,id),true);assert.equal(s.players[0].role,'awakenedBeauty');go(s);choose(s,'skip');go(s);go(s);assert.equal(s.step,'awakenedBeauty');go(s);selectSeat(s,9);go(s);go(s);assert.equal(s.step,'witch');selectSeat(s,6);go(s);go(s);choose(s,'skip');go(s);go(s);selectSeat(s,5);go(s);selectSeat(s,1);go(s);go(s);go(s);assert.equal(s.step,'awakenedHunter');selectSeat(s,8);go(s);assert.equal(s.step,'patrolGesture');go(s);go(s);assert.equal(s.step,'dawn');assert.equal(s.rolesConfirmed,true);assert.equal(s.players.filter(p=>p.role==='villager').length,4);
});
test('charm targets, teammate, skip, cooldown and link expiry follow actual commits',()=>{
 const s=ready();s.step='awakenedCharm';assert.equal(canNext(s),false);assert.equal(selectSeat(s,1),false);assert.equal(selectSeat(s,2),true);assert.equal(s.awb.target,null);go(s);assert.equal(s.awb.target,2);assert.equal(s.awb.lastUsedNight,1);
 s.step='nextNight';go(s);assert.equal(s.night,2);assert.equal(s.awb.target,null);s.step='awakenedCharm';assert.equal(selectSeat(s,9),false);assert.equal(canNext(s),true);go(s);s.step='nextNight';go(s);s.step='awakenedCharm';choose(s,'skip');go(s);assert.equal(s.awb.lastUsedNight,1);s.step='nextNight';go(s);assert.equal(charmAvailable(s),true);
});
test('AWB no self-knife or self-explosion; dead and spent roles retain fixed stages',()=>{
 const s=ready();for(const step of ['attack','selfDestruct']){s.step=step;assert.equal(selectSeat(s,1),false);}for(const reason of ['dead','spent']){const x=ready();if(reason==='dead'){x.players[0].alive=false;x.players[7].alive=false;}else x.awb.used=true;x.night=3;x.step='awakenedCharm';assert.equal(canNext(x),true);assert.equal(selectSeat(x,9),false);assert.equal(choose(x,'skip'),false);for(const step of ['awakenedBeauty','awakenedCharm','awakenedBeautyClose','awakenedHunter','patrolGesture','awakenedHunterClose'])assert.ok(nightSteps(x).includes(step));}
});
for(const same of [false,true])test('night substitute retains independent damage and deduplicates death '+same,()=>{
 const s=link(ready()),deaths=[{id:1,cause:'poison'},...(same?[{id:9,cause:'poison'}]:[])],events=deaths.map(d=>({...d,blocked:null})),r=substituteBatch(s,deaths,events,{batch:'night:1:post'});assert.deepEqual(r.deaths.map(d=>d.id),[9]);assert.equal(r.events.filter(e=>e.source==='awakenedSubstitute').length,1);assert.equal(r.events.find(e=>e.id===1).blocked,'awakenedSubstitute');assert.equal(s.awb.used,false);consumeSubstitute(s,r.receipt);assert.equal(s.awb.used,true);assert.equal(charmAvailable(s),false);
});
test('same-night earlier corpse still substitutes; daytime corpse cannot substitute',()=>{
 const s=link(ready());s.players[8].alive=false;s.nightState.deaths=[{id:9,cause:'attack',context:'night'}];const r=substituteBatch(s,[{id:1,cause:'poison'}],[],{batch:'night:1:post'});assert.ok(r.receipt);assert.equal(r.deaths.length,0);const day=substituteBatch(s,[{id:1,cause:'exile'}],[],{context:'day',batch:'day:1'});assert.equal(day.receipt,null);assert.equal(day.deaths[0].id,1);
});
test('one substitution protects a complete batch, receipt replays, separate batch kills normally',()=>{
 const s=link(ready()),deaths=[{id:1,cause:'attack'},{id:1,cause:'poison'}],r=substituteBatch(s,deaths,deaths,{batch:'night:1:test'});assert.equal(r.deaths.length,1);assert.deepEqual(r.receipt.causes,['attack','poison']);consumeSubstitute(s,r.receipt);assert.equal(substituteBatch(s,deaths,deaths,{batch:'night:1:test'}).deaths[0].id,9);assert.equal(substituteBatch(s,[{id:1,cause:'poison'}],[],{batch:'night:1:later'}).receipt,null);
});
test('real poison-stage commit, defense bypass, two cards, repeat projection, undo and refresh',()=>{
 const s=link(ready());s.step='poison';s.nightAction.guard=9;s.nightAction.poison=true;s.nightAction.poisonTarget=1;s.action=[1];const before=structuredClone(s);go(s);assert.equal(s.awb.used,true);assert.equal(s.nightState.deaths.some(d=>d.id===1),false);assert.equal(s.nightState.deaths.filter(d=>d.id===9).length,1);assert.equal(s.nightRecords[0].events.some(e=>e.key.startsWith('awakenedSubstitute:')),true);assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);const saved=structuredClone(s);settleNight(s);settleNight(s);assert.deepEqual(s,saved);previous(s);assert.deepEqual(s,before);
});
test('earlier wolf kill and later poison preserve a single actual corpse and separate substitute event',()=>{
 const s=link(ready());s.nightAction.attack=9;s.nightAction.antidote=false;s.step='poison';s.nightAction.poison=true;s.nightAction.poisonTarget=1;s.action=[1];go(s);assert.equal(s.awb.used,true);assert.deepEqual(s.nightState.deaths.map(d=>d.id),[9]);assert.equal(s.nightState.deaths[0].cause,'attack');assert.equal(s.nightRecords[0].events.filter(e=>e.key.startsWith('awakenedSubstitute:')).length,1);
});
test('night substitution death blocks awakened hunter even if another hit killed it too',()=>{
 const s=link(ready(),8);s.nightAction.attack=8;s.nightAction.antidote=false;s.step='poison';s.nightAction.poison=true;s.nightAction.poisonTarget=1;s.action=[1];go(s);assert.deepEqual(gunSources(s,{id:8,cause:'attack',context:'night',day:1}),[]);
});
test('day exile preserves original vote, queues actual substitute, inherits words, bypasses defenses',()=>{
 const s=link(ready());s.night=2;s.awb.linkNight=2;s.step='exileVote';s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);s.nightAction.guard=9;s.nightAction.antidote=true;selectSeat(s,1);go(s);assert.equal(s.players[0].alive,true);assert.equal(s.players[8].alive,false);assert.equal(s.queue[0].id,9);assert.equal(s.step,'lastWords');assert.deepEqual(s.dayEvents.find(e=>e.type==='exile').rawTargets,[1]);assert.deepEqual(s.dayEvents.find(e=>e.type==='awakenedSubstitute').rawTargets,[9]);assert.equal(s.exiles[0].id,1);assert.match(subtitle(s),/9號玩家/);
});
test('night and day patrol context derive from original death rather than operation time',()=>{
 for(const context of ['night','day']){const s=link(patrol(context),3),r=patrolPlan(s,1);assert.equal(r.context,context);assert.equal(r.target,context==='night'?1:3);assert.equal(r.substitute,context==='day');}
});
test('patrol chooses first living wolf, skips good/dead, wraps seats and can cancel direction',()=>{
 const s=patrol();assert.equal(isPatrol(s),true);assert.equal(canNext(s),false);assert.equal(selectSeat(s,4),false);assert.equal(patrolPlan(s,-1).target,4);s.players[3].alive=false;assert.equal(patrolPlan(s,-1).target,3);assert.equal(patrolPlan(s,1).target,1);choose(s,'patrol:1');assert.equal(canNext(s),true);choose(s,'patrol:1');assert.equal(canNext(s),false);choose(s,'skip');assert.equal(canNext(s),true);choose(s,'gun:native');assert.equal(canNext(s),false);
});
test('day patrol chases linked seat past other wolves; dead linked seat means beauty itself',()=>{
 const s=link(patrol('day'),3);assert.equal(patrolPlan(s,1).target,3);s.players[2].alive=false;assert.equal(patrolPlan(s,1).target,1);
});
for(const context of ['night','day'])test(context+' patrol submission consumes once and preserves exact undo/history',()=>{
 const s=link(patrol(context),9);choose(s,'patrol:1');const before=structuredClone(s);go(s);assert.equal(s.dayEvents.filter(e=>e.key==='awakenedPatrol').length,1);assert.equal(s.players[(context==='night'?1:9)-1].alive,false);assert.equal(s.players[0].alive,context==='day');assert.equal(s.awb.used,context==='day');assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);previous(s);assert.deepEqual(s,before);
});
test('explicit no patrol records choice without death, no automatic abandonment',()=>{
 const s=patrol();assert.equal(next(s),false);choose(s,'skip');go(s);assert.equal(s.dayEvents[0].result,'不巡獵');assert.deepEqual(s.dayEvents[0].rawTargets,[]);assert.equal(s.players.filter(p=>!p.alive).length,1);
});
test('night poison, substitute, non-qualified causes and formal end never gain patrol',()=>{
 const s=ready();for(const cause of ['poison','awakenedSubstitute','shot','heartbreak','selfDestruct','duel'])assert.deepEqual(gunSources(s,{id:8,cause,context:'night',day:2}),[]);for(const cause of ['attack','exile'])assert.deepEqual(gunSources(s,{id:8,cause,context:cause==='attack'?'night':'day',day:2}),['native']);s.winner='好人陣營';assert.deepEqual(gunSources(s,{id:8,cause:'attack',context:'night'}),[]);
});
test('patrol inserts new death ahead of remaining batch, first night words, then returns',()=>{
 const s=patrol('night',1);s.queue.push({id:10,cause:'attack',context:'night',day:1});s.players[9].alive=false;choose(s,'patrol:-1');go(s);assert.equal(s.queue[0].id,4);assert.equal(s.step,'lastWords');go(s);assert.equal(s.queue[0].id,10);assert.equal(s.step,'lastWords');assert.equal(hasLastWords(s,{id:4,cause:'shot',day:2,sourceRole:'awakenedHunter',skillSource:'native',shooterCause:'attack',shooterContext:'night'}),false);
});
test('substitute inherits exile and native patrol words only once; original hunter unchanged',()=>{
 const s=ready();s.night=2;assert.equal(hasLastWords(s,{cause:'awakenedSubstitute',originalCause:'exile',day:2}),true);assert.equal(hasLastWords(s,{cause:'awakenedSubstitute',originalCause:'poison',day:2}),false);assert.equal(hasLastWords(s,{cause:'awakenedSubstitute',originalCause:'shot',shooterRole:'awakenedHunter',skillSource:'native',shooterCause:'exile',shooterContext:'day',day:2}),true);
});
test('AWB player recap transport preserves all final identities/events and restart resets ability',()=>{
 const s=link(ready());s.step='finished';s.winner='好人陣營';assert.deepEqual(recapTimeline(recapSnapshot(s)),recapTimeline(s));assert.deepEqual(finalIdentityModel(recapSnapshot(s)),finalIdentityModel(s));assert.deepEqual(restartGame(s).awb,awakeningState());
});
test('last ordinary wolf absent: beauty substitute prevents a false good win, real last-wolf death stops skills',()=>{
 const s=link(ready());s.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);s.step='poison';s.nightAction.poison=true;s.nightAction.poisonTarget=1;s.action=[1];go(s);assert.equal(s.winner,null);assert.equal(s.awb.used,true);assert.equal(s.nightState.deaths.some(d=>d.id===1),false);
 const x=patrol('night');x.players.filter(p=>p.role==='wolf').forEach(p=>p.alive=false);choose(x,'patrol:1');go(x);assert.equal(x.winner,'好人陣營');assert.equal(x.step,'finished');assert.equal(next(x),false);
});
test('substitute to the last civilian applies wolves victory before extra words or patrol',()=>{
 const s=link(ready());s.players.filter(p=>p.role==='villager'&&p.id!==9).forEach(p=>p.alive=false);s.step='exileVote';s.votePool=s.players.filter(p=>p.alive).map(p=>p.id);selectSeat(s,1);go(s);assert.equal(s.winner,'狼人陣營');assert.equal(s.step,'finished');assert.equal(s.players[0].alive,true);assert.equal(s.players[8].alive,false);
});
test('spent charm never protects a later independent daytime death and link never carries another night',()=>{
 const s=link(ready());consumeSubstitute(s,{actor:1,target:9,night:1,context:'night',batch:'night:1:post',causes:['poison']});s.step='exileVote';s.votePool=s.players.map(p=>p.id);selectSeat(s,1);go(s);assert.equal(s.players[0].alive,false);
 const x=link(ready());x.step='nextNight';go(x);assert.equal(substituteBatch(x,[{id:1,cause:'poison'}],[],{batch:'night:2:post'}).receipt,null);
});
test('AWB approved illustrations have exact hashes and alpha without replacing originals',async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto'),{CATALOG_CLEAR}=await import('../public/catalog-art.js'),assets=JSON.parse(await readFile(new URL('../docs/awb-assets.json',import.meta.url)));
 assert.equal(assets.length,2);for(const a of assets){const bytes=await readFile(new URL('../'+a.path,import.meta.url));assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(bytes[25],6);assert.equal(CATALOG_CLEAR[a.id],ROLE_DATA[a.id].image);}
});

