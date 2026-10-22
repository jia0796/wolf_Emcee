import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARDS} from '../public/data.js';
import {createGame,next,previous,upgradeGame,restartGame,selectSeat,choose,canNext,deathSkill,gunSources,nightSteps,subtitle,mechanicalGunGesture} from '../public/engine.js';
import {settleNight,attackProtection} from '../public/night.js';
const ready=(board='classic12',rules={})=>{const s=createGame(board,rules);let i=0;for(const[r,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;return s;};
const id=(s,r)=>s.players.find(p=>p.role===r).id;
const go=s=>assert.equal(next(s),true,'blocked '+s.step);
const reload=s=>upgradeGame(JSON.parse(JSON.stringify(s)));
function death(s,role,cause='attack',night=1){s.night=night;s.step='announcement';s.deaths=[{id:id(s,role),cause}];go(s);return s;}
for(const night of [1,2,4])for(const source of ['hunter','mechanical','lucky'])test(`DSK ${source} night ${night}: explicit input, cancel, modes, reload, undo and one shot`,()=>{
 let s=ready(source==='mechanical'?'mechanical12':source==='lucky'?'brothers12':'classic12');const role=source==='lucky'?'villager':source;
 if(source==='mechanical')Object.assign(s.mechanical,{role:'hunter',night:1});
 if(source==='lucky')s.lucky={seat:id(s,role),ability:'gun',remaining:1,unlockDay:1};
 death(s,role,'attack',night);assert.equal(s.step,night===1?'lastWords':'eliminated');assert.equal(deathSkill(s),true);assert.equal(s.operation,source==='lucky'?'lucky':'native');assert.deepEqual(s.action,[]);
 const before=JSON.stringify(s);assert.equal(next(s),false);assert.equal(JSON.stringify(s),before);
 choose(s,'skip');assert.equal(canNext(s),true);assert.equal(reload(s).choice,'skip');
 choose(s,'gun:'+s.operation);assert.equal(canNext(s),false);const target=id(s,'wolf');selectSeat(s,target);assert.equal(canNext(s),true);selectSeat(s,target);assert.equal(canNext(s),false);
 s=reload(s);assert.equal(canNext(s),false);selectSeat(s,target);s=reload(s);assert.equal(canNext(s),true);const actor=s.queue[0].id;go(s);
 assert.equal(s.players[target-1].alive,false);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,1);assert.equal(s.dayEvents.find(e=>e.type==='shot').actors[0],actor);
 previous(s);assert.equal(s.players[target-1].alive,true);assert.deepEqual(s.action,[target]);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,0);go(s);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,1);
});
for(const night of [1,2])for(const cause of ['poison','dreamRepeat','dreamLink','heartbreak'])test(`DSK ${cause} night ${night} has no gun/no added page`,()=>{
 const s=ready();death(s,'hunter',cause,night);assert.equal(deathSkill(s),false);if(night===2)assert.equal(s.step,'dayDraw');else{assert.ok(['lastWords','eliminated'].includes(s.step));go(s);assert.equal(s.step,'dayDraw');}assert.equal(s.dayEvents.some(e=>e.type==='shot'),false);
});
test('DSK explicit no-shot does not attack and only consumes on next; fear and terminal forbid guns',()=>{
 const s=death(ready(),'hunter');choose(s,'skip');assert.deepEqual(gunSources(s,s.queue[0]),['native']);go(s);assert.equal(s.dayEvents.some(e=>e.type==='shot'),false);assert.equal(s.step,'dayDraw');previous(s);assert.equal(s.choice,'skip');assert.deepEqual(gunSources(s,s.queue[0]),['native']);
 const feared=ready('nightmare12');feared.nightAction.fear=id(feared,'hunter');feared.nightAction.fearApplied=true;death(feared,'hunter');assert.equal(deathSkill(feared),false);
 const terminal=ready();terminal.players.filter(p=>['seer','witch','idiot'].includes(p.role)).forEach(p=>p.alive=false);death(terminal,'hunter');assert.equal(terminal.step,'finished');assert.equal(deathSkill(terminal),false);assert.equal(next(terminal),false);
});
test('DSK native then lucky gun each needs a decision on the same death page',()=>{
 const s=ready('brothers12'),hunter=id(s,'hunter');s.lucky={seat:hunter,ability:'gun',remaining:1,unlockDay:1};death(s,'hunter');assert.deepEqual(gunSources(s,s.queue[0]),['native','lucky']);choose(s,'skip');go(s);assert.equal(s.step,'lastWords');assert.equal(s.operation,'lucky');assert.equal(canNext(s),false);assert.equal(s.lucky.remaining,1);choose(s,'skip');go(s);assert.equal(s.lucky.remaining,0);assert.equal(s.step,'dayDraw');
});
test('DSK exile uses existing last words and old skill save/history preserves pending selections',()=>{
 let s=ready();s.step='exileVote';s.votePool=s.players.map(p=>p.id);selectSeat(s,id(s,'hunter'));go(s);assert.equal(s.step,'lastWords');assert.equal(canNext(s),false);
 s.step='skill';s.queue[0].noticeDone=true;selectSeat(s,id(s,'wolf'));const snap=structuredClone(s);delete snap.history;s.history.push(snap);const originalHistory=JSON.stringify(s.history);s=reload(s);assert.equal(s.step,'lastWords');assert.equal(JSON.stringify(s.history),originalHistory);assert.equal(canNext(s),true);previous(s);assert.equal(s.step,'lastWords');assert.equal(canNext(s),true);go(s);assert.equal(s.dayEvents.filter(e=>e.type==='shot').length,1);
});
for(const learned of [null,'hunter','wolf','medium'])for(const night of [1,2,3,4])test(`MEC fixed captions night ${night}, learned ${learned}`,()=>{
 const s=ready('mechanical12');s.night=night;s.mechanical.role=learned;s.mechanical.night=1;const steps=nightSteps(s);
 const stages=night===1?steps.slice(steps.indexOf('mechanical'),steps.indexOf('mechanicalClose')+1):steps.slice(steps.indexOf('hunterClose')+1,steps.indexOf('dawn'));
 assert.deepEqual(stages.map(step=>subtitle({...s,step})),night===1?['機械狼請睜眼','選擇你要學習的對象','若學獵人，今晚的開槍手勢','機械狼請閉眼']:['機械狼若學獵人請睜眼','今晚的開槍手勢','機械狼請閉眼']);
 assert.equal(mechanicalGunGesture(s),learned==='hunter'?'可以開槍':'');s.players[id(s,'mechanical')-1].alive=false;assert.deepEqual(nightSteps(s),steps);assert.equal(mechanicalGunGesture(s),'');
 const ten=ready('mechanical10');ten.night=night;assert.equal(nightSteps(ten).some(k=>k.includes('Gesture')||k.startsWith('mechanicalHunter')),false);
});
test('MEC first-night pending learning gesture does not commit learning or register another role',()=>{
 const s=ready('mechanical12');s.step='mechanicalLearn';selectSeat(s,id(s,'hunter'));go(s);assert.equal(s.step,'mechanicalFirstGesture');assert.equal(mechanicalGunGesture(s),'可以開槍');assert.equal(s.mechanical.role,null);assert.equal(s.nightRecords.flatMap(r=>r.events).some(e=>e.key==='learn'),false);assert.equal(mechanicalGunGesture(reload(s)),'可以開槍');go(s);go(s);assert.equal(s.mechanical.role,'hunter');previous(s);assert.equal(s.mechanical.role,null);previous(s);assert.equal(s.step,'mechanicalFirstGesture');
 s.nightAction.poison=true;s.nightAction.poisonTarget=id(s,'mechanical');assert.equal(mechanicalGunGesture(s),'不可開槍');
});
// Defense fixtures inject protection state without changing the official board or its player roles.
function revenge(on,defense){const s=ready('brothers12',{revengeInvincible:on});s.night=2;s.brothers.revengeNight=2;s.nightAction.revenge=id(s,'villager');const target=s.nightAction.revenge;
 if(defense==='guard'){s.infection={...s.infection,success:true,usedNight:2,originalRole:'guard'};s.nightAction.guard=target;}
 if(defense==='antidote'){s.nightAction.attack=target;s.nightAction.antidote=true;}
 if(defense==='sleep'){s.nightAction.sleepApplied=true;s.nightAction.sleep=target;}
 return s;}
