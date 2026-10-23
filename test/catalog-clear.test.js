import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ROLE_DATA} from '../public/data.js';
import {CATALOG_CLEAR,catalogImage,catalogFallback} from '../public/catalog-art.js';
test('catalog derivatives cover every role without replacing original role images',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/catalog-clear-assets.json',import.meta.url)));
 assert.deepEqual(Object.keys(CATALOG_CLEAR).sort(),Object.keys(ROLE_DATA).sort());
 for(const r of manifest){assert.equal(ROLE_DATA[r.id].image,r.image);assert.equal(CATALOG_CLEAR[r.id],r.derived);const bytes=await readFile(new URL('../public/'+r.derived,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);assert.equal(bytes[25],6,'RGBA PNG');}
 assert.equal(catalogImage('unknown','original.png'),'original.png');
});
test('failed catalog derivative falls back once to original artwork',()=>{
 const image={src:'new.png',getAttribute(){return this.src;},addEventListener(type,handler,options){assert.equal(type,'error');assert.equal(options.once,true);this.fail=handler;}};
 catalogFallback(image,'original.png');image.fail();assert.equal(image.src,'original.png');
});
test('catalog and glass code are core; derivative images are progressive optional assets',async()=>{
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),core=sw.match(/const CORE=\[(.*?)\];/s)[1];
 assert.ok(core.includes('catalog-art.js')&&core.includes('liquid-glass.css'));
 for(const path of Object.values(CATALOG_CLEAR)){assert.ok(sw.includes(path));assert.ok(!core.includes(path));}
});
