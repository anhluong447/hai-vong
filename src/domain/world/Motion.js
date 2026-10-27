/** Exact piecewise constant acceleration. Only clamped travel drives gait/foley. */
export function integrateMotion(state,{axis,delta},{speed,accelSeconds,stopSeconds,bounds}){
 if(![state.position,state.velocity,state.travelled,axis,delta,speed,accelSeconds,stopSeconds,bounds.min,bounds.max].every(Number.isFinite)||Math.abs(axis)>1||delta<0||speed<=0||accelSeconds<=0||stopSeconds<=0||state.travelled<0||bounds.min>=bounds.max)throw new Error('motion.invalid');
 let {position,velocity,travelled}=state,remaining=delta,actualDistance=0;const target=axis*speed,rate=speed/(axis===0?stopSeconds:accelSeconds);
 for(let budget=0;remaining>1e-12&&budget<4;budget++){
  const acceleration=velocity===target?0:Math.sign(target-velocity)*rate;
  let duration=acceleration?Math.min(remaining,Math.abs(target-velocity)/rate):remaining;
  if(velocity*target<0)duration=Math.min(duration,Math.abs(velocity)/rate);
  const nextVelocity=acceleration?velocity+acceleration*duration:velocity,displacement=(velocity+nextVelocity)*duration/2;
  const candidate=position+displacement,next=Math.max(bounds.min,Math.min(bounds.max,candidate)),distance=Math.abs(next-position);
  position=next;travelled+=distance;actualDistance+=distance;remaining-=duration;velocity=Math.abs(nextVelocity-target)<1e-9?target:Math.abs(nextVelocity)<1e-9?0:nextVelocity;
  if(candidate!==next){velocity=0;break;}
 }
 return {position,velocity,travelled,actualDistance};
}
