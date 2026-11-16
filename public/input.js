export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function fitSize(width,height,max=1280){const s=Math.min(1,max/Math.max(width,height));return {width:Math.max(1,Math.round(width*s)),height:Math.max(1,Math.round(height*s))};}
export function pointerToUV(x,y,rect){const u=(x-rect.left)/rect.width,v=1-(y-rect.top)/rect.height;return {x:clamp(u),y:clamp(v),inside:u>=0&&v>=0&&u<=1&&v<=1};}
export function strokeSamples(from,to,radius,shape={}){const narrow=(shape.roundness??1)*(shape.shape>0?.2:1)*(shape.sizing?.45:1);const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/Math.max(.0005,radius*narrow*.25)));return Array.from({length:n},(_,i)=>({x:from.x+(to.x-from.x)*(i+1)/n,y:from.y+(to.y-from.y)*(i+1)/n}));}
export class PixelHistory{
  constructor(budget=96*1024*1024){this.budget=budget;this.clear();}
  clear(){this.entries=[];this.cursor=0;this.bytes=0;}
  push(entry){this.entries.splice(this.cursor);this.entries.push(entry);this.cursor=this.entries.length;this.bytes=this.entries.reduce((n,e)=>n+e.before.byteLength+e.after.byteLength,0);while(this.bytes>this.budget&&this.entries.length>0){const e=this.entries.shift();this.bytes-=e.before.byteLength+e.after.byteLength;this.cursor--;}}
  undo(){if(!this.cursor)return null;const e=this.entries[--this.cursor];return {layer:e.layer,pixels:e.before};}
  redo(){if(this.cursor===this.entries.length)return null;const e=this.entries[this.cursor++];return {layer:e.layer,pixels:e.after};}
  get canUndo(){return this.cursor>0;}get canRedo(){return this.cursor<this.entries.length;}
}