for(const on of [false,true])for(const defense of ['none','guard','antidote','sleep'])test(`BRO ${on} ${defense}: independent attack and protection`,()=>{
 const s=revenge(on,defense),before=JSON.stringify(s.players),r=settleNight(s),e=r.events.find(e=>e.source==='revenge');assert.equal(e.blocked,defense==='sleep'?'sleep':defense==='guard'&&!on?'guard':null);if(defense==='antidote')assert.equal(r.events.find(e=>e.source==='basic').blocked,'antidote');assert.equal(JSON.stringify(s.players),before);assert.equal(r.events.filter(e=>e.source==='revenge').length,1);
});
test('BRO rule is scoped, default OFF, old saves OFF, restart/reload preserve ON',()=>{
 assert.deepEqual(Object.values(BOARDS).filter(b=>b.adjustable.includes('revengeInvincible')).map(b=>b.id),['brothers12']);const s=ready('brothers12');assert.equal(s.rules.revengeInvincible,false);delete s.rules.revengeInvincible;assert.notEqual(reload(s).rules.revengeInvincible,true);const on=revenge(true,'guard');assert.equal(reload(on).rules.revengeInvincible,true);assert.equal(restartGame(on).rules.revengeInvincible,true);assert.deepEqual(BOARDS.brothers12.roles,{elder:1,younger:1,wolf:2,seer:1,witch:1,hunter:1,merchant:1,villager:4});
});

