import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ROLE_DATA} from '../public/data.js';
import {CATALOG_ART_V2,libraryImage} from '../public/catalog-v2.js';
import {CATALOG_CLEAR,catalogImage} from '../public/catalog-art.js';

test('new catalog covers the existing roles exactly and preserves original and legacy clear art',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/catalog-v2-assets.json',import.meta.url)));
 assert.equal(manifest.length,35);
 assert.deepEqual(Object.keys(CATALOG_ART_V2).sort(),Object.keys(ROLE_DATA).sort());
 for(const row of manifest){
  assert.equal(ROLE_DATA[row.id].image,row.original);
  assert.equal(catalogImage(row.id,'fallback'),CATALOG_CLEAR[row.id]);
  assert.notEqual(CATALOG_CLEAR[row.id],libraryImage(row.id,'fallback'));
  assert.equal(libraryImage(row.id,'fallback'),row.full);
  assert.equal(libraryImage(row.id,'fallback',{thumbnail:true}),row.thumbnail);
 }
 assert.equal(libraryImage('unimplemented','fallback'),'fallback');
});
test('all 66 catalog assets are real verified WebP files with lightweight list variants',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/catalog-v2-assets.json',import.meta.url)));
 for(const row of manifest)for(const key of ['full','thumbnail']){
  const bytes=await readFile(new URL('../public/'+row[key],import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.equal(bytes.length,row[key+'Bytes']);assert.equal(createHash('sha256').update(bytes).digest('hex'),row[key+'Sha256']);
  if(key==='thumbnail')assert.ok(bytes.length<200000&&bytes.length<row.fullBytes,row.id);
 }
});
test('catalog shell is core while every full image and thumbnail stays optional',async()=>{
 const sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),core=sw.match(/const CORE=\[(.*?)\];/s)[1];
 for(const path of ['catalog-v2.js','catalog-ui.css'])assert.ok(core.includes(path));
 for(const row of Object.values(CATALOG_ART_V2))for(const path of Object.values(row)){assert.ok(sw.includes(path));assert.ok(!core.includes(path));}
});
