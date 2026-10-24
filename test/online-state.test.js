import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS} from '../public/data.js';
import {createDealtGame,recapSnapshot,validateRecap} from '../public/online-state.js';
import {recapTimeline,finalIdentityModel} from '../public/recap.js';

function receipt(board){return {boardId:board.id,status:'dealt',dealId:'committed-deal',hostRoles:Object.entries(board.roles).flatMap(([role,n])=>Array(n).fill(role)).map((role,i)=>({seat:i+1,role})).reverse()};}
function finished(id='12'){const board=BOARDS[id],s=createDealtGame({boardId:id},receipt(board));s.step='finished';s.winner='好人陣營';s.winnerReason='測試正式終局';return s;}
test('online committed deal imports exact seats for all current boards without a shuffle',()=>{
 for(const b of Object.values(BOARDS).filter(b=>b.enabled)){const r=receipt(b),before=structuredClone(r),s=createDealtGame({boardId:b.id,rules:{sheriff:false}},r);assert.deepEqual(r,before);assert.equal(s.rolesConfirmed,true);assert.equal(s.step,'confirm');assert.deepEqual(s.history,[]);for(const row of r.hostRoles)assert.equal(s.players.find(p=>p.id===row.seat).role,row.role);assert.equal(s.players.filter(p=>p.active).length,b.playerCount);}
});
test('partial, repeated, uncommitted and mismatched server assignments are rejected',()=>{
 const b=BOARDS['12'],r=receipt(b);for(const alter of [x=>x.status='waiting',x=>x.boardId='10',x=>x.dealId=null,x=>x.hostRoles.pop(),x=>x.hostRoles[0].seat=x.hostRoles[1].seat,x=>x.hostRoles[0].role=x.hostRoles[0].role==='wolf'?'villager':'wolf',x=>x.hostRoles[0].role='unknown']){const wrong=structuredClone(r);alter(wrong);assert.throws(()=>createDealtGame({boardId:b.id},wrong));}
});
test('recap transport retains the renderer model but excludes nested undo history and live actions',()=>{
 const s=finished('fragrance12');s.history=[{secret:'unrelated undo snapshot'}];s.nightAction={secret:'live input'};s.nightRecords=[{night:1,settled:true,events:[],deaths:[]}];
 const before=structuredClone(s),view=recapSnapshot(s);assert.ok(!Object.hasOwn(view,'history'));assert.ok(!Object.hasOwn(view,'nightAction'));assert.deepEqual(recapTimeline(view),recapTimeline(s));assert.deepEqual(finalIdentityModel(view),finalIdentityModel(s));assert.deepEqual(s,before);
});
test('infection, conversion and mechanical identity details survive recap projection',()=>{
 for(const id of ['seedHidden12','gargoyle12','mechanical12']){const s=finished(id),p=s.players.find(p=>p.role==='villager');if(id==='seedHidden12')s.infection={...s.infection,target:p.id,success:true,usedNight:1};if(id==='gargoyle12')s.gargoyle={...s.gargoyle,target:p.id,transformedNight:1};if(id==='mechanical12')s.mechanical={...s.mechanical,role:'hunter',night:1};s.night=2;assert.deepEqual(finalIdentityModel(recapSnapshot(s)),finalIdentityModel(s));}
});
test('recap person artwork is confined to approved local assets without changing the host state',()=>{
 const s=finished();s.dayEvents=[{type:'exile',actorSnapshots:[{role:'wolf',image:'https://example.invalid/tracker'}],targetSnapshots:[{role:'seer',image:'javascript:bad'}]}];const view=recapSnapshot(s);assert.equal(view.dayEvents[0].actorSnapshots[0].image,'art/catalog/wolf.png');assert.equal(view.dayEvents[0].targetSnapshots[0].image,'art/catalog/seer.png');assert.equal(s.dayEvents[0].actorSnapshots[0].image,'https://example.invalid/tracker');
});
test('unfinished, malformed or unknown recap data cannot open a player recap',()=>{
 const s=finished();for(const alter of [x=>x.step='attack',x=>x.winner=null,x=>x.players.pop(),x=>x.players[0].role='unknown',x=>x.players[0].id=x.players[1].id,x=>x.nightRecords=null,x=>x.dayEvents=null]){const bad=structuredClone(s);alter(bad);assert.throws(()=>validateRecap(bad));}
});