for(const on of [false,true])for(const protection of ['shield','guard','cure','sleep','dance'])test(`BRO isolated protection ${protection} / ON=${on}`,()=>{
 const s=ready('brothers12',{revengeInvincible:on}),target=id(s,'villager'),attack={id:target,source:'revenge',cause:'attack'},defense={shield:null,guard:null,cure:null,sleep:null,dance:{protected:false,people:[]},shieldDamage:[],guardUsed:false,cureUsed:false};
 if(protection==='dance')defense.dance={protected:true,people:[{id:target}]};else defense[protection]=target;
 const expected=protection==='dance'?'danceProtection':protection==='sleep'?'sleep':on?null:protection==='cure'?'antidote':protection;
 assert.equal(attackProtection(s,attack,defense),expected);assert.equal(defense.shieldDamage.length,protection==='shield'&&!on?1:0);
 const fresh={...defense,shieldDamage:[],guardUsed:false,cureUsed:false};assert.equal(attackProtection(s,{...attack,source:'basic'},fresh),protection==='dance'?'danceProtection':protection==='cure'?'antidote':protection);
});

test('MEC legacy first-night action retains controls with the fixed learning caption',()=>{const s=ready('mechanical12');s.takeover.flow=false;s.step='mechanicalAction';s.operation='learnTarget';assert.equal(subtitle(s),'選擇你要學習的對象');assert.equal(canNext(s),false);selectSeat(s,id(s,'hunter'));go(s);assert.equal(s.step,'mechanicalFirstGesture');assert.equal(mechanicalGunGesture(s),'可以開槍');});

test('BRO ON preserves knight immunity in isolated damage projection',()=>{const s={boardId:'brothers12',rules:{revengeInvincible:true},players:[{id:1,role:'evilKnight'}]};assert.equal(attackProtection(s,{id:1,source:'revenge'},{dance:{protected:false,people:[]},shieldDamage:[]}), 'knightImmunity');});
