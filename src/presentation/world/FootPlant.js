/** Art-authored support anchors, resolved from distance; no extra saved gait state. */
export function resolveFootPlant(clip,travelled,scale){
 const gait=clip.locomotion,plant=gait?.plant;if(!plant)return null;
 const phase=(travelled%gait.cycleDistance)/gait.cycleDistance,total=clip.frames.reduce((n,f)=>n+f.duration,0);
 const indexAt=value=>{let time=value*total;for(let i=0;i<clip.frames.length;i++){if(time<clip.frames[i].duration-1e-10)return i;time-=clip.frames[i].duration;}return clip.frames.length-1;};
 const contact=gait.contacts.findLast(c=>c.phase<=phase+1e-10),anchor=plant.anchors[indexAt(phase)],origin=plant.anchors[indexAt(contact.phase)];
 return {anchor,kneeY:plant.kneeY,foot:contact.foot,shift:origin.x-anchor.x-(phase-contact.phase)*gait.cycleDistance/scale};
}
