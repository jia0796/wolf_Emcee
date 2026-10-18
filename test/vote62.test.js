import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,next,previous,selectSeat,upgradeGame,restartGame,canNext} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {voteRound,createVoteDraft,saveVoteDraft,setBallot,submitVote,tallyVotes,validVoteCount,voteRecapMismatch,voteSelectionMatches,savedVoteNotes,voteEligibility} from '../public/votes.js';

const ready=(board='12')=>{const s=createGame(board);let i=0;for(const [r,n]of Object.entries(BOARDS[board].roles))for(let j=0;j<n;j++)s.players[i++].role=r;s.rolesConfirmed=true;s.step='exileVote';s.votePool=s.players.filter(p=>p.active).map(p=>p.id);return s;};
const ui={mode:'batch',target:5,voter:1,scrolls:{batch:50,individual:0,candidates:0}};
const send=(s,ballots)=>{const d=createVoteDraft(s);for(const [v,t]of Object.entries(ballots))assert.equal(setBallot(d,Number(v),t),true);assert.equal(submitVote(s,d).ok,true);return voteRound(s);};

test('VOTE62 pending draft survives JSON/upgrade, without formal recap or action changes',()=>{
 const s=ready(),d=createVoteDraft(s);setBallot(d,1,5);setBallot(d,2,'abstain');assert.equal(saveVoteDraft(s,d,ui),true);
 assert.deepEqual(s.action,[]);assert.equal(voteRound(s).submitted,false);assert.deepEqual(savedVoteNotes(s,'exile'),[]);
 const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);assert.deepEqual(createVoteDraft(restored).ui,ui);assert.deepEqual(createVoteDraft(restored).ballots,{1:5,2:'abstain'});
 selectSeat(restored,9);next(restored);assert.equal(Object.hasOwn(restored.dayEvents[0],'voteRounds'),false);previous(restored);assert.deepEqual(createVoteDraft(restored).ballots,d.ballots);
});
test('VOTE62 editing persisted submission preserves original until resubmission',()=>{
 const s=ready();send(s,{1:5});const formal=structuredClone(voteRound(s)),d=createVoteDraft(s);setBallot(d,1,9);saveVoteDraft(s,d,{...ui,target:9});
 assert.deepEqual(voteRound(s).ballots,formal.ballots);assert.deepEqual(s.action,[5]);assert.equal(createVoteDraft(s).ballots[1],9);
 const loaded=upgradeGame(JSON.parse(JSON.stringify(s)));assert.equal(createVoteDraft(loaded).ballots[1],9);assert.equal(voteRound(loaded).ballots[1],5);
 assert.equal(submitVote(loaded,createVoteDraft(loaded)).ok,true);assert.deepEqual(loaded.action,[9]);assert.equal(Object.hasOwn(voteRound(loaded),'editDraft'),false);
});
test('VOTE62 manual override suppresses recap without deleting raw ballots or undo history',()=>{
 const s=ready();send(s,{1:5,2:5});const raw=structuredClone(voteRound(s).ballots);selectSeat(s,9);assert.equal(voteRecapMismatch(s),true);assert.equal(canNext(s),true);next(s);
 assert.deepEqual(s.votePatterns[0].ballots,raw);assert.equal(s.votePatterns[0].confirmed,false);assert.equal(Object.hasOwn(s.dayEvents[0],'voteRounds'),false);
 previous(s);assert.equal(voteRecapMismatch(s),true);selectSeat(s,5);assert.equal(voteRecapMismatch(s),false);assert.equal(voteSelectionMatches(s),true);next(s);assert.equal(s.dayEvents[0].voteRounds.length,1);assert.deepEqual(s.dayEvents[0].voteRounds[0].ballots,raw);
});
test('VOTE62 re-tally resets manual choice to latest weighted highest and clears stale mismatch',()=>{
 const s=ready();s.sheriff=2;send(s,{1:5,2:6});assert.deepEqual(s.action,[6]);assert.equal(validVoteCount(voteRound(s)),2);assert.equal(tallyVotes(voteRound(s)).groups[0].votes,1.5);
 selectSeat(s,9);const d=createVoteDraft(s);setBallot(d,1,5);setBallot(d,3,5);submitVote(s,d);assert.deepEqual(s.action,[5]);assert.equal(voteRecapMismatch(s),false);next(s);assert.equal(s.dayEvents[0].voteRounds[0].ballots[2],6);
});
test('VOTE62 clearing draft is isolated from submitted data; submitted missing voters become explicit abstentions',()=>{
 const s=ready();send(s,{1:5,2:5});const d=createVoteDraft(s),raw=structuredClone(voteRound(s));d.ballots={};saveVoteDraft(s,d,ui);
 assert.deepEqual(voteRound(s).ballots,raw.ballots);assert.equal(validVoteCount(createVoteDraft(s)),0);assert.equal(tallyVotes(voteRound(s)).abstainers.length,10);
 submitVote(s,createVoteDraft(s));assert.equal(validVoteCount(voteRound(s)),0);assert.deepEqual(tallyVotes(voteRound(s)).abstainers,s.votePool);assert.deepEqual(s.action,[5]);assert.equal(voteRecapMismatch(s),true);
});
test('VOTE62 all-abstain never invents a result, changes eligibility, or bypasses existing next requirements',()=>{
 const s=ready(),before=voteEligibility(s);send(s,{});assert.deepEqual(voteEligibility(s),before);assert.deepEqual(s.action,[]);assert.equal(s.choice,null);assert.equal(canNext(s),false);assert.equal(next(s),false);
 selectSeat(s,5);assert.equal(canNext(s),true);next(s);assert.equal(Object.hasOwn(s.dayEvents[0],'voteRounds'),false);assert.equal(s.votePatterns[0].submitted,true);
});
test('VOTE62 drafts do not cross PK, nights, or restart; original snapshots restore draft',()=>{
 const s=ready(),d=createVoteDraft(s);setBallot(d,1,5);saveVoteDraft(s,d,ui);send(s,{1:5,2:9});next(s);next(s);next(s);assert.equal(s.step,'exileRevote');assert.deepEqual(createVoteDraft(s).ballots,{});assert.equal(saveVoteDraft(s,d,ui),false);
 previous(s);previous(s);previous(s);assert.equal(s.step,'exileVote');assert.equal(voteRound(s).submitted,true);assert.equal(voteRound(s).confirmed,false);const fresh=restartGame(s);assert.deepEqual(fresh.votePatterns,[]);assert.deepEqual(fresh.history,[]);
 s.night++;assert.deepEqual(createVoteDraft(s).ballots,{});assert.equal(saveVoteDraft(s,d,ui),false);
});
test('VOTE62 saved draft sanitizes stale/ineligible ballots without mutating caller',()=>{
 const s=ready(),d=createVoteDraft(s);d.ballots={1:5,2:99,99:5};s.players[0].alive=false;const before=structuredClone(d);saveVoteDraft(s,d,ui);assert.deepEqual(createVoteDraft(s).ballots,{});assert.deepEqual(d,before);assert.equal(createVoteDraft(s).voters.includes(1),false);
});
test('VOTE62 old v22 saves without UI metadata preserve history and original optional fields',()=>{
 const s=ready();send(s,{1:5});const snapshot=structuredClone(s);delete snapshot.history;s.history=[snapshot];const json=JSON.stringify(s),loaded=upgradeGame(JSON.parse(json));assert.deepEqual(loaded,s);assert.equal(createVoteDraft(loaded).ui,undefined);assert.equal(loaded.version,22);assert.deepEqual(loaded.history[0].votePatterns,s.history[0].votePatterns);
});
test('VOTE62 deterministic ballot stress: 26 boards, replacement/cancel/abstain and independent weighted oracle',()=>{
 let seed=6201;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};let rounds=0;
 for(const board of Object.keys(BOARDS))for(let round=0;round<30;round++){
  const s=ready(board);s.sheriff=rand(s.votePool.length)+1;const d=createVoteDraft(s),oracle={};
  for(let i=0;i<180;i++){const v=d.voters[rand(d.voters.length)],t=rand(6)===0?null:rand(8)===0?'abstain':d.targets[rand(d.targets.length)];setBallot(d,v,t);if(t===null)delete oracle[v];else oracle[v]=t;}
  const expected=new Map();for(const [v,t]of Object.entries(oracle))if(typeof t==='number')expected.set(t,(expected.get(t)||0)+(Number(v)===s.sheriff?1.5:1));
  const ranked=[...expected].sort((a,b)=>b[1]-a[1]||a[0]-b[0]);assert.deepEqual(tallyVotes(d).groups.map(g=>[g.target,g.votes]),ranked);saveVoteDraft(s,d,ui);const restored=upgradeGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(createVoteDraft(restored).ballots,oracle);submitVote(restored,createVoteDraft(restored));
  if(ranked.length)assert.deepEqual(restored.action,ranked.filter(x=>x[1]===ranked[0][1]).map(x=>x[0]).sort((a,b)=>a-b));assert.equal(Object.keys(voteRound(restored).ballots).length,d.voters.length);rounds++;
 }
 assert.equal(rounds,Object.keys(BOARDS).length*30);
});
