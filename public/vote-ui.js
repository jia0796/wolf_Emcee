import {voteRound,createVoteDraft,submitVote,abandonVote,setBallot,tallyVotes,voteGroups} from './votes.js';

// Both layouts edit the same per-voter ballot draft; changing views never changes the vote rules.
export const voteSequence=(round,mode)=>mode==='individual'?[...round.voters]:[...round.targets,'abstain'];

export function createVoteDialog({getGame,save,render}){
 const $=id=>document.getElementById(id),dialog=$('voteDialog');
 let mode='batch',indexes={batch:0,individual:0},key=null,draft=null,notice='';
 const label=id=>id==='abstain'?'棄票':id+'號';
 function badge(node,id,round){
  if(id===round.sheriff){const img=document.createElement('img');img.src='art/moon-eclipse-sheriff-badge.svg';img.alt='警徽';node.append(img);}
 }
 function changed(){notice='';paint();}
 function paint({resetScroll=false}={}){
  const round=draft;if(!round||createVoteDraft(getGame())?.key!==key){dialog.close();return;}
  const focused=document.activeElement,focusVoter=focused?.closest('[data-voter]')?.dataset.voter,focusChoice=focused?.closest('[data-choice]')?.dataset.choice;
  const scroll=$('voteScroll').scrollTop,statsOpen=$('voteStats').open,optionsOpen=$('voteOptions').open;
  $('voteEligibilityHint').textContent=round.stage.endsWith('Revote')?'PK玩家不參與本輪投票':round.kind==='sheriff'?'上警與退水玩家不參與本輪投票':'';
  $('voteEligibilityHint').hidden=!$('voteEligibilityHint').textContent;
  $('voteBatch').setAttribute('aria-pressed',String(mode==='batch'));
  $('voteIndividual').setAttribute('aria-pressed',String(mode==='individual'));
  const steps=voteSequence(round,mode),index=Math.min(indexes[mode],Math.max(steps.length-1,0)),current=steps[index]??null;
  indexes[mode]=index;
  $('voteStepLabel').textContent=mode==='batch'?'得票對象':'投票者';
  $('voteStepName').replaceChildren();
  const stepName=document.createElement('span');stepName.textContent=current===null?'無可紀錄對象':label(current);
  $('voteStepName').append(stepName);
  if(mode==='individual'&&current!==null)badge($('voteStepName'),current,round);
  $('voteStepCount').textContent=steps.length?(index+1)+'／'+steps.length:'0／0';
  $('voteStepHint').textContent=mode==='batch'
   ?current==='abstain'?'選取棄票的玩家；再次點選可取消。':'點選投給 '+label(current)+' 的玩家，可複選；再次點選可取消。'
   :'點選 '+label(current)+' 的投票對象；一次只能投一位，再次點選可取消。';
  $('votePrevious').disabled=index===0||!steps.length;
  $('voteNext').disabled=index>=steps.length-1||!steps.length;
  const voters=$('voteVoters');voters.replaceChildren();
  voters.className=mode==='batch'?'vote-voter-grid':'vote-choice-grid';
  if(mode==='batch'&&current!==null){
   for(const id of round.voters){
    const ballot=round.ballots[id],button=document.createElement('button'),name=document.createElement('span');
    button.type='button';button.dataset.voter=String(id);name.textContent=label(id);badge(name,id,round);button.append(name);
    button.setAttribute('aria-label',id+'號投票者');button.setAttribute('aria-pressed',String(ballot===current));
    button.classList.toggle('ballot-selected',ballot===current);
    if(ballot!=null){const note=document.createElement('small');note.textContent=ballot==='abstain'?'棄票':'投'+label(ballot);button.append(note);}
    button.onclick=()=>{setBallot(round,id,current,true);changed();};
    voters.append(button);
   }
  }else if(mode==='individual'&&current!==null){
   const ballot=round.ballots[current];
   for(const choice of [...round.targets,'abstain']){
    const button=document.createElement('button');button.type='button';button.dataset.choice=String(choice);
    button.textContent=label(choice);
    button.setAttribute('aria-label',current+'號投給'+label(choice));
    button.setAttribute('aria-pressed',String(ballot===choice));
    button.classList.toggle('ballot-selected',ballot===choice);
    button.onclick=()=>{setBallot(round,current,choice,true);changed();};
    voters.append(button);
   }
  }
  const tally=tallyVotes(round);
  $('voteProgress').textContent='已紀錄 '+tally.recorded+'／'+tally.total+' 人';
  $('voteStatsContent').replaceChildren(voteGroups(round));
  $('voteStats').open=statsOpen;$('voteOptions').open=optionsOpen;
  $('voteAbandon').hidden=!voteRound(getGame())?.submitted;
  $('voteSubmissionHint').textContent=notice||(!tally.groups.length?'尚無有效得票，請紀錄得票或關閉後手動選擇':tally.recorded<tally.total?'尚有 '+(tally.total-tally.recorded)+' 人未紀錄，將依目前票數完成統計':'');
  const focus=focusVoter!=null?voters.querySelector('[data-voter="'+focusVoter+'"]'):focusChoice!=null?voters.querySelector('[data-choice="'+focusChoice+'"]'):null;
  focus?.focus({preventScroll:true});
  $('voteScroll').scrollTop=resetScroll?0:scroll;
 }
 function step(delta){
  const steps=voteSequence(draft,mode);
  indexes[mode]=Math.max(0,Math.min(steps.length-1,indexes[mode]+delta));
  paint({resetScroll:true});
 }
 $('votePrevious').onclick=()=>step(-1);
 $('voteNext').onclick=()=>step(1);
 $('voteBatch').onclick=()=>{mode='batch';paint({resetScroll:true});};
 $('voteIndividual').onclick=()=>{mode='individual';paint({resetScroll:true});};
 function commit(operation){
  const game=getGame(),before={votePatterns:structuredClone(game.votePatterns||[]),action:[...game.action],choice:game.choice},result=operation(game);
  if(result?.ok===false){notice=result.reason==='empty'?'尚無有效得票，請紀錄得票或關閉後手動選擇':'本輪投票資格已改變，請重新開啟紀錄';paint();return false;}
  if(!save()){Object.assign(game,before);notice='儲存失敗，統計尚未提交；請釋放儲存空間後再試';paint();return false;}
  dialog.close();render();return true;
 }
 $('voteClose').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{draft=null;});
 $('voteDone').onclick=()=>commit(game=>submitVote(game,draft));
 $('voteClear').onclick=()=>$('voteClearDialog').showModal();
 $('voteClearCancel').onclick=()=>$('voteClearDialog').close();
 $('voteClearConfirm').onclick=()=>{draft.ballots={};$('voteClearDialog').close();changed();};
 $('voteAbandon').onclick=()=>$('voteAbandonDialog').showModal();
 $('voteAbandonCancel').onclick=()=>$('voteAbandonDialog').close();
 $('voteAbandonConfirm').onclick=()=>{$('voteAbandonDialog').close();commit(game=>abandonVote(game));};
 return {open(){
  draft=createVoteDraft(getGame());if(!draft)return;
  key=draft.key;notice='';mode='batch';indexes={batch:0,individual:0};
  $('voteStats').open=false;$('voteOptions').open=false;
  paint();dialog.showModal();$('voteScroll').scrollTop=0;
 }};
}
