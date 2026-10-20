import {readFileSync,writeFileSync} from 'node:fs';
const c=JSON.parse(readFileSync('references/board-catalog.json'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
writeFileSync('supabase/seed.sql','-- Local test catalogue: immutable source roles, no real assignments or users.\n'+
c.boards.map(b=>`insert into wolfcue_private.boards(id,capacity,roles,catalog_hash) values (${quote(b.id)},${b.capacity},ARRAY[${Object.entries(b.roles).flatMap(([r,n])=>Array(n).fill(quote(r))).join(',')}],${quote(c.catalogHash)});`).join('\n')+'\n');
