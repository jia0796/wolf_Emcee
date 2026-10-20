import test from 'node:test';
import assert from 'node:assert/strict';
import {watchRoom} from '../client/private-channel.mjs';
test('private channel refetches authority, ignores stale responses and covers cards on background/cleanup',async()=>{
 const events={},pending=[],states=[];let hidden=0,removed=0,handler,status;
 globalThis.document={visibilityState:'visible',addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
 globalThis.window={addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
 const channel={on:(type,filter,f)=>{handler=f;return channel;},subscribe:f=>{status=f;return channel;}};
 const client={channel:(topic,options)=>{assert.equal(topic,'wolfcue:test');assert.equal(options.config.private,true);return channel;},removeChannel:()=>removed++};
 const stop=watchRoom(client,'test',{getState:()=>new Promise(resolve=>pending.push(resolve)),onState:s=>states.push(s),invalidateRole:()=>hidden++,onError:()=>{}});
 try{
  status('SUBSCRIBED');handler({payload:{role:'forged',version:99}});
  pending[1]({version:2});await Promise.resolve();
  pending[0]({version:1});await Promise.resolve();
  assert.deepEqual(states,[{version:2}]);
  handler({});document.visibilityState='hidden';events.visibilitychange();assert.ok(hidden>=3);
  pending[2]({version:3});await Promise.resolve();
  assert.deepEqual(states,[{version:2}],'Backgrounding invalidates in-flight authority response');
  handler({});assert.equal(pending.length,3,'No refresh while backgrounded');
 }finally{stop();delete globalThis.document;delete globalThis.window;}
 assert.equal(removed,1);assert.deepEqual(events,{});
});
