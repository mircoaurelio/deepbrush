import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerToUV, strokeSamples, PixelHistory, fitSize } from '../public/input.js';
import { decodeNormal, prepareGeometry } from '../public/geometry.js';

test('pointer is mapped to lower-left shader UV regardless of page offsets', () => {
  assert.deepEqual(pointerToUV(160, 70, {left:60,top:20,width:200,height:100}), {x:.5,y:.5,inside:true});
  assert.deepEqual(pointerToUV(60, 20, {left:60,top:20,width:200,height:100}), {x:0,y:1,inside:true});
  assert.equal(pointerToUV(59, 20, {left:60,top:20,width:200,height:100}).inside,false);
});
test('fast drags leave continuous strokes, including the end point', () => {
  const points=strokeSamples({x:0,y:0},{x:1,y:0},.1);
  assert.ok(points.length >= 40); assert.equal(points.at(-1).x,1);
  for(let i=1;i<points.length;i++) assert.ok(points[i].x-points[i-1].x<=.02501);
});
test('working resolution preserves aspect and never upscales',()=>{
  assert.deepEqual(fitSize(4000,2000),{width:1280,height:640});
  assert.deepEqual(fitSize(100,200),{width:100,height:200});
});
test('thin brush drags sample their narrow axis without gaps',()=>{
  const points=strokeSamples({x:0,y:0},{x:0,y:.8},.1,{roundness:.1,shape:0,sizing:0});
  assert.ok(points.length>=300);
  for(let i=1;i<points.length;i++)assert.ok(points[i].y-points[i-1].y<=.002501);
});
test('undo/redo preserves original pixels and a new edit drops redo history',()=>{
  const h=new PixelHistory(100), a=new Uint8Array([1,2]), b=new Uint8Array([3,4]),c=new Uint8Array([5,6]);
  h.push({layer:'paint',before:a,after:b});
  assert.deepEqual(h.undo().pixels,a); assert.deepEqual(h.redo().pixels,b);
  h.undo(); h.push({layer:'light',before:a,after:c}); assert.equal(h.redo(),null);
});
test('history byte budget evicts oldest edits',()=>{
  const h=new PixelHistory(8);
  for(let i=0;i<3;i++)h.push({layer:'paint',before:new Uint8Array([i,i]),after:new Uint8Array([i+1,i+1])});
  assert.ok(h.bytes<=8); assert.equal(h.undo().pixels[0],2); assert.equal(h.undo().pixels[0],1); assert.equal(h.undo(),null);
});
test('combined map encodes geometry rather than photo brightness',()=>{
  const depth=new Uint8ClampedArray(4*9), source=new Uint8ClampedArray(4*9);
  for(let i=0;i<36;i+=4){depth.set([128,128,128,255],i);source.set([20,80,190,255],i);}
  const map=prepareGeometry(depth,source,3,3);
  assert.equal(map[2],128); const n=decodeNormal(map[0]/255,map[1]/255);
  assert.ok(Math.abs(n[0])<.01 && Math.abs(n[1])<.01 && n[2]>.99);
  source[3]=0; assert.equal(prepareGeometry(depth,source,3,3)[3],0);
});
