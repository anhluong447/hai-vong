import {createGameplayState} from '../domain/gameplay/state.js';
/** The known Phase-0 v1 shape is additive; unknown tagged/3D layouts stay export-only. */
export function schemaStepsFor(bundle){return [{from:1,to:2,guard:'phase0-side-scroll-v1',defaults:{formatTag:'hoi-am.side-scroll',gameplay:createGameplayState(bundle)}}];}
