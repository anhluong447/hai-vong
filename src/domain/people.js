import {FATIGUE} from '../../content/gameplay/balance.js';
export const joined = state => state.people.filter(p => p.joinDay <= state.day);
export const person = (state,id) => state.people.find(p => p.id === id);
export function effectiveStat(state,p,key) {
  const penalty = state.betrayal && p.romance ? 1 - state.config.romancePenalty : 1;
  return p.stats[key] * penalty * Math.max(FATIGUE.minimumEfficiency,1 - p.fatigue / FATIGUE.divisor);
}
