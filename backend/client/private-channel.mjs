// Integration DRAFT, not imported into the App.
// getState must call the authorized Edge endpoint; invalidateRole MUST cover card.
export function watchRoom(client,roomId,{getState,onState,invalidateRole,onError}){
 let closed=false,request=0;
 async function refresh(){
  if(closed||document.visibilityState==='hidden')return;
  const ticket=++request;invalidateRole(); // default covered until revalidated
  try{const s=await getState();if(!closed&&ticket===request)onState(s);}
  catch{if(!closed&&ticket===request)onError();}
 }
 const channel=client.channel(`wolfcue:${roomId}`,{config:{private:true}})
 .on('broadcast',{event:'changed'},()=>refresh())
 .subscribe(status=>{
  if(closed)return;
  if(status==='SUBSCRIBED')refresh();
  else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){invalidateRole();onError();}
 });
 // Broadcast is a hint, never authority. Polling does not renew room idle time.
 const interval=setInterval(refresh,15000);
 const visibility=()=>{++request;invalidateRole();if(document.visibilityState==='visible')refresh();};
 const online=()=>refresh();
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('online',online);
 return ()=>{closed=true;++request;clearInterval(interval);invalidateRole();
  document.removeEventListener('visibilitychange',visibility);
  window.removeEventListener('online',online);return client.removeChannel(channel);};
}
