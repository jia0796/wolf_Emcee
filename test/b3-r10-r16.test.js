import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {BOARDS,ROLE_DATA} from '../public/data.js';
import {createGame,upgradeGame,boardOf,previous,next} from '../public/engine.js';
import {completeVoteDraft,voteSequence,selectIndividualVote} from '../public/vote-ui.js';
import {createVoteDraft,setBallot,submitVote,tallyVotes,voteRound,confirmVoteNotes,savedVoteNotes} from '../public/votes.js';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ready=stage=>{const s=createGame('12');let i=0;for(const [r,n]of Object.entries(BOARDS['12'].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step=stage;s.candidates=[7,8];s.nominees=[7,8,9];s.votePool=stage==='exileVote'?s.players.map(p=>p.id):[7,8];s.sheriff=stage.startsWith('sheriff')?null:1;return s;};
test('R16 only display fields change across all 26 boards and original roles are exact',async()=>{
 const baseline=JSON.parse(await readFile(new URL('./fixtures/b3-r16-baseline.json',import.meta.url),'utf8'));
 const {stoneGargoyle,...originalRoles}=ROLE_DATA;assert.equal(Object.keys(BOARDS).length,28);assert.equal(Object.keys(baseline.boards).length,26);assert.equal(digest(originalRoles),baseline.roles);
 for(const id of Object.keys(baseline.boards)){assert.ok(BOARDS[id],id);const {name,shortLabel,canonicalName,...rest}=BOARDS[id];if(id==='brothers12'){assert.equal(rest.defaults.revengeInvincible,false);assert.equal(rest.adjustable.at(-1),'revengeInvincible');rest.defaults={...rest.defaults};delete rest.defaults.revengeInvincible;rest.adjustable=rest.adjustable.filter(k=>k!=='revengeInvincible');}assert.equal(digest(rest),baseline.boards[id],id);}
});
test('R16 nine exact names resolve by stable ID for current and old saves, preserving history',()=>{
 const names={'12':'黑狼王 / 魔術師',kingGuard12:'黑狼王 / 守衛',kingDream12:'黑狼王 / 攝夢人',evilKnight12:'惡靈騎士 / 守衛',blood12:'血月 / 獵魔人',nightmare12:'夢魘 / 攝夢人',mechanical12:'機械狼 / 通靈師',gargoyle12:'覺醒石像鬼 / 守墓人',brothers12:'狼兄狼弟 / 黑市商人'};
 for(const [id,label]of Object.entries(names)){
  const s=createGame(id);assert.equal(boardOf(s).name,'12人 '+label);assert.equal(BOARDS[id].canonicalName,BOARDS[id].name);assert.equal(BOARDS[id].shortLabel,label);
  s.history=[{...structuredClone(s),history:undefined}];const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(boardOf(restored).name,'12人 '+label);assert.equal(restored.history.length,1);
  const small=id==='12'?'10':id.replace(/12$/,'10');if(BOARDS[small])assert.equal(BOARDS[small].shortLabel,label);
 }
});
for(const stage of ['sheriffVote','sheriffRevote','exileVote','exileRevote']){
 test('R12 '+stage+': implicit abstention is a UI copy, weights/recap/undo remain original',()=>{
  const s=ready(stage),d=createVoteDraft(s),[a,b,c]=d.voters;setBallot(d,a,7);setBallot(d,b,8);
  const before=structuredClone(d),submission=completeVoteDraft(d);assert.deepEqual(d,before);assert.deepEqual(voteSequence(d,'batch'),d.targets);assert.deepEqual(voteSequence(d,'individual'),d.voters);
  assert.equal(submission.ballots[c],'abstain');assert.deepEqual(submission.voters,d.voters);assert.equal(submitVote(s,submission).ok,true);
  const round=voteRound(s),t=tallyVotes(round);assert.equal(t.recorded,d.voters.length);assert.equal(t.abstainers.length,d.voters.length-2);assert.equal(t.groups.find(x=>x.target===7).votes,stage.startsWith('sheriff')?1:1.5);
  confirmVoteNotes(s);assert.equal(savedVoteNotes(s,round.kind).length,1);assert.equal(round.confirmed,true);
  const snapshot=structuredClone(s);assert.equal(next(s),true);assert.equal(previous(s),true);assert.deepEqual(s.votePatterns,snapshot.votePatterns);assert.deepEqual(s.action,snapshot.action);
 });
 test('R12 '+stage+': all unassigned retains existing empty tally outcome',()=>{
  const s=ready(stage),before=structuredClone(s),d=createVoteDraft(s),r=submitVote(s,completeVoteDraft(d));
  assert.deepEqual(d.ballots,{});if(stage==='exileVote'){assert.equal(r.ok,true);assert.deepEqual(s.action,[]);assert.equal(tallyVotes(voteRound(s)).abstainers.length,12);}else{assert.deepEqual(r,{ok:false,reason:'empty'});assert.deepEqual(s,before);}
 });
}

for(const stage of ['sheriffVote','sheriffRevote','exileVote','exileRevote'])test('auto individual '+stage+': skip recorded, wrap, cancel, reselect and completion',()=>{
 const d=createVoteDraft(ready(stage)),v=d.voters;
 setBallot(d,v[1],7);setBallot(d,v[2],'abstain');
 assert.equal(selectIndividualVote(d,0,7),3);assert.equal(d.ballots[v[0]],7);
 assert.equal(selectIndividualVote(d,0,7),0);assert.equal(Object.hasOwn(d.ballots,v[0]),false);
 assert.equal(selectIndividualVote(d,v.length-1,8),0); // wrap to first missing
 assert.equal(selectIndividualVote(d,0,7),3); // selecting again still advances
 for(const voter of v)if(!Object.hasOwn(d.ballots,voter))setBallot(d,voter,7);
 assert.equal(selectIndividualVote(d,0,8),0);assert.equal(d.ballots[v[0]],8); // no missing: stay, don't submit
 assert.equal(selectIndividualVote(d,0,99),0);assert.equal(d.ballots[v[0]],8);
 assert.equal(d.submitted,undefined);
});
