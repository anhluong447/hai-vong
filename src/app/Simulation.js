import { createGame, activeSubjects, activeStaff, interview, scout, editArticle, selectArticles, nextDay } from '../core/game.js?v=press-sandbox-2';
import { groupPower } from '../core/rules.js?v=press-sandbox-2';
import { DEFAULT_CONFIG } from '../core/config.js?v=press-sandbox-2';
import { STAFF } from '../core/fixtures.js?v=press-sandbox-2';

export const POLICIES = [
  { id: 'balanced', name: 'Cân bằng', scout: true, noVan: true, cap: 4 },
  { id: 'use-van', name: 'Dùng Vân bất chấp', scout: true, cap: 4 },
  { id: 'grit80', name: 'Gai góc 80%', scout: true, noVan: true, cap: 4, grit: 0.8 },
  { id: 'greedy', name: 'Tham điểm 100%', noVan: true, cap: 4, grit: 1, greedy: true },
  { id: 'safe', name: 'Chỉ an toàn', noVan: true, cap: 4, grit: 0, safe: true },
  { id: 'hibernate', name: 'Một bài / tuần', scout: true, noVan: true, cap: 1 },
  { id: 'solo', name: 'Khuê làm một mình', scout: true, noVan: true, cap: 4, solo: true },
  { id: 'late', name: 'An toàn 5 tuần rồi bung', scout: true, noVan: true, cap: 4, late: true },
];
function value(subject,state,policy) {
  const attraction = subject.scouted ? subject.attraction : subject.preview;
  const pressure = subject.scouted ? subject.pressure : subject.previewPressure;
  const base = state.config.maxScore * (attraction / 10) ** state.config.attractionExponent;
  if (policy.greedy) return base;
  const pace = state.config.evidenceRequired * Math.min(1,state.week / 11);
  const mainBonus = subject.main && state.evidence < pace ? 1.35 : 1;
  const penalty = state.pressure > 60 ? 1 - Math.min(0.8,Math.max(0,(pressure - 6) / 40)) : 1;
  return base * mainBonus * penalty / subject.energy ** 0.3;
}
export function autoDay(original,policy = POLICIES[0]) {
  let state = structuredClone(original);
  if (state.outcome) return state;
  const safe = policy.safe || (policy.late && state.week <= 5);
  for (let guard = 0; guard < 20 && state.weekArticles.length < policy.cap; guard++) {
    const candidates = activeSubjects(state).filter(s => s.energy <= state.energy && (!safe || (s.scouted ? s.pressure : s.previewPressure) <= 6));
    if (!candidates.length) break;
    candidates.sort((a,b) => value(b,state,policy) - value(a,state,policy) || a.id.localeCompare(b.id));
    const subject = candidates[0];
    if (policy.scout && !subject.scouted && state.energy >= subject.energy + state.config.scoutCost) { state = scout(state,subject.id); continue; }
    let available = activeStaff(state).filter(c => !state.workedToday.includes(c.id));
    const withoutVan = available.filter(c => c.id !== 'van');
    if (policy.noVan && withoutVan.length >= 2) available = withoutVan;
    let pair = null;
    if (policy.solo) {
      // simulate() supplies a one-person roster for this isolated scenario.
      const khue = available.find(c => c.id === 'khue');
      if (khue) pair = [khue,null];
    } else {
      let best = -Infinity;
      for (const a of available) for (const b of available) if (a.id !== b.id) {
        const power = groupPower(a,b,subject,state.fatigue,state.config);
        if (power > best) { best = power; pair = [a,b]; }
      }
      if (!pair && available.length === 1 && available[0].id === 'khue') pair = [available[0],null];
    }
    if (!pair) break;
    state = interview(state,subject.id,pair[0].id,pair[1]?.id ?? null);
  }
  if (policy.scout && state.energy >= state.config.scoutCost) {
    const candidates = activeSubjects(state).filter(s => !s.scouted).sort((a,b) => value(b,state,policy) - value(a,state,policy));
    if (candidates[0]) state = scout(state,candidates[0].id);
  }
  if (state.day % state.config.daysPerWeek === 0) {
    const grit = safe ? 0 : policy.grit ?? (state.pressure < 40 ? 0.6 : state.pressure < 70 ? 0.4 : 0.2);
    for (const article of state.weekArticles) state = editArticle(state,article.id,grit);
    state = selectArticles(state,state.weekArticles.filter(a => a.score > 0).sort((a,b) => b.score - a.score).slice(0,4).map(a => a.id));
  }
  return nextDay(state);
}
export function simulate(policy = POLICIES[0],config = DEFAULT_CONFIG,staff = STAFF) {
  let state = createGame(config);
  state.staff = structuredClone(staff);
  if (policy.solo) state.staff = state.staff.filter(c => c.id === 'khue');
  while (!state.outcome) state = autoDay(state,policy);
  return state;
}
