import {akwNight,currentProposal,poisonBallotDraft,savePoisonDraft,submitPoisonBallots,poisonBallotsComplete} from './akw.js';
import {setBallot,tallyVotes} from './votes.js';
import {selectIndividualVote} from './vote-ui.js';

// Same ballot draft / submit / cancellation pattern, isolated eligibility and no abstentions.
export function createAkwBallotDialog({getGame,save,render}){
 const dialog=document.createElement('dialog');dialog.id='akwBallotDialog';dialog.className='vote-dialog';dialog.setAttribute('aria-labelledby','akwBallotTitle');
 dialog.innerHTML='<div class="dialog-head"><h2 id="akwBallotTitle">紀錄表決</h2><button type="button" data-close aria-label="關閉表決紀錄">×</button></div><div class="vote-scroll"><div class="vote-modes"><button type="button" data-mode="batch">多人同一意見</button><button type="button" data-mode="individual">逐人紀錄</button></div><p data-progress class="small" aria-live="polite"></p><div data-options class="vote-modes"></div><div data-voters class="vote-voters"></div></div><div class="vote-footer"><div class="vote-navigation"><button type="button" data-prev>上一位</button><button type="button" data-next>下一位</button></div><p data-notice class="small" role="status"></p><button type="button" class="primary" data-done>完成統計</button><button type="button" data-abandon>不記錄個別表決</button></div>';
 document.body.append(dialog);let draft,ui;
 const find=q=>dialog.querySelector(q);
 function saveDraft(){return savePoisonDraft(getGame(),draft,ui)&&save();}
 function paint(){
  const n=draft.voters.length;ui.index=Math.max(0,Math.min(n-1,ui.index||0));ui.target??=1;
  find('[data-progress]').textContent='已記錄 '+tallyVotes(draft).recorded+'/'+n+' 人'+(ui.mode==='individual'?' · '+draft.voters[ui.index]+'號':'');
  dialog.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===ui.mode)));
  find('[data-options]').replaceChildren();
  for(const [value,label]of [[1,'O 同意'],[2,'X 不同意']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.opinion=String(value);
   b.className='akw-opinion '+(value===1?'agree':'disagree');b.setAttribute('aria-pressed',String(ui.mode==='batch'?ui.target===value:draft.ballots[draft.voters[ui.index]]===value));
   b.onclick=()=>{if(ui.mode==='batch')ui.target=value;else ui.index=selectIndividualVote(draft,ui.index,value);saveDraft();paint();};find('[data-options]').append(b);
  }
  find('[data-voters]').replaceChildren();
  for(const id of draft.voters){const b=document.createElement('button');b.type='button';const value=draft.ballots[id];b.textContent=id+'號 · '+(value===1?'O 同意':value===2?'X 不同意':'未記錄');b.dataset.helper=String(id);b.setAttribute('aria-pressed',String(ui.mode==='individual'?draft.voters[ui.index]===id:value===ui.target));b.onclick=()=>{if(ui.mode==='individual')ui.index=draft.voters.indexOf(id);else setBallot(draft,id,ui.target,true);saveDraft();paint();};find('[data-voters]').append(b);}
  find('[data-done]').disabled=!poisonBallotsComplete(draft);find('[data-prev]').disabled=ui.index===0;find('[data-next]').disabled=ui.index===n-1;
  find('.vote-navigation').hidden=ui.mode!=='individual';find('[data-notice]').textContent=poisonBallotsComplete(draft)?'完成統計後自動選取表決結果；下一步才正式結算':'請填完所有協助者；未填不視為不同意';
 }
 const close=()=>{saveDraft();dialog.close();render();};find('[data-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ui.mode=b.dataset.mode;saveDraft();paint();});
 find('[data-prev]').onclick=()=>{ui.index--;saveDraft();paint();};find('[data-next]').onclick=()=>{ui.index++;saveDraft();paint();};
 find('[data-done]').onclick=()=>{const g=getGame(),before=structuredClone(akwNight(g));if(!submitPoisonBallots(g,draft))return;if(!save()){g.nightAction.akw=before;find('[data-notice]').textContent='儲存失敗，尚未完成統計';return;}dialog.close();render();};
 find('[data-abandon]').onclick=()=>{const g=getGame(),before=structuredClone(akwNight(g));akwNight(g).draft=null;akwNight(g).ballots=null;if(!save()){g.nightAction.akw=before;return;}dialog.close();render();};
 return {open(){const g=getGame();if(!currentProposal(g))return;draft=poisonBallotDraft(g);ui=structuredClone(akwNight(g).ballotUI);paint();dialog.showModal();}};
}
