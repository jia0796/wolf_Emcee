import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {createGame,selectSeat,choose,next,previous,upgradeGame,potionBlocked} from '../public/engine.js';
import {basicActor,ordinaryWolves,settleNight,trueWinner} from '../public/night.js';
import {initializeTakeover,specialBoard} from '../public/takeover.js';
function ready(board='awakenedBeauty12'){
 const s=createGame(board,{sheriff:false});let i=0;for(const[role,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;
 s.rolesConfirmed=true;s.night=2;s.deathsCommitted=true;return s;
}
function solo(){const s=ready();for(const p of s.players)if(p.role==='wolf')p.alive=false;s.step='attack';return s;}
for(const b of Object.values(BOARDS).filter(b=>b.enabled))for(const role of Object.keys(b.roles).filter(r=>ROLE_DATA[r].kind==='wolf'))test('all-board single-wolf knife audit '+b.id+' / '+role,()=>{
 const s=ready(b.id),actor=s.players.find(p=>p.role===role);for(const p of s.players)if(p.active&&ROLE_DATA[p.role]?.kind==='wolf'&&p.id!==actor.id)p.alive=false;
 if(role==='younger')s.brothers.joinNight=2;initializeTakeover(s);
 if(role==='hiddenWolf'){assert.equal(basicActor(s),undefined);assert.equal(trueWinner(s),'好人陣營');return;}
 assert.equal(basicActor(s)?.id,actor.id,'surviving legal wolf must own the knife');
 const special=['mechanical','mask','fragrance','stoneGargoyle'].includes(role),target=s.players.find(p=>p.active&&p.alive&&p.role==='villager').id;
 s.step=special?specialBoard(s)+'KnifeState':'attack';if(special)assert.equal(choose(s,'knife'),true);
 assert.equal(selectSeat(s,target),true);if(role==='seedWolf')assert.equal(choose(s,'declineInfection'),true);if(special)s.step=specialBoard(s)+'Close';assert.equal(next(s),true);
 const r=settleNight(s);assert.equal(r.events.filter(e=>e.source==='basic').length,1);assert.ok(r.deaths.some(d=>d.id===target));
});
test('awakened beauty participates in the original joint wolf attack and its saved actors',()=>{
 const s=ready();s.step='attack';assert.deepEqual(ordinaryWolves(s).map(p=>p.id),[1,2,3,4]);assert.equal(selectSeat(s,9),true);assert.equal(next(s),true);assert.deepEqual(s.nightRecords.find(r=>r.night===2).events.find(e=>e.key==='basic').actors,[1,2,3,4]);
});
for(const mode of ['ready','cooldown','spent'])test('solo awakened beauty keeps knife when charm is '+mode+'; refresh, previous and replay preserve one attack',()=>{
 const s=solo();if(mode==='cooldown')s.awb.lastUsedNight=1;if(mode==='spent')s.awb.used=true;assert.equal(trueWinner(s),null);assert.equal(selectSeat(s,1),false);assert.equal(selectSeat(s,9),true);
 const selected=structuredClone(s),loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);assert.equal(basicActor(loaded)?.role,'awakenedBeauty');assert.equal(next(s),true);assert.equal(s.step,'wolvesClose');
 const record=s.nightRecords.find(r=>r.night===2).events.find(e=>e.key==='basic');assert.deepEqual(record.actors,[1]);assert.equal(record.actorRole,'awakenedBeauty');assert.equal(record.portraitRole,'awakenedBeauty');assert.equal(potionBlocked(s,'antidote'),'');
 assert.equal(settleNight(s).events.filter(e=>e.source==='basic').length,1);assert.ok(settleNight(s).deaths.some(d=>d.id===9));assert.equal(next(s),true);assert.equal(s.nightRecords.find(r=>r.night===2).events.filter(e=>e.key==='basic').length,1);
 previous(s);previous(s);assert.deepEqual(s,selected);assert.equal(next(s),true);assert.equal(s.nightRecords.find(r=>r.night===2).events.filter(e=>e.key==='basic').length,1);
});
test('solo awakened beauty empty knife creates no fake hit; self knife and self destruct stay forbidden',()=>{
 const s=solo();assert.equal(choose(s,'skip'),true);assert.equal(next(s),true);assert.equal(settleNight(s).events.filter(e=>e.source==='basic').length,0);assert.equal(s.nightRecords.find(r=>r.night===2)?.events.some(e=>e.key==='basic')??false,false);s.step='selfDestruct';assert.equal(selectSeat(s,1),false);
});
test('solo awakened beauty basic attack still obeys guard and antidote',()=>{
 for(const defense of ['guard','antidote']){const s=solo();if(defense==='guard')s.nightAction.guard=9;else s.nightAction.antidote=true;assert.equal(selectSeat(s,9),true);assert.equal(next(s),true);const r=settleNight(s);assert.equal(r.deaths.some(d=>d.id===9),false);assert.equal(r.events.find(e=>e.source==='basic').blocked,defense);}
});
test('dead awakened beauty supplies neither knife nor false continuation of wolf victory',()=>{
 const s=solo();s.players[0].alive=false;assert.equal(basicActor(s),undefined);assert.equal(selectSeat(s,9),false);assert.equal(trueWinner(s),'好人陣營');
});
test('loading a prior recorded joint knife does not invent the formerly missing participant',()=>{
 const s=ready();s.nightRecords=[{night:1,events:[{key:'basic',skill:'wolf-attack',actors:[2,3,4],actorRole:'wolf',rawTargets:[9],effectiveTargets:[9],executed:true,actorSnapshots:[{id:2,role:'wolf'}],targetSnapshots:[{id:9,role:'villager'}]}],deaths:[],settled:true}];
 const old=structuredClone(s.nightRecords);const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.nightRecords,old);assert.deepEqual(s.nightRecords,old);assert.ok(ordinaryWolves(restored).some(p=>p.role==='awakenedBeauty'));
});
