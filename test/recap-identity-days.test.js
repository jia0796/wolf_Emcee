import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,choose,selectSeat,previous,upgradeGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {settleNight} from '../public/night.js';
import {identityDeathReason} from '../public/recap-deaths.js';
import {finalIdentityModel,recapDays,recapDayLabel} from '../public/recap.js';
import {recapSnapshot} from '../public/online-state.js';

const cases=[
 ['狼人襲擊',{cause:'attack',source:'basic'}],['女巫潑毒',{cause:'poison',source:'witch',sourceRole:'witch'}],
 ['獵人開槍',{cause:'shot',sourceRole:'hunter'}],['獵人開槍',{cause:'shot',sourceRole:'awakenedHunter'}],
 ['殉情',{cause:'heartbreak',source:'heartbreak'}],['騎士制裁',{cause:'duel',sourceActor:3}],['以死謝罪',{cause:'duel',sourceActor:9}],
 ['狼王開槍',{cause:'shot',sourceRole:'king'}],['攝夢連攝',{cause:'dreamRepeat'}],['攝夢連帶',{cause:'dreamLink'}],
 ['惡靈反傷',{cause:'reflect'}],['屠邊刀',{cause:'lastBlade'}],['獵魔狩獵',{cause:'hunt',sourceActor:3}],['狩獵失敗',{cause:'hunt',sourceActor:9}],
 ['機械狼刀',{cause:'attack',source:'extra'}],['機械狼毒',{cause:'poison',source:'learnedPoison',sourceRole:'mechanical'}],['機械狼槍',{cause:'shot',sourceRole:'mechanical'}],
 ['奶穿',{cause:'attack',source:'guardAndAntidote'}],['交易失敗',{cause:'tradeFailure'}],['復仇刀',{cause:'attack',source:'revenge'}],
 ['共舞身亡',{cause:'dance'}],['魅影綁定',{cause:'heartbreak',source:'fragranceBond'}],['替死',{cause:'awakenedSubstitute'}],
 ['放逐',{cause:'exile'}],['狼人自爆',{cause:'selfDestruct'}],['幸運兒開槍',{cause:'shot',sourceRole:'hunter',skillSource:'lucky'}],
 ['幸運兒潑毒',{cause:'poison',source:'luckyPoison'}],['毒藥反彈',{cause:'poison',source:'reflection'}]
];
for(const [label,detail]of cases)test('identity death label: '+label+' / '+JSON.stringify(detail),()=>{
 const p={id:9,active:true,alive:false,role:'villager',cause:detail.cause},s={night:2,nightRecords:[{night:1,deaths:[{id:9,...detail}],events:[]}],dayEvents:[],nightState:{deaths:[]}};
 const before=structuredClone({p,s});assert.equal(identityDeathReason(s,p),label);assert.deepEqual({p,s},before);
});
const ready=(board='12')=>{const s=createGame(board);let i=0;for(const [role,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=role;s.rolesConfirmed=true;return s;};
const player=(s,role)=>s.players.find(p=>p.role===role);
const go=s=>assert.equal(next(s),true,s.step);

test('real guard and antidote settlement labels same-save death without changing rules or state',()=>{
 const s=ready('kingGuard12'),id=player(s,'villager').id;s.step='guardTarget';selectSeat(s,id);go(s);s.step='attack';selectSeat(s,id);go(s);s.step='antidote';choose(s,'use');go(s);
 const before=structuredClone(s),p=s.players.find(p=>p.id===id);assert.equal(s.nightState.deaths.find(d=>d.id===id).cause,'attack');assert.equal(identityDeathReason(s,p),'奶穿');assert.deepEqual(s,before);
 previous(s);assert.equal(identityDeathReason(s,s.players.find(p=>p.id===id)),'');
});
for(const [role,field,extra,label]of [
 ['wolf','extraAttack',{extraUnlocked:true},'機械狼刀'],['witch','mechanicalPoison',{},'機械狼毒']
])test('real learned mechanic settlement remains distinct: '+label,()=>{
 const s=ready('mechanical12');s.night=2;Object.assign(s.mechanical,{role,night:1,...extra});const target=player(s,'villager');s.nightAction[field]=target.id;
 const r=settleNight(s);s.nightState.deaths=structuredClone(r.deaths);s.nightRecords=[{night:2,deaths:structuredClone(r.deaths),events:[]}];const before=structuredClone(s);
 assert.ok(r.deaths.some(d=>d.id===target.id));assert.equal(identityDeathReason(s,target),label);assert.deepEqual(s,before);
});
test('real demon failed hunt labels the demon, not the selected surviving good target',()=>{
 const s=ready('blood12'),demon=player(s,'demon'),target=player(s,'villager');Object.assign(s.nightAction,{huntApplied:true,huntDeath:demon.id,hunt:target.id});const r=settleNight(s,{phase:'dawn'});s.nightState.deaths=r.deaths;
 assert.equal(identityDeathReason(s,demon),'狩獵失敗');assert.equal(identityDeathReason(s,target),'');
});
test('mechanical invincible shield plus antidote uses the approved same-save label',()=>{
 const s=ready('mechanical12'),target=player(s,'villager');s.night=2;Object.assign(s.mechanical,{role:'guard',night:1});Object.assign(s.nightAction,{shield:target.id,attack:target.id,antidote:true});const r=settleNight(s);s.nightState.deaths=r.deaths;s.nightRecords=[{night:2,deaths:r.deaths,events:[{key:'shield',skill:'shield',effectiveTargets:[target.id],executed:true},{key:'antidote',skill:'antidote',effectiveTargets:[target.id],executed:true}]}];assert.equal(r.deaths.find(d=>d.id===target.id).source,'basic');assert.equal(identityDeathReason(s,target),'奶穿');
});
test('legacy day shot with explicit id and saved shooter role remains readable',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;target.cause='shot';s.dayEvents=[{id:target.id,cause:'shot',sourceActor:1,sourceRole:'king',day:1}];assert.equal(identityDeathReason(s,target),'狼王開槍');
});
test('legacy night death can use its own recorded binding event, not a later player identity',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;target.cause='heartbreak';s.nightRecords=[{night:1,deaths:[{id:target.id,cause:'heartbreak'}],events:[{key:'fragranceHeartbreak',effectiveTargets:[target.id],actors:[3],executed:true}]}];assert.equal(identityDeathReason(s,target),'魅影綁定');
});
test('day gun uses saved shooter identity and skill source; blocked and unexecuted attempts cannot supply a cause',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;target.cause='shot';s.dayEvents=[{type:'shot',effectiveTargets:[target.id],actors:[1],actorSnapshots:[{role:'mechanical'}],skillSource:'native',executed:true}];
 assert.equal(identityDeathReason(s,target),'機械狼槍');s.dayEvents[0].skillSource='lucky';assert.equal(identityDeathReason(s,target),'幸運兒開槍');
 s.dayEvents[0].blocked='immuneNightGun';assert.equal(identityDeathReason(s,target),'死因未記錄');s.dayEvents[0].blocked=null;s.dayEvents[0].executed=false;assert.equal(identityDeathReason(s,target),'死因未記錄');
});
test('day romance and fragrance binding remain independent, including saved day substitute',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;target.cause='heartbreak';s.dayEvents=[{type:'fragranceHeartbreak',effectiveTargets:[target.id],actors:[1],executed:true}];assert.equal(identityDeathReason(s,target),'魅影綁定');
 s.dayEvents[0].type='heartbreak';assert.equal(identityDeathReason(s,target),'殉情');target.cause='awakenedSubstitute';s.dayEvents[0].type='awakenedSubstitute';assert.equal(identityDeathReason(s,target),'替死');
});
test('legacy missing cause and unknown source never infer from uncommitted actions or current final identities',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;s.nightAction.attack=target.id;s.nightAction.poisonTarget=target.id;s.nightAction.poison=true;s.dayEvents=[{type:'shot',actors:[8],rawTargets:[target.id],actorSnapshots:[{role:'hunter'}]}];
 assert.equal(identityDeathReason(s,target),'死因未記錄');target.cause='newUnknownCause';assert.equal(identityDeathReason(s,target),'死因未記錄');
});
test('primary committed cause is preserved despite later attacks; a basic mechanic takeover remains basic wolf attack',()=>{
 const s=ready(),target=player(s,'villager');target.alive=false;target.cause='heartbreak';s.nightRecords=[{night:1,deaths:[{id:target.id,cause:'heartbreak',source:'fragranceBond'}],events:[]},{night:2,deaths:[],events:[{key:'poison',executed:true,effectiveTargets:[target.id]}]}];assert.equal(identityDeathReason(s,target),'魅影綁定');
 target.cause='attack';s.nightRecords[0].deaths=[{id:target.id,cause:'attack',source:'basic',sourceRole:'mechanical'}];assert.equal(identityDeathReason(s,target),'狼人襲擊');
});
test('winning camp is first; good gods before villagers, numbers ascending within each group',()=>{
 const s=ready('classicMixed12');for(const winner of ['好人陣營','狼人陣營']){s.winner=winner;const groups=finalIdentityModel(s);assert.equal(groups[0].camp,winner==='好人陣營'?'good':'wolf');const good=groups.find(g=>g.camp==='good').players;const gods=good.filter(p=>p.kind==='god'),villagers=good.filter(p=>p.kind==='villager');assert.deepEqual(good,[...gods,...villagers]);for(const people of [gods,villagers,groups.find(g=>g.camp==='wolf').players])assert.deepEqual(people.map(p=>p.id),people.map(p=>p.id).sort((a,b)=>a-b));}
});
test('terminal pending deaths are dark/dead in model before announcement, while living players remain unchanged',()=>{
 const s=ready(),target=player(s,'villager');s.winner='狼人陣營';s.nightState.deaths=[{id:target.id,cause:'attack',source:'basic'}];const before=structuredClone(s),p=finalIdentityModel(s).flatMap(g=>g.players).find(p=>p.id===target.id);assert.equal(p.alive,false);assert.equal(p.deathReason,'狼人襲擊');assert.deepEqual(s,before);
});
test('host and player recap payload derive identical death labels without adding a field to the saved format',()=>{
 const s=ready('mechanical12'),target=player(s,'villager');target.alive=false;target.cause='poison';s.nightRecords=[{night:1,deaths:[{id:target.id,cause:'poison',source:'learnedPoison',sourceRole:'mechanical'}],events:[],settled:true}];s.step='finished';s.winner='好人陣營';const before=structuredClone(s),payload=recapSnapshot(s);assert.deepEqual(finalIdentityModel(s),finalIdentityModel(payload));assert.deepEqual(s,before);assert.equal(Object.hasOwn(payload.players[target.id-1],'deathReason'),false);
});
test('recap groups saved night and day by number, preserves independent events and skips nonexistent days',()=>{
 const s=ready();s.night=3;s.nightRecords=[{night:1,events:[{key:'basic',skill:'wolf-attack',executed:true,order:1}],deaths:[],settled:true},{night:3,events:[],deaths:[],settled:true}];s.dayEvents=[{day:1,type:'exile',executed:true},{day:3,type:'exile',executed:false}];const before=structuredClone(s),days=recapDays(s);assert.deepEqual(days.map(d=>d.number),[1,3]);assert.deepEqual(days[0].segments.map(x=>x.kind),['night','day']);assert.deepEqual(days[1].segments.map(x=>x.kind),['night']);assert.deepEqual(s,before);assert.deepEqual(recapDays(upgradeGame(JSON.parse(JSON.stringify(s)))).map(d=>d.number),[1,3]);
 for(const [n,label]of [[1,'第一天'],[2,'第二天'],[3,'第三天'],[10,'第十天'],[11,'第十一天'],[20,'第二十天'],[42,'第四十二天']])assert.equal(recapDayLabel(n),label);
});
