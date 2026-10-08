// Clip selection is independent of rendering and never advances gameplay.
export function clipFrame(sprite,clipName,direction,elapsedMs=0,distance=0){
 const name=sprite.clips[clipName]?clipName:'idle',clip=sprite.clips[name];
 const columns=clip.columns;
 let index=0;
 if(clip.stridePixels){index=Math.floor((((distance%clip.stridePixels)+clip.stridePixels)%clip.stridePixels)/clip.stridePixels*columns.length);}
 else{
  const durations=clip.durations||columns.map(()=>clip.frameMs||100);
  const length=durations.reduce((sum,n)=>sum+n,0);
  let t=clip.loop===false?Math.min(Math.max(0,elapsedMs),length-1):((elapsedMs%length)+length)%length;
  for(let i=0;i<durations.length;i++){if(t<durations[i]){index=i;break;}t-=durations[i];}
 }
 const dir=sprite.directions.indexOf(direction);
 return {x:columns[index]*sprite.frameWidth,y:clip.rows[Math.max(0,dir)]*sprite.frameHeight,width:sprite.frameWidth,height:sprite.frameHeight,index,clip:name};
}
export function spriteBounds(sprite,column=0,row=0){return{x:column*sprite.frameWidth,y:row*sprite.frameHeight,width:sprite.frameWidth,height:sprite.frameHeight};}
