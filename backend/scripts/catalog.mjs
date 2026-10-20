import {BOARDS,ROLE_DATA} from '../../public/data.js';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const boards=Object.values(BOARDS).filter(b=>b.enabled).map(b=>({
 id:b.id,name:b.name,capacity:b.playerCount,roles:b.roles,defaults:b.defaults,
 adjustable:b.adjustable,firstNightOrder:b.firstNightOrder??b.nightOrder,nightOrder:b.nightOrder
}));
for(const b of boards){
 if(![10,12].includes(b.capacity)||Object.values(b.roles).reduce((a,n)=>a+n,0)!==b.capacity)throw Error('Invalid board '+b.id);
 for(const [role,count] of Object.entries(b.roles))if(!ROLE_DATA[role]||!Number.isInteger(count)||count<=0)throw Error('Invalid role');
}
const data={sourceCommit:execFileSync('git',['-C','..','rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 catalogHash:createHash('sha256').update(JSON.stringify(boards)).digest('hex'),boards,
 roles:Object.fromEntries(Object.entries(ROLE_DATA).map(([id,r])=>[id,{name:r.name,kind:r.kind,image:r.image}]))};
mkdirSync('references',{recursive:true});
writeFileSync('references/board-catalog.json',JSON.stringify(data,null,2));
writeFileSync('reports/boards.md','# 現有角色配置（唯讀匯出）\n\n來源：`'+data.sourceCommit+'`。這是既有配置快照，不代表新的線上發牌規則。\n\n| ID | 人數 | 名稱 | 角色 |\n|---|---:|---|---|\n'+boards.map(b=>`| ${b.id} | ${b.capacity} | ${b.name} | ${Object.entries(b.roles).map(([r,n])=>`${ROLE_DATA[r].name} ×${n}`).join('、')} |`).join('\n')+'\n');
console.log(`${boards.length} boards validated; ${data.catalogHash}`);
