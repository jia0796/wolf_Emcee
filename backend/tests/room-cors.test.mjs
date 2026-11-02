import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=readFileSync(new URL('../supabase/functions/room/index.ts',import.meta.url),'utf8');
const code=transformSync(source.replace(/^import .*createClient.*;\r?\n/m,''),{loader:'ts',format:'iife'}).code;
function runtime(){
 let handler,authCalls=0;
 vm.runInNewContext(code,{Deno:{env:{get:()=> 'test-only'},serve:f=>handler=f},Request,Response,Headers,TextDecoder,Uint8Array,Set,JSON,
  createClient:()=>({auth:{getUser:async()=>{authCalls++;return {data:{user:null},error:{message:'deleted test account'}};}}})});
 return {request:(origin,method='OPTIONS',bearer=false)=>handler(new Request('https://example.invalid/room',{method,headers:{...(origin?{Origin:origin}:{}),...(bearer?{Authorization:'Bearer test-only'}:{})}})),authCalls:()=>authCalls};
}
for(const origin of ['https://wolfcue.runs-at.dev','https://jia0796.github.io','http://localhost:5173','http://127.0.0.1:5173']){
 test('preflight accepts exact approved origin '+origin,async()=>{
  const app=runtime(),r=await app.request(origin);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(r.headers.get('Vary'),'Origin');assert.equal(app.authCalls(),0);
 });
}
for(const origin of ['https://untrusted.invalid','https://wolfcue.runs-at.dev.evil.invalid','http://wolfcue.runs-at.dev','https://other.runs-at.dev']){
 test('rejects unapproved origin before authentication '+origin,async()=>{
  const app=runtime(),r=await app.request(origin,'POST',true);assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.equal((await r.json()).error,'ORIGIN_NOT_ALLOWED');assert.equal(app.authCalls(),0);
 });
}
test('new domain still requires Auth and rejects deleted accounts',async()=>{
 const app=runtime(),missing=await app.request('https://wolfcue.runs-at.dev','POST');assert.equal(missing.status,401);assert.equal(app.authCalls(),0);
 const deleted=await app.request('https://wolfcue.runs-at.dev','POST',true);assert.equal(deleted.status,401);assert.equal(deleted.headers.get('Access-Control-Allow-Origin'),'https://wolfcue.runs-at.dev');assert.equal((await deleted.json()).error,'AUTH_REQUIRED');assert.equal(app.authCalls(),1);
});
