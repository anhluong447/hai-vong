import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export function spendEnergy(state,cost){
 if(!Number.isFinite(cost)||cost<0)return failure(diagnostic('energy.cost.invalid','gameplay','/cost'));
 if(state.gameplay.energy<cost)return failure(diagnostic('energy.insufficient','gameplay','/energy'));
 return success({...state,gameplay:{...state.gameplay,energy:state.gameplay.energy-cost}});
}
