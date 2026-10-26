import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import pg from 'pg';
import {localConfig} from './local-env.mjs';
if(existsSync('supabase/.temp/project-ref'))throw Error('Refusing a linked checkout');
const config=localConfig(),pool=new pg.Pool({connectionString:config.DB_URL});
const version='20261026072534',name='awakened_king_witch_board';
try{
 const history=(await pool.query('select version,name from supabase_migrations.schema_migrations order by version')).rows;
 const before=(await pool.query('select id,capacity,roles,catalog_hash from wolfcue_private.boards order by id')).rows;
 const sql=readFileSync(`supabase/migrations/${version}_${name}.sql`,'utf8');
 const client=await pool.connect();
 try{await client.query('begin');await client.query(sql);await client.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3) on conflict(version) do nothing',[version,name,[sql]]);const after=(await client.query('select id,capacity,roles,catalog_hash from wolfcue_private.boards order by id')).rows;
 for(const row of before)assert.deepEqual(after.find(r=>r.id===row.id),row);
 const board=after.find(r=>r.id==='awakenedKingWitch12');assert.equal(board.capacity,12);assert.equal(board.roles.length,12);
 await client.query('commit');const result={environment:'local loopback Docker Supabase only',existingBoardRowsPreserved:before.length,totalBoards:after.length,applied:version,preExistingLocalHistory:history.map(r=>({version:r.version,name:r.name})),cloudModified:false};writeFileSync('reports/akw-local-migration.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await client.query('rollback');throw e;}finally{client.release();}
}finally{await pool.end();}
