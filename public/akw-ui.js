import {akwNight,currentProposal,poisonBallotDraft,savePoisonDraft,submitPoisonBallots,poisonBallotsComplete} from './akw.js';
import {tallyVotes} from './votes.js';
import {selectIndividualVote} from './vote-ui.js';

// Presentation only: original draft, eligibility and settlement stay shared.
export function createAkwBallotDialog({getGame,save,render}){
 const dialog=document.createElement('dialog');dialog.id='akwBallotDialog';dialog.className='vote-dialog';dialog.setAttribute('aria-labelledby','akwBallotTitle');
 dialog.innerHTML='<div class="dialog-head"><h2 id="akwBallotTitle">紀錄表決</h2><button type="button" data-close aria-label="關閉表決紀錄">×</button></div><div class="vote-scroll"><div data-voters class="vote-voters" aria-label="選擇協助者"></div><p data-progress class="small" aria-live="polite"></p><div data-options class="vote-modes"></div><p data-notice class="small" role="status"></p></div><div class="vote-footer"><button type="button" class="primary" data-done>完成統計</button><button type="button" data-abandon>不紀錄表決</button></div>';
 document.body.append(dialog);let draft,ui;
 const find=q=>dialog.querySelector(q);
 function saveDraft(){
  const g=getGame(),before=structuredClone(akwNight(g));
  if(savePoisonDraft(g,draft,ui)&&save())return true;
  g.nightAction.akw=before;find('[data-notice]').textContent='儲存失敗，請重試；重新整理可能遺失變更';return false;
 }
 function paint(){
  const n=draft.voters.length;ui.index=Math.max(0,Math.min(n-1,ui.index||0));
  find('[data-progress]').textContent='已記錄 '+tallyVotes(draft).recorded+'/'+n+' 人 · 目前選擇 '+draft.voters[ui.index]+'號';
  find('[data-options]').replaceChildren();
  for(const [value,label]of [[1,'同意'],[2,'不同意']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.opinion=String(value);
   b.className='akw-opinion';b.setAttribute('aria-pressed',String(draft.ballots[draft.voters[ui.index]]===value));
   b.onclick=()=>{ui.index=selectIndividualVote(draft,ui.index,value);paint();saveDraft();find('[data-opinion="'+value+'"]').focus();};find('[data-options]').append(b);
  }
  find('[data-voters]').replaceChildren();
  for(const id of draft.voters){const b=document.createElement('button');b.type='button';const value=draft.ballots[id];b.textContent=id+'號 · '+(value===1?'同意':value===2?'不同意':'未記錄');b.dataset.helper=String(id);b.setAttribute('aria-pressed',String(draft.voters[ui.index]===id));b.onclick=()=>{ui.index=draft.voters.indexOf(id);paint();saveDraft();find('[data-helper="'+id+'"]').focus();};find('[data-voters]').append(b);}
  find('[data-done]').disabled=!poisonBallotsComplete(draft);
  find('[data-notice]').textContent=poisonBallotsComplete(draft)?'完成統計後帶回結果；下一步才正式結算':'請選擇協助者，再按同意或不同意；未填不視為不同意';
 }
 const close=()=>{if(!saveDraft())return;dialog.close();render();};find('[data-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 find('[data-done]').onclick=()=>{const g=getGame(),before=structuredClone(akwNight(g));if(!submitPoisonBallots(g,draft))return;if(!save()){g.nightAction.akw=before;find('[data-notice]').textContent='儲存失敗，尚未完成統計';return;}dialog.close();render();};
 find('[data-abandon]').onclick=()=>{const g=getGame(),before=structuredClone(akwNight(g));akwNight(g).draft=null;akwNight(g).ballots=null;if(!save()){g.nightAction.akw=before;find('[data-notice]').textContent='儲存失敗，請重試';return;}dialog.close();render();};
 return {open(){const g=getGame();if(!currentProposal(g))return;draft=poisonBallotDraft(g);const unfilled=draft.voters.findIndex(id=>![1,2].includes(draft.ballots[id]));ui={mode:'individual',index:unfilled<0?0:unfilled};paint();dialog.showModal();}};
}
