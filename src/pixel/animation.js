// Clip selection is independent of rendering and never advances gameplay.
// 8-frame walk cycle phase model: contact -> down -> pass -> up (x2 feet)
export const WALK_8_PHASES = Object.freeze([
 { index: 0, phase: 'contact', subPhase: 'contact-l', supportLeg: 'left', swingLeg: 'right', isContact: true, step: 0 },
 { index: 1, phase: 'down', subPhase: 'down-l', supportLeg: 'left', swingLeg: 'right', isContact: false, step: 0 },
 { index: 2, phase: 'pass', subPhase: 'pass-r', supportLeg: 'left', swingLeg: 'right', isContact: false, step: 0 },
 { index: 3, phase: 'up', subPhase: 'up-l', supportLeg: 'left', swingLeg: 'right', isContact: false, step: 0 },
 { index: 4, phase: 'contact', subPhase: 'contact-r', supportLeg: 'right', swingLeg: 'left', isContact: true, step: 1 },
 { index: 5, phase: 'down', subPhase: 'down-r', supportLeg: 'right', swingLeg: 'left', isContact: false, step: 1 },
 { index: 6, phase: 'pass', subPhase: 'pass-l', supportLeg: 'right', swingLeg: 'left', isContact: false, step: 1 },
 { index: 7, phase: 'up', subPhase: 'up-r', supportLeg: 'right', swingLeg: 'left', isContact: false, step: 1 }
]);

export function walkPhaseInfo(index){
 return WALK_8_PHASES[((index % 8) + 8) % 8];
}

export function walkCadence({ stepSeconds = 0.18, stridePixels = 32, tilePixels = 16, frames = 8 } = {}){
 const stepsPerCycle = 2;
 const stepPixels = stridePixels / stepsPerCycle;
 const cycleSeconds = stepSeconds * stepsPerCycle;
 const stepsPerSecond = 1 / stepSeconds;
 const velocity = tilePixels / stepSeconds;
 const footSlidePixels = Math.abs(stepPixels - tilePixels);
 const frameDistance = stridePixels / frames;
 return {
  stepsPerCycle,
  stepPixels,
  cycleSeconds,
  stepsPerSecond,
  velocity,
  footSlidePixels,
  frameDistance,
  isSynchronized: footSlidePixels === 0
 };
}

export function clipFrame(sprite,clipName,direction,elapsedMs=0,distance=0){
 const name=sprite.clips[clipName]?clipName:'idle',clip=sprite.clips[name];
 const columns=clip.columns;
 let index=0;
 if(clip.stridePixels){
  const stride=clip.stridePixels;
  const d=(((distance%stride)+stride)%stride);
  if(clip.distances&&clip.distances.length===columns.length){
   index=0;
   for(let i=0;i<clip.distances.length;i++){
    if(d>=clip.distances[i]){index=i;}else break;
   }
  }else{
   index=Math.floor(d/stride*columns.length);
  }
 }else{
  const durations=clip.durations||columns.map(()=>clip.frameMs||100);
  const length=durations.reduce((sum,n)=>sum+n,0);
  let t=clip.loop===false?Math.min(Math.max(0,elapsedMs),length-1):((elapsedMs%length)+length)%length;
  for(let i=0;i<durations.length;i++){if(t<durations[i]){index=i;break;}t-=durations[i];}
 }
 const dir=sprite.directions.indexOf(direction);
 const phaseInfo=(columns.length===8&&name==='walk')?WALK_8_PHASES[index]:null;
 return {
  x:columns[index]*sprite.frameWidth,
  y:clip.rows[Math.max(0,dir)]*sprite.frameHeight,
  width:sprite.frameWidth,
  height:sprite.frameHeight,
  index,
  clip:name,
  phase:clip.phases?clip.phases[index]:(phaseInfo?phaseInfo.phase:null),
  subPhase:phaseInfo?phaseInfo.subPhase:null,
  supportLeg:phaseInfo?phaseInfo.supportLeg:null,
  swingLeg:phaseInfo?phaseInfo.swingLeg:null,
  isContact:phaseInfo?phaseInfo.isContact:false
 };
}
export function spriteBounds(sprite,column=0,row=0){return{x:column*sprite.frameWidth,y:row*sprite.frameHeight,width:sprite.frameWidth,height:sprite.frameHeight};}
