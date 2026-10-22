/** Display projection only. GameSession independently validates every interaction. */
export function resolveInteraction(world,scene,flags){
 return scene?.interactions.filter(i=>Math.abs(i.x-world.position)<=i.radius&&(!i.condition||flags[i.condition.flag]===i.condition.equals)).sort((a,b)=>Math.abs(a.x-world.position)-Math.abs(b.x-world.position)||a.id.localeCompare(b.id))[0]??null;
}
