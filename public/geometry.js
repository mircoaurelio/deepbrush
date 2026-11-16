import {packDepthNormalMap,renderDepthTilesNormals} from './vendor/depthNormalPacked.js';
export function decodeNormal(r,g){const x=r*2-1,y=g*2-1,z=Math.max(0,1-Math.abs(x)-Math.abs(y)),l=Math.hypot(x,y,z)||1;return [x/l,y/l,z/l];}
export function prepareGeometry(depth,source,width,height){return packDepthNormalMap(depth,renderDepthTilesNormals(depth,source,width,height),width,height).pixels;}
export function flatGeometry(source){const data=new Uint8ClampedArray(source.length);for(let i=0;i<data.length;i+=4)data.set([128,128,128,source[i+3]],i);return data;}
