import { createClient } from "npm:@supabase/supabase-js@2.118.0";
const url=Deno.env.get("SUPABASE_URL")!;
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{error:"METHOD_NOT_ALLOWED"});
 const bearer=req.headers.get("Authorization")||"";
 if(!/^Bearer \S+$/.test(bearer))return reply(401,{error:"UNAUTHORIZED"});
 // Never elevate the caller. PostgREST verifies the JWT and the SQL EXECUTE
 // grant permits only service_role. Player and forged JWTs cannot clean up.
 const client=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")!,{
  global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.rpc("wolfcue_expire");
 return error?reply(401,{error:"UNAUTHORIZED"}):reply(200,{closed:data});
});
