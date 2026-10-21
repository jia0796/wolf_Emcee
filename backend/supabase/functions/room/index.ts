import { createClient } from "npm:@supabase/supabase-js@2.118.0";

// No service key in the user endpoint. JWT is verified by Auth, then forwarded
// so the DB derives auth.uid() itself. Never trust a supplied actor identifier.
const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_ANON_KEY")!;
const allowed = new Set(["create","recover","join","state","seat","leave","clear","deal","my_role","dissolve","end"]);
const baseHeaders = {
 "Content-Type":"application/json", "Cache-Control":"no-store",
 "Pragma":"no-cache", "X-Content-Type-Options":"nosniff",
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
 "Access-Control-Allow-Methods":"POST,OPTIONS", "Vary":"Origin"
};
Deno.serve(async req => {
 const origin=req.headers.get("Origin");
 const origins=new Set(["https://jia0796.github.io","http://localhost:5173","http://127.0.0.1:5173"]);
 const headers={...baseHeaders,...(origin&&origins.has(origin)?{"Access-Control-Allow-Origin":origin}:{})};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:"ORIGIN_NOT_ALLOWED"});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply(405,{error:"METHOD_NOT_ALLOWED"});
 const bearer=req.headers.get("Authorization")||"";
 if(!/^Bearer \S+$/.test(bearer))return reply(401,{error:"AUTH_REQUIRED"});
 try {
  // Bounded streaming reader; Content-Length alone is not trusted.
  const reader=req.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
  if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;
   if(size>4096){await reader.cancel();return reply(413,{error:"BODY_TOO_LARGE"});}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).some(k=>!["action","roomId","body"].includes(k))||
   !allowed.has(body.action))return reply(400,{error:"INVALID_INPUT"});
  const client=createClient(url,key,{global:{headers:{Authorization:bearer}},
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:identity,error:authError}=await client.auth.getUser(bearer.slice(7));
  if(authError||!identity.user)return reply(401,{error:"AUTH_REQUIRED"});
  const {data,error}=await client.rpc("wolfcue_command",{
   p_action:body.action,p_room:body.roomId??null,p_body:body.body??{}
  });
  // Never expose database detail, request bodies, tokens, roles, stack traces.
  if(error?.code==="42501"&&error.message==="ROOM_UNAVAILABLE")return reply(403,{error:"ROOM_UNAVAILABLE",message:"房間已關閉或無法存取"});
  if(error)return reply(error.code==="42501"?403:400,{error:"OPERATION_REJECTED"});
  return reply(data?.error?409:200,data);
 }catch{return reply(400,{error:"INVALID_REQUEST"});}
});
