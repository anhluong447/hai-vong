/** Stateless distance crossings: restore and pause never replay missed contacts. */
export class FootstepConductor {
 consume(outcome,{clip,scenePresentation}){
  const gait=clip?.locomotion,cues=scenePresentation?.footstepCueIds;
  if(outcome.type!=='world.moved'||!(outcome.actualDistance>0)||!gait||!cues?.length)return [];
  const events=[];for(const contact of gait.contacts){
   const start=outcome.travelledBefore/gait.cycleDistance-contact.phase,end=outcome.travelledAfter/gait.cycleDistance-contact.phase;
   for(let n=Math.floor(start+1e-9)+1;n<=Math.floor(end+1e-9);n++){const ordinal=n*gait.contacts.length+gait.contacts.indexOf(contact);events.push({cueId:cues[((ordinal%cues.length)+cues.length)%cues.length],phase:contact.phase,foot:contact.foot,distance:(n+contact.phase)*gait.cycleDistance});}
  }return events.sort((a,b)=>a.distance-b.distance);
 }
}
