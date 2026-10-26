import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BOARDS,ROLE_DATA} from '../../public/data.js';
const file=new URL('../references/board-catalog.json',import.meta.url),catalog=JSON.parse(readFileSync(file,'utf8'));
const b=BOARDS.awakenedKingWitch12;
if(catalog.boards.some(x=>x.id===b.id))throw Error('AKW catalogue already exists; inspect before replacing');
const board={id:b.id,name:b.name,capacity:b.playerCount,roles:b.roles,defaults:b.defaults,adjustable:b.adjustable,firstNightOrder:b.firstNightOrder??b.nightOrder,nightOrder:b.nightOrder};
board.catalogHash=createHash('sha256').update(JSON.stringify(board)).digest('hex');
catalog.boards.push(board);catalog.additions.push({boardId:b.id,specCommit:'6e369159df420b9831bb4f29b236328ec94aa875',catalogHash:board.catalogHash,note:'Append-only AKW catalogue; prior 27 rows and hashes preserved'});
for(const role of ['awakenedKing','awakenedWitch']){const r=ROLE_DATA[role];catalog.roles[role]={name:r.name,kind:r.kind,image:r.image};}
writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
const roles=Object.entries(b.roles).flatMap(([role,n])=>Array(n).fill("'"+role+"'")).join(',');
const sql=`-- AKW only: append a validated board; never alter existing rooms, assignments, RLS or 27 prior catalogue rows.\ndo $$ begin\n if exists(select 1 from wolfcue_private.boards where id='${b.id}' and (capacity<>12 or roles<>ARRAY[${roles}]::text[] or catalog_hash<>'${board.catalogHash}')) then raise exception 'AKW catalogue mismatch'; end if;\nend $$;\ninsert into wolfcue_private.boards(id,capacity,roles,catalog_hash) values('${b.id}',12,ARRAY[${roles}]::text[],'${board.catalogHash}') on conflict(id) do nothing;\n`;
writeFileSync(new URL('../supabase/migrations/20261026072534_awakened_king_witch_board.sql',import.meta.url),sql);
console.log(JSON.stringify({id:b.id,capacity:12,catalogHash:board.catalogHash,boards:catalog.boards.length}));
