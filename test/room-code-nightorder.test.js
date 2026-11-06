import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,upgradeGame,previous,nightSteps,next,selectSeat} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {normalizeRoomCode,validRoomCode} from '../public/join-room.js';
const ready=()=>{const s=createGame('mechanical12');let i=0;for(const [role,n]of Object.entries(BOARDS.mechanical12.roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;return s;};
for(const [old,now]of [['mechanicalFirstGesture','mechanicalClose'],['mechanicalHunter','hunterClose'],['mechanicalHunterGesture','hunterClose'],['mechanicalHunterClose','hunterClose']])test('removed stage restores and undo preserves pending state: '+old,()=>{
 const s=ready();s.night=old==='mechanicalFirstGesture'?1:2;s.step=old;s.nightAction.learnTarget=6;
 const before=JSON.stringify(s);s.history.push(structuredClone({...s,history:undefined}));
 const upgraded=upgradeGame(s);assert.equal(upgraded.step,now);assert.equal(upgraded.nightAction.learnTarget,6);assert.equal(upgraded.history[0].step,old);assert.equal(s.step,old);
 previous(upgraded);assert.equal(upgraded.step,now);assert.equal(upgraded.nightAction.learnTarget,6);assert.equal(upgraded.history.length,0);assert.equal(JSON.parse(before).step,old);
});
test('legacy pending first-night hunter learning is committed exactly once on close',()=>{
 let s=ready();s.step='mechanicalLearn';const hunter=s.players.find(p=>p.role==='hunter').id;selectSeat(s,hunter);assert.ok(next(s));s.step='mechanicalFirstGesture';s=upgradeGame(s);assert.equal(s.step,'mechanicalClose');assert.equal(s.mechanical.role,null);assert.ok(next(s));assert.equal(s.mechanical.role,'hunter');assert.equal(s.nightRecords.flatMap(r=>r.events).filter(e=>e.key==='learn').length,1);
});
test('short code case and trim; reject ambiguous characters, non-ASCII and wrong length',()=>{
 assert.equal(normalizeRoomCode(' a78b2 '),'A78B2');assert.ok(validRoomCode('a78b2'));for(const s of ['A1BCD','A0BCD','AOBCD','AIBCD','ALBCD','A B2C','Ａ78B2','A78B','A78B22','<img>'])assert.equal(validRoomCode(s),false,s);
});
test('mechanical hunter phase absent from all new night sequences',()=>{
 for(const n of [1,2,3,10]){const s=ready();s.night=n;assert.ok(!nightSteps(s).some(k=>k==='mechanicalFirstGesture'||k.startsWith('mechanicalHunter')));}
});
