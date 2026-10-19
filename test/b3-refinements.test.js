import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,phaseOf} from '../public/engine.js';
import {BOARDS} from '../public/data.js';
import {hostPresentation,backgroundSource} from '../public/b3-ui.js';
test('R09 all boards project confirm as daytime preparation without modifying game or engine phase',()=>{
 for(const board of Object.keys(BOARDS)){const s=createGame(board),before=JSON.stringify(s);assert.equal(phaseOf(s),'夜晚');const view=hostPresentation(phaseOf(s),s.step,s.night);assert.equal(view.label,'第1天・準備階段');assert.equal(backgroundSource('host',view.phase),'art/backgrounds/host-day.png');assert.equal(JSON.stringify(s),before);}
});
test('R09 genuine day/night stages retain the engine projection; only confirm receives a preparation label',()=>{
 const s=createGame('12');for(const step of ['dark','attack','antidote','dawn','exileVote']){s.step=step;s.night=3;const phase=phaseOf(s),view=hostPresentation(phase,step,s.night);assert.equal(view.phase,phase);assert.equal(view.label,'第3天・'+phase);assert.equal(view.preparing,false);}
});
