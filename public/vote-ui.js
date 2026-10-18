import {voteRound,createVoteDraft,submitVote,abandonVote,setBallot,tallyVotes,voteGroups,saveVoteDraft,voteEligibility,validVoteCount,voteResultCard,voteRecapMismatch} from './votes.js';

// Both layouts edit the same per-voter ballot draft; changing views never changes the vote rules.
export const voteSequence=(round,mode)=>mode==='individual'?[...round.voters]:[...round.targets,'abstain'];

export function createVoteDialog({getGame,save,render}){
 const $=id=>document.getElementById(id),dialog=$('voteDialog'),ordinary=createExileVoteEditor({getGame,save,render});
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
 return {renderHost:ordinary.renderHost,open(){
  if(getGame().step==='exileVote'){ordinary.open();return;}
  draft=createVoteDraft(getGame());if(!draft)return;
  key=draft.key;notice='';mode='batch';indexes={batch:0,individual:0};
  $('voteStats').open=false;$('voteOptions').open=false;
  paint();dialog.showModal();$('voteScroll').scrollTop=0;
 }};
}

// Ordinary exile only. The three election/PK screens above retain their controls.
function createExileVoteEditor({getGame,save,render}){
 const $=id=>document.getElementById(id),dialog=$('exileVoteDialog'),list=$('exileVoters'),candidates=$('exileCandidateGrid');
 let owner=null,key=null,draft=null,mode='batch',target=null,voter=null,scrolls={batch:0,individual:0,candidates:0},painting=false,scrollTimer=null,clearStep=0,toastTimer=null,expansion=true,resultOwner=null,resultKey=null;
 const current=()=>draft&&getGame()===owner&&getGame().step==='exileVote'&&createVoteDraft(getGame())?.key===key;
 const ui=()=>({mode,target,voter,scrolls:{...scrolls}});
 const capture=()=>{scrolls[mode]=list.scrollTop;scrolls.candidates=candidates.scrollTop;};
 function store(){
  clearTimeout(scrollTimer);if(!current())return true;capture();const before=structuredClone(owner.votePatterns||[]);
  if(!saveVoteDraft(owner,draft,ui()))return false;
  if(!save()){owner.votePatterns=before;$('exileVoteError').textContent='儲存失敗，草稿尚未保存；請釋放儲存空間後再試';return false;}
  $('exileVoteError').textContent='';return true;
 }
 function badge(el,id){if(id===draft.sheriff){const img=document.createElement('img');img.src='art/moon-eclipse-sheriff-badge.svg';img.alt='警徽';el.append(img);}}
 function paint({reset=false,captureScroll=true}={}){
  if(!current())return;painting=true;if(!reset&&captureScroll)capture();else if(reset)scrolls[mode]=0;
  const focused=document.activeElement?.dataset,focus=focused?.voter?['voter',focused.voter]:focused?.choice?['choice',focused.choice]:null;
  dialog.dataset.mode=mode;$('exileBatch').setAttribute('aria-pressed',String(mode==='batch'));$('exileIndividual').setAttribute('aria-pressed',String(mode==='individual'));
  candidates.hidden=mode!=='batch';$('exileIndividualStep').hidden=mode!=='individual';candidates.replaceChildren();
  const tally=tallyVotes(draft),counts=new Map(tally.groups.map(g=>[g.target,g.votes]));
  for(const id of draft.targets){const button=document.createElement('button'),name=document.createElement('span'),count=document.createElement('small');button.type='button';button.dataset.candidate=String(id);name.textContent=id+'號';badge(name,id);count.textContent=(counts.get(id)||0)+'票';button.append(name,count);button.setAttribute('aria-pressed',String(id===target));button.setAttribute('aria-label',id+'號候選人，'+count.textContent);button.onclick=()=>{if(target===id)return;capture();target=id;paint({reset:true});store();};candidates.append(button);}
  list.replaceChildren();list.className=mode==='batch'?'exile-voters':'exile-voters exile-choices';list.setAttribute('aria-label',mode==='batch'?'投票者列表':'投票對象');
  if(mode==='batch')for(const id of draft.voters){const button=document.createElement('button'),name=document.createElement('span'),status=document.createElement('small'),ballot=draft.ballots[id];button.type='button';button.dataset.voter=String(id);name.textContent=id+'號';badge(name,id);status.textContent=draft.targets.includes(ballot)?'投'+ballot+'號':ballot==='abstain'?'棄票':'未紀錄';button.append(name,status);button.classList.toggle('ballot-selected',ballot===target&&target!==null);button.classList.toggle('ballot-other',draft.targets.includes(ballot)&&ballot!==target);button.setAttribute('aria-label',id+'號投票者，'+status.textContent);button.setAttribute('aria-pressed',String(ballot===target&&target!==null));button.disabled=target===null;button.onclick=()=>{setBallot(draft,id,target,true);paint();store();animate(id);};list.append(button);}
  else for(const id of [...draft.targets,'abstain']){const button=document.createElement('button');button.type='button';button.dataset.choice=String(id);button.textContent=id==='abstain'?'棄票':id+'號';button.setAttribute('aria-pressed',String(draft.ballots[voter]===id));button.classList.toggle('ballot-selected',draft.ballots[voter]===id);button.disabled=voter===null;button.onclick=()=>{setBallot(draft,voter,id,true);paint();store();animate(null,id);};list.append(button);}
  const index=draft.voters.indexOf(voter);$('exileCurrentVoter').replaceChildren(document.createTextNode(voter===null?'無合法投票者':voter+'號'));badge($('exileCurrentVoter'),voter);$('exilePrevious').disabled=index<=0;$('exileNext').disabled=index<0||index>=draft.voters.length-1;
  $('exileProgress').textContent='已紀錄 '+validVoteCount(draft)+'/'+draft.voters.length+' 人';$('exileAbandon').hidden=!voteRound(owner)?.submitted;
  if(focus)list.querySelector('[data-'+focus[0]+'="'+focus[1]+'"]')?.focus({preventScroll:true});
  list.scrollTop=scrolls[mode]||0;candidates.scrollTop=scrolls.candidates||0;painting=false;
 }
 function animate(id,choice){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const button=id?list.querySelector('[data-voter="'+id+'"]'):list.querySelector('[data-choice="'+choice+'"]');button?.animate([{opacity:.65},{opacity:1}],{duration:180});}
 function switchMode(next){if(next===mode)return;capture();mode=next;if(mode==='individual'){voter=draft.voters.find(id=>!Object.hasOwn(draft.ballots,id))??draft.voters[0]??null;scrolls.individual=0;}else if(!draft.targets.includes(target))target=draft.targets[0]??null;paint({reset:mode==='individual',captureScroll:false});store();}
 $('exileBatch').onclick=()=>switchMode('batch');$('exileIndividual').onclick=()=>switchMode('individual');
 for(const [id,delta]of [['exilePrevious',-1],['exileNext',1]])$(id).onclick=()=>{capture();const index=draft.voters.indexOf(voter);voter=draft.voters[Math.max(0,Math.min(draft.voters.length-1,index+delta))]??null;paint({reset:true});store();};
 function close(){if(!store())return;dialog.close();render();}
 $('exileVoteClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{draft=null;clearTimeout(scrollTimer);});
 for(const scroller of [list,candidates])scroller.addEventListener('scroll',()=>{if(painting||!dialog.open)return;capture();clearTimeout(scrollTimer);scrollTimer=setTimeout(store,100);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)store();});window.addEventListener('pagehide',()=>{if(dialog.open)store();});
 function commit(operation){const before={votePatterns:structuredClone(owner.votePatterns||[]),action:[...owner.action],choice:owner.choice},result=operation(owner);if(result?.ok===false){$('exileVoteError').textContent='本輪投票資格已改變，請重新開啟紀錄';return false;}if(!save()){Object.assign(owner,before);$('exileVoteError').textContent='儲存失敗，統計尚未提交；請釋放儲存空間後再試';return false;}clearTimeout(scrollTimer);draft=null;dialog.close();render();return true;}
 $('exileVoteDone').onclick=()=>{if(!current())return;capture();draft.ui=ui();const editing=!!voteRound(owner)?.submitted;expansion=true;if(commit(game=>submitVote(game,draft))&&editing){clearTimeout(toastTimer);$('voteUpdateToast').textContent='票型已更新';$('voteUpdateToast').hidden=false;toastTimer=setTimeout(()=>$('voteUpdateToast').hidden=true,2000);}};
 $('exileClear').onclick=()=>{clearStep=0;$('exileClearTitle').textContent='清空紀錄？';$('exileClearText').textContent='只清除本輪編輯草稿，正式紀錄保持不變。';$('exileClearDialog').showModal();};
 $('exileClearCancel').onclick=()=>$('exileClearDialog').close();$('exileClearConfirm').onclick=()=>{if(clearStep++===0){$('exileClearTitle').textContent='再次確認清空紀錄？';$('exileClearText').textContent='確認後將清空本輪編輯中的選票。';return;}draft.ballots={};$('exileClearDialog').close();paint();store();};
 $('exileAbandon').onclick=()=>$('exileAbandonDialog').showModal();$('exileAbandonCancel').onclick=()=>$('exileAbandonDialog').close();$('exileAbandonConfirm').onclick=()=>{$('exileAbandonDialog').close();commit(game=>abandonVote(game));};
 return {open(){
  owner=getGame();draft=createVoteDraft(owner);if(!draft)return;key=draft.key;Object.assign(draft,voteEligibility(owner));draft.sheriff=owner.sheriff;
  const state=draft.ui||{};mode=state.mode==='individual'?'individual':'batch';target=draft.targets.includes(state.target)?state.target:draft.targets[0]??null;voter=draft.voters.includes(state.voter)?state.voter:draft.voters[0]??null;
  scrolls={batch:Math.max(0,Number(state.scrolls?.batch)||0),individual:Math.max(0,Number(state.scrolls?.individual)||0),candidates:Math.max(0,Number(state.scrolls?.candidates)||0)};
  $('exileVoteError').textContent='';const restored={...scrolls};dialog.showModal();paint({reset:true});const validScroll=(value,el)=>Number.isFinite(value)&&value>=0&&value<=el.scrollHeight-el.clientHeight?value:0;const validSelection=mode==='batch'?draft.targets.includes(state.target):draft.voters.includes(state.voter);scrolls={...restored,[mode]:validSelection?validScroll(restored[mode],list):0,candidates:draft.targets.includes(state.target)?validScroll(restored.candidates,candidates):0};list.scrollTop=scrolls[mode];candidates.scrollTop=scrolls.candidates;
 },renderHost(){
  const game=getGame(),result=$('exileVoteResult'),warning=$('voteMismatch');result.replaceChildren();warning.hidden=true;document.getElementById('host').style.setProperty('--vote-warning-height','0px');
  if(game.step!=='exileVote'){$('voteUpdateToast').hidden=true;return;}
  const round=voteRound(game),button=$('voteNotesOpen');
  if(round?.submitted){const signature=round.key+JSON.stringify(round.ballots);if(resultOwner!==game||resultKey!==signature){resultOwner=game;resultKey=signature;expansion=true;}result.append(voteResultCard(round,{onEdit:()=>this.open(),open:expansion,onToggle:value=>{expansion=value;}}));if(button)button.hidden=true;}
  else if(round){if(button)button.textContent='繼續紀錄票型';const progress=document.createElement('p');progress.className='small';progress.textContent='已紀錄 '+validVoteCount(round)+'/'+round.voters.length+' 人';result.append(progress);}
  if(voteRecapMismatch(game)){warning.textContent='目前選擇與票型統計結果不同，繼續後不記錄本輪票型復盤。';warning.hidden=false;document.getElementById('host').style.setProperty('--vote-warning-height',(warning.getBoundingClientRect().height+8)+'px');}
 }};
}
