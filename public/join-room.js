export const normalizeRoomCode=value=>String(value??'').trim().toUpperCase();
export const validRoomCode=value=>/^[A-HJKMNP-Z2-9]{5}$/.test(normalizeRoomCode(value));

export function installJoinRoom({join}){
 const dialog=document.createElement('dialog');dialog.id='joinRoomDialog';dialog.setAttribute('aria-labelledby','joinRoomTitle');
 dialog.innerHTML='<form novalidate><div class="dialog-head"><h2 id="joinRoomTitle">加入房間</h2><button type="button" data-cancel aria-label="關閉加入房間">×</button></div><label for="joinRoomCode">房間號碼</label><input id="joinRoomCode" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="32" placeholder="例如 A78B2" aria-describedby="joinRoomHint joinRoomError" required><p id="joinRoomHint" class="small">輸入主持人的 5 碼房號，英文大小寫皆可。</p><p id="joinRoomError" role="alert"></p><div class="actions"><button type="button" data-cancel>取消</button><button type="submit" class="primary">加入房間</button></div></form>';
 document.body.append(dialog);const input=dialog.querySelector('input'),error=dialog.querySelector('[role=alert]'),submit=dialog.querySelector('[type=submit]');let busy=false;
 dialog.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>{if(!busy)dialog.close();});dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 input.addEventListener('input',()=>{error.textContent='';input.removeAttribute('aria-invalid');});
 dialog.querySelector('form').onsubmit=async e=>{
  e.preventDefault();if(busy)return;
  const code=normalizeRoomCode(input.value);input.value=code;
  if(!validRoomCode(code)){error.textContent='請輸入 5 碼英文與數字房號（不含 O、0、I、1、L）';input.setAttribute('aria-invalid','true');input.focus();return;}
  busy=true;input.disabled=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);submit.textContent='正在加入…';error.textContent='';
  try{await join(code);dialog.close();}
  catch(e){error.textContent=e.message||'連線未完成，請重試';}
  finally{busy=false;input.disabled=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);submit.textContent='加入房間';if(dialog.open)input.focus();}
 };
 return {open(){if(busy)return;input.value='';error.textContent='';input.removeAttribute('aria-invalid');dialog.showModal();input.focus();}};
}
