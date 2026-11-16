import {cp,mkdir,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {unzipSync} from 'fflate';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'dist');
if(path.dirname(out)!==path.resolve(root)||path.basename(out)!=='dist')throw Error('Invalid build path');
await rm(out,{recursive:true,force:true});
await cp(path.join(root,'public'),out,{recursive:true});
const manifest=JSON.parse(await readFile(path.join(root,'sample-bundles/manifest.json'),'utf8'));
for(const item of manifest.bundles){
  const zip=await readFile(path.join(root,'sample-bundles',item.file));
  if(createHash('sha256').update(zip).digest('hex')!==item.sha256)throw Error('Sample bundle hash mismatch: '+item.file);
  const entries=unzipSync(zip);
  if(Object.keys(entries).sort().join('\n')!==item.entries.slice().sort().join('\n'))throw Error('Unexpected sample bundle contents');
  const base=path.resolve(out,'assets',item.destination);
  for(const [name,bytes] of Object.entries(entries)){
    const dest=path.resolve(base,name);
    if(!dest.startsWith(base+path.sep))throw Error('Unsafe bundle path');
    await mkdir(path.dirname(dest),{recursive:true});
    await writeFile(dest,bytes);
  }
  if(item.generated)await writeFile(path.join(base,'photo-and-maps.zip'),zip);
}
const require=createRequire(import.meta.url);
const transformers=path.dirname(path.dirname(require.resolve('@huggingface/transformers')));
const ort=path.dirname(path.dirname(require.resolve('onnxruntime-web')));
await build({entryPoints:[path.join(root,'src/depth.worker.js')],outfile:path.join(out,'depth.worker.js'),bundle:true,format:'esm',platform:'browser',minify:true,alias:{'@huggingface/transformers':path.join(transformers,'dist/transformers.web.js'),'onnxruntime-web/webgpu':path.join(ort,'dist/ort.wasm.min.mjs')}});
await mkdir(path.join(out,'vendor'),{recursive:true});
for(const file of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])await cp(path.join(ort,'dist',file),path.join(out,'vendor',file));
for(const file of ['LICENSE','THIRD_PARTY_NOTICES.md','ASSET_PROVENANCE.md'])await cp(path.join(root,file),path.join(out,file));
await writeFile(path.join(out,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/*.html\n  Cache-Control: no-cache\n');
console.log('Built independent Deepbrush demo with '+manifest.bundles.length+' verified sample bundles.');
