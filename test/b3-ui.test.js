import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {backgroundSource} from '../public/b3-ui.js';

test('B3 uses only lobby for non-host screens and the current host phase',()=>{
 for(const screen of ['home','counts','boards','setup','encyclopedia','finished'])for(const phase of ['夜晚','白天',null])assert.equal(backgroundSource(screen,phase),'art/backgrounds/lobby-shared.png');
 assert.equal(backgroundSource('host','夜晚'),'art/backgrounds/host-night.png');assert.equal(backgroundSource('host','白天'),'art/backgrounds/host-day.png');
});
test('B3 official PNG bytes and all 26 pre-B3 skill originals remain exact',async()=>{
 const assets=JSON.parse(await readFile(new URL('../docs/b3-assets.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(assets.unchangedSkills).length,26);
 for(const [path,hash]of Object.entries(assets.unchangedSkills)){const bytes=await readFile(new URL('../'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,path);}
 for(const a of assets.backgrounds){const bytes=await readFile(new URL('../'+a.path,import.meta.url));assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);}
});
test('B3 backgrounds remain optional while presentation code is available offline',async()=>{
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),core=sw.match(/const CORE=\[(.*?)\];/s)[1];
 for(const name of ['lobby-shared','host-day','host-night'])assert.equal(core.includes(name+'.png'),false);
 assert.ok(core.includes('b3-ui.js')&&core.includes('b3.css')&&core.includes('art/backgrounds/shared.png'));
});

test('Frost Emcee branding and standalone icon preserve the installed app identity',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.name,'霜月司儀｜狼人殺主持工具');assert.equal(manifest.short_name,'霜月司儀');
 assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.ok(html.includes('<title>'+manifest.name+'</title>'));assert.ok(html.includes('apple-touch-icon" href="frost-emcee-192.png'));
 for(const size of [192,512]){const png=await readFile(new URL('../public/frost-emcee-'+size+'.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.ok(manifest.icons.some(i=>i.src==='frost-emcee-'+size+'.png'));}
});
