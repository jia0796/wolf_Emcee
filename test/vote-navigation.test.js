import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {voteSequence} from '../public/vote-ui.js';
import {createVoteDraft,setBallot,tallyVotes,submitVote,voteRound,voteEligibility} from '../public/votes.js';

const ready=(step='sheriffVote')=>{
 const s=createGame('12');
 let i=0;for(const [role,n]of Object.entries(BOARDS['12'].roles))for(let j=0;j<n;j++)s.players[i++].role=role;
 s.rolesConfirmed=true;s.step=step;s.candidates=[1,3];s.nominees=[1,2,3,5,7];
 s.votePool=step.startsWith('sheriff')?[1,3]:step==='exileRevote'?[1,3]:s.players.map(p=>p.id);
 return s;
};

test('vote navigation: first sheriff shows each candidate and only eligible voters',()=>{
 const s=ready(),draft=createVoteDraft(s);
 assert.deepEqual(voteEligibility(s).voters,[4,6,8,9,10,11,12]);
 assert.deepEqual(voteSequence(draft,'batch'),[1,3]);
 assert.deepEqual(voteSequence(draft,'individual'),[4,6,8,9,10,11,12]);
 setBallot(draft,4,1);setBallot(draft,6,1);setBallot(draft,8,3);
 assert.deepEqual(tallyVotes(draft).groups.map(({target,voters})=>({target,voters})),[
  {target:1,voters:[4,6]},{target:3,voters:[8]}
 ]);
 assert.deepEqual(voteSequence(draft,'batch'),[1,3]);
 assert.deepEqual(voteSequence(draft,'individual'),[4,6,8,9,10,11,12]);
 assert.deepEqual(s.votePatterns,[]);
 assert.equal(submitVote(s,draft).ok,true);
 assert.deepEqual(voteRound(s).ballots,{4:1,6:1,8:3});
});

test('both layouts share a ballot, switching assignment replaces rather than double-counts',()=>{
 const draft=createVoteDraft(ready('exileVote'));
 assert.deepEqual(voteSequence(draft,'batch'),[1,2,3,4,5,6,7,8,9,10,11,12]);
 assert.deepEqual(voteSequence(draft,'individual'),[1,2,3,4,5,6,7,8,9,10,11,12]);
 setBallot(draft,4,1);setBallot(draft,4,3);setBallot(draft,6,3);
 assert.equal(tallyVotes(draft).groups[0].votes,2);
 assert.equal(setBallot(draft,4,3,true),true);
 assert.equal(tallyVotes(draft).recorded,1);
 setBallot(draft,4,'abstain');
 assert.deepEqual(tallyVotes(draft).abstainers,[4]);
});

test('all four formal voting stages use one-at-a-time navigation and current eligibility',()=>{
 for(const stage of ['sheriffVote','sheriffRevote','exileVote','exileRevote']){
  const s=ready(stage),d=createVoteDraft(s),batch=voteSequence(d,'batch'),individual=voteSequence(d,'individual');
  assert.deepEqual(batch,[...d.targets]);
  assert.deepEqual(individual,d.voters);
  if(stage.endsWith('Revote'))assert.equal(individual.includes(1)||individual.includes(3),false);
  if(stage==='sheriffVote')assert.deepEqual(individual,[4,6,8,9,10,11,12]);
  assert.ok(batch.length>1&&individual.length>0);
 }
});
