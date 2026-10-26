/** Presentation alone gates locomotion; old saves retain their domain movement flag. */
export function resolveWorldPresentation(state){return {...state.world,moving:state.world.moving&&['idle','end'].includes(state.story.waiting)&&!state.gameplay.hearing};}
