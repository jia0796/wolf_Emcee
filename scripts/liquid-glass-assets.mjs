import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.UI_BASE||'https://jia0796.github.io/wolf_Emcee/';
const output=new URL('../docs/liquid-glass-evidence/live/assets.json',import.meta.url);
const files=['index.html','style.css','b3.css','online.css','liquid-glass.css','app.js','catalog-art.js','b3-ui.js','sw.js','cache-manifest.js','engine.js','data.js','night.js','recap.js','online.js','art/backgrounds/lobby-shared.png','art/backgrounds/host-day.png','art/backgrounds/host-night.png','art/backgrounds/online-plaza-v3.png'];
const results=[];
for(const file of files){
 const response=await fetch(new URL(file,base),{cache:'no-store'});assert.equal(response.status,200,file);
 const local=await readFile(new URL('../public/'+file,import.meta.url)),remote=Buffer.from(await response.arrayBuffer());
 const normalize=b=>file.endsWith('.png')?b:Buffer.from(b.toString('utf8').replace(/\r\n/g,'\n'));
 const hash=b=>createHash('sha256').update(normalize(b)).digest('hex');assert.equal(hash(remote),hash(local),file);
 results.push({file,sha256:hash(remote),passed:true});
}
await mkdir(new URL('./',output),{recursive:true});await writeFile(output,JSON.stringify({base,passed:results.length,failed:0,textNormalization:'CRLF to LF',results},null,2));console.log(JSON.stringify({passed:results.length,failed:0}));
