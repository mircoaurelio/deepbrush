import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {packDepthNormalMap} from '../public/vendor/depthNormalPacked.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const manifest=JSON.parse(await readFile(path.join(root,'sample-bundles/manifest.json'),'utf8'));
for(const item of manifest.bundles.filter(i=>i.generated)){
 const base=path.join(dist,'assets',item.destination),provenance=JSON.parse(await readFile(path.join(base,'provenance.json'),'utf8'));
 const decoded={};
 for(const name of ['photo.png','depth.png','normal.png','combined.png']){
  const bytes=await readFile(path.join(base,name));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),provenance.files[name].sha256);
  decoded[name]=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(decoded[name].info.width,provenance.photo.width);assert.equal(decoded[name].info.height,provenance.photo.height);
 }
 const repacked=packDepthNormalMap(decoded['depth.png'].data,decoded['normal.png'].data,provenance.photo.width,provenance.photo.height).pixels;
 assert.ok(Buffer.from(repacked).equals(decoded['combined.png'].data),'Combined map mismatch: '+item.id);
}
const html=await readFile(path.join(dist,'index.html'),'utf8');
assert.ok(html.includes('Independent demo'));assert.ok(html.includes('https://github.com/mircoaurelio/deepbrush'));
assert.ok(!html.includes('data-sample="car"'));assert.ok(html.includes('data-sample="cloth" class="active"'));
for(const name of ['JINJA-LICENSE.txt','TOKENIZERS-LICENSE.txt','ONNX-LICENSE.txt','ONNX-THIRD-PARTY-NOTICES.txt','TRANSFORMERS-LICENSE.txt'])assert.ok((await readFile(path.join(dist,'vendor',name))).length>100);
console.log('Verified map hashes, dimensions, combined packing, default sample, source link and notices.');
