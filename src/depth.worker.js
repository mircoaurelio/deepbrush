import {env,pipeline,RawImage} from '@huggingface/transformers';
env.allowLocalModels=false;env.useBrowserCache=true;env.useWasmCache=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths=new URL('./vendor/',self.location.href).href;
self.onmessage=async({data})=>{if(data.type!=='estimate')return;const id=data.id;try{
 const estimator=await pipeline('depth-estimation','onnx-community/depth-anything-v2-small',{revision:'4472b7362082ad9968fee890ca0f1e5aca36b93d',device:'wasm',dtype:'q8',progress_callback:p=>self.postMessage({type:'progress',id,percent:p.progress||0,message:p.status==='progress'?`Downloading model · ${Math.round(p.progress||0)}%`:'Loading Depth Anything V2…'})});
 self.postMessage({type:'phase',id,message:'Estimating depth on your device…'});
 const image=new RawImage(new Uint8ClampedArray(data.pixels),data.width,data.height,4);
 const result=await estimator(image);const depth=result.depth;const pixels=new Uint8Array(depth.data);
 self.postMessage({type:'result',id,width:depth.width,height:depth.height,channels:depth.channels,pixels:pixels.buffer},[pixels.buffer]);await estimator.dispose();
}catch(error){self.postMessage({type:'error',id,message:error.message||String(error)});}};
