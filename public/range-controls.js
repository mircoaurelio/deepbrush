// The same native track geometry and fill offset as Mapshroom RangeInput.
export function rangeValueAtPosition(position,length,min,max,step=1){
 const ratio=Math.max(0,Math.min(1,(Math.round(position)-4)/Math.max(1,Math.round(length)-8)));
 const increment=step==='any'?0:step>0?step:1,raw=min+ratio*Math.max(0,max-min);
 const value=increment?min+Math.round((raw-min)/increment)*increment:raw;
 const reachableMax=increment?min+Math.floor((max-min)/increment+1e-9)*increment:max;
 return Number(Math.max(min,Math.min(reachableMax,value)).toFixed(12));
}
export function syncRangeFill(input){const min=Number(input.min)||0,max=Number(input.max)||100;const ratio=Math.max(0,Math.min(1,(Number(input.value)-min)/Math.max(1,max-min)));input.style.setProperty('--range-fill-position',`calc(${ratio*100}% + ${4-ratio*8}px)`);}
export function installRangeControls(){
 for(const input of document.querySelectorAll('input[type="range"]')){
  input.dataset.rangeInput='true';syncRangeFill(input);
  input.addEventListener('input',()=>syncRangeFill(input));
  let drag=null;
  const clearHover=()=>input.style.removeProperty('--range-hover-position');
  const move=event=>{if(!drag||drag.id!==event.pointerId)return;const rect=input.getBoundingClientRect();const next=rangeValueAtPosition(event.clientX-rect.left-drag.offset,rect.width,Number(input.min)||0,Number(input.max)||100,input.step==='any'?'any':Number(input.step)||1);if(input.valueAsNumber!==next){input.value=String(next);input.dispatchEvent(new Event('input',{bubbles:true}));}};
  const finish=event=>{if(drag?.id!==event.pointerId)return;drag=null;if(input.hasPointerCapture(event.pointerId))input.releasePointerCapture(event.pointerId);clearHover();};
  input.addEventListener('pointerdown',event=>{if(!['pen','touch'].includes(event.pointerType)||event.button!==0||!event.isPrimary||input.disabled||drag)return;event.preventDefault();const rect=input.getBoundingClientRect(),position=event.clientX-rect.left,min=Number(input.min)||0,max=Number(input.max)||100,thumb=4+(input.valueAsNumber-min)/(max-min)*(rect.width-8);drag={id:event.pointerId,offset:Math.abs(position-thumb)<=4?position-thumb:0};clearHover();input.focus({preventScroll:true});input.setPointerCapture(event.pointerId);move(event);});
  input.addEventListener('pointermove',event=>{move(event);if(event.pointerType==='mouse'&&!input.disabled){const rect=input.getBoundingClientRect();input.style.setProperty('--range-hover-position',`${Math.max(1,Math.min(rect.width-1,event.clientX-rect.left))}px`);}});
  input.addEventListener('pointerup',event=>{move(event);finish(event);});
  for(const type of ['pointercancel','lostpointercapture'])input.addEventListener(type,finish);
  input.addEventListener('pointerleave',clearHover);input.addEventListener('keydown',clearHover);
 }
}
