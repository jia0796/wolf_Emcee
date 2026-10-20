import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';
import {localConfig} from '../../scripts/local-env.mjs';
test('parallel authorized cleanup workers close expired waiting rooms once, retain recent rooms',async()=>{
 const c=localConfig(),db=new pg.Pool({connectionString:c.DB_URL});
 const client=createClient(c.API_URL,c.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {error}=await client.auth.signInAnonymously();assert.equal(error,null);
  const created=await client.rpc('wolfcue_command',{p_action:'create',p_body:{boardId:'10',requestId:randomUUID()}});
  assert.equal(created.error,null);const id=created.data.roomId;
  await db.query("update wolfcue_private.rooms set last_effective_at=now()-interval '121 minutes' where id=$1",[id]);
  const version=(await db.query('select version from wolfcue_private.rooms where id=$1',[id])).rows[0].version;
  const worker=async()=>{const conn=await db.connect();try{await conn.query('begin');await conn.query('set local role service_role');await conn.query('select public.wolfcue_expire()');await conn.query('commit');}finally{conn.release();}};
  await Promise.all([worker(),worker(),worker()]);
  const row=(await db.query('select status,version from wolfcue_private.rooms where id=$1',[id])).rows[0];
  assert.equal(row.status,'expired');assert.equal(Number(row.version),Number(version)+1);
  const fresh=await client.rpc('wolfcue_command',{p_action:'create',p_body:{boardId:'10',requestId:randomUUID()}});
  await worker();
  assert.equal((await client.rpc('wolfcue_command',{p_action:'state',p_room:fresh.data.roomId})).data.status,'waiting');
  await client.rpc('wolfcue_command',{p_action:'dissolve',p_room:fresh.data.roomId});
 }finally{await db.end();await client.removeAllChannels();}
});
