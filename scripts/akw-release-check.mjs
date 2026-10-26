import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),baseline='6e369159df420b9831bb4f29b236328ec94aa875',base=process.env.UI_BASE||'https://jia0796.github.io/wolf_Emcee/',out=new URL('../docs/akw-evidence/',import.meta.url);await mkdir(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:30*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=git('ls-tree','-r','--name-only',baseline,'public/skills','public/art').toString().trim().split(/\r?\n/).filter(p=>/\.(svg|png|webp|jpg|jpeg)$/i.test(p)),originals=[];
for(const path of paths){const old=git('show',baseline+':'+path),now=await readFile(new URL(path,root));const normalize=b=>path.endsWith('.svg')?Buffer.from(b.toString('utf8').replaceAll('\r\n','\n')):b;assert.equal(sha(normalize(now)),sha(normalize(old)),path);originals.push({path,sha256:sha(normalize(now)),svgLineEndingsNormalized:path.endsWith('.svg')});}
const originalSkills=originals.filter(x=>x.path.startsWith('public/skills/')).length;assert.equal(originalSkills,26);
const published=[];
if(process.env.CHECK_LIVE==='1'){
 const changed=git('diff','--name-only',baseline,'HEAD','--','public').toString().trim().split(/\r?\n/).filter(Boolean);
 for(const path of changed){const relative=path.replace(/^public\//,''),res=await fetch(base+relative+'?akw-verify=20261026');assert.equal(res.status,200,path);const remote=Buffer.from(await res.arrayBuffer()),local=await readFile(new URL(path,root)),normalize=b=>/\.(js|css|html)$/.test(path)?Buffer.from(b.toString('utf8').replaceAll('\r\n','\n')):b;assert.equal(sha(normalize(remote)),sha(normalize(local)),path);published.push({path,sha256:sha(normalize(remote))});}
}
const result={baseline,originalSkills,originalArt:originals.length-originalSkills,originals,published,liveVerified:process.env.CHECK_LIVE==='1',passed:true};await writeFile(new URL(process.env.CHECK_LIVE==='1'?'release-hashes.json':'original-hashes.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify({originalSkills,originalArt:result.originalArt,published:published.length,passed:true}));
