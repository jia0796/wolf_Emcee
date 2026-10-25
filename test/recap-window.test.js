import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,choose,previous,upgradeGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {recapTimeline,patrolRecapEvent} from '../public/recap.js';
import {recapSnapshot} from '../public/online-state.js';

function patrol(context='day'){
 const s=createGame('awakenedBeauty12',{sheriff:false});let i=0;
 for(const [role,count]of Object.entries(BOARDS[s.boardId].roles))for(let j=0;j<count;j++)s.players[i++].role=role;
 s.rolesConfirmed=true;s.deathsCommitted=true;s.night=2;s.players[7].alive=false;s.step='eliminated';s.queue=[{id:8,cause:context==='day'?'exile':'attack',context,day:2}];s.continuation='nextNight';s.operation='native';Object.assign(s.awb,{target:9,linkNight:2,lastUsedNight:2});return s;
}
test('saved day patrol projects hunter -> beauty and beauty -> substitute as two cards; actual death unchanged',()=>{
 const s=patrol(),before=structuredClone(s);choose(s,'patrol:1');assert.equal(next(s),true);
 const saved=structuredClone(s),raw=s.dayEvents.find(e=>e.key==='awakenedPatrol');assert.deepEqual(raw.rawTargets,[9]);assert.equal(raw.encountered,1);
 const events=recapTimeline(s).find(e=>e.kind==='day').events;
 assert.equal(events.length,2);assert.deepEqual(events.map(e=>[e.actors[0],e.rawTargets[0]]),[[8,1],[1,9]]);assert.equal(events[0].targetSnapshots[0].role,'awakenedBeauty');assert.equal(events[1].type,'awakenedSubstitute');
 assert.equal(s.players[0].alive,true);assert.equal(s.players[8].alive,false);assert.deepEqual(s,saved);assert.deepEqual(upgradeGame(JSON.parse(JSON.stringify(s))),s);
 previous(s);assert.deepEqual(s,{...before,choice:'patrol:1'});
});
test('shared online recap projects same saved two cards without modifying payload',()=>{
 const s=patrol();choose(s,'patrol:1');assert.equal(next(s),true);s.step='finished';s.winner='好人陣營';s.winnerReason='測試';const view=recapSnapshot(s),before=JSON.stringify(view);
 assert.deepEqual(recapTimeline(view).find(e=>e.kind==='day').events.map(e=>e.rawTargets),[[1],[9]]);assert.equal(JSON.stringify(view),before);
});
test('night patrol keeps direct beauty target and no substitution card',()=>{
 const s=patrol('night');choose(s,'patrol:1');assert.equal(next(s),true);const events=recapTimeline(s).find(e=>e.kind==='day').events;
 assert.equal(events.length,1);assert.deepEqual(events[0].rawTargets,[1]);assert.equal(s.players[0].alive,false);assert.equal(s.players[8].alive,true);
});
const source={key:'awakenedPatrol',encountered:1,rawTargets:[9],effectiveTargets:[9],targetSnapshots:[{id:9,role:'villager'}]},receipt={type:'awakenedSubstitute',actors:[1],rawTargets:[9],actorSnapshots:[{id:1,role:'awakenedBeauty'}]};
for(const [name,change]of [
 ['missing encountered',e=>delete e.encountered],['missing actor snapshot',(e,r)=>r.actorSnapshots=[]],['unexecuted substitution',(e,r)=>r.executed=false],['different target',(e,r)=>r.rawTargets=[10]],['different actor',(e,r)=>r.actors=[2]]
])test('legacy or unrelated patrol does not invent a beauty target: '+name,()=>{const e=structuredClone(source),r=structuredClone(receipt);change(e,r);const before=structuredClone([e,r]);assert.equal(patrolRecapEvent(e,r),e);assert.deepEqual([e,r],before);});
