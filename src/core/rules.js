import { DEFAULT_CONFIG } from './config.js?v=press-sandbox-2';

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export function efficiency(fatigue, config = DEFAULT_CONFIG) { return 1 - config.fatigueFactor * clamp(fatigue, 0, 100) / 100; }
export function equipmentCount(maxReputation, config = DEFAULT_CONFIG) { return config.equipmentThresholds.filter(n => maxReputation >= n).length; }
export function groupPower(reporter, supporter, subject, fatigue, config = DEFAULT_CONFIG) {
  return config.reporterWeight * reporter.stats.PV * efficiency(fatigue[reporter.id] ?? 0, config)
    + config.supporterWeight * (supporter ?? reporter).stats[subject.need] * efficiency(fatigue[(supporter ?? reporter).id] ?? 0, config) * (supporter ? 1 : config.soloSupport);
}
export function quality(power, equipment, difficulty, offset, config = DEFAULT_CONFIG) {
  return clamp(1 + (power + equipment - difficulty - offset - config.qualityOffset) / 10, 0, config.qualityCap);
}
export function articleValues(subject, q, grit, config = DEFAULT_CONFIG) {
  if (q < config.qualityFail) return { score: 0, pressure: 0, evidence: 0 };
  const g = clamp(grit, 0, 1);
  return {
    score: Math.min(config.maxScore, config.maxScore * (subject.attraction / 10) ** config.attractionExponent * q * (config.scoreBase + config.scoreGrit * g)),
    pressure: subject.pressure * (config.pressureBase + g),
    evidence: subject.main ? config.evidenceBase * q * (config.pressureBase + g) : 0,
  };
}
export function paperLabel(score) {
  return [[90000,'BANGER'],[60000,'Lan ra ngoài trường'],[30000,'Được quan tâm'],[5000,'Được nhắc đến'],[500,'Lác đác bàn tán'],[50,'Chưa thu hút'],[0,'Chẳng ai quan tâm']].find(([n]) => score >= n)[1];
}
export function ending(state, config = DEFAULT_CONFIG) {
  if (state.zeroRepStreak >= 2) return 'disbanded';
  if (state.day <= config.weeks * config.daysPerWeek) return null;
  if (state.evidence < config.evidenceRequired) return 'defeat';
  return state.reputation >= config.reputationRequired ? 'win' : 'bitter';
}

export function publicationPreview(state, selectedIds = state.selectedArticleIds, config = state.config) {
  const selected = state.weekArticles.filter(a => selectedIds.includes(a.id)).sort((a,b) => b.score - a.score || a.id.localeCompare(b.id));
  const weightedScore = selected.reduce((sum,a,i) => sum + (config.slotWeights[i] ?? 0) * a.score, 0);
  const vanTasks = state.weekArticles.filter(a => a.reporterId === 'van' || a.supporterId === 'van').length;
  const vanMultiplier = 1 - Math.min(config.vanPenaltyCap, config.vanPenalty * vanTasks);
  const suspensionMultiplier = state.suspendedNextWeek ? config.suspensionMultiplier : 1;
  const score = Math.min(config.maxScore, weightedScore) * vanMultiplier * suspensionMultiplier;
  const realCount = selected.filter(a => a.score > 0).length;
  const reputationBeforeStrike = clamp((1 - config.reputationAlpha) * state.reputation + config.reputationAlpha * score / 1000 - config.emptyPenalty * (config.slots - realCount) - (realCount === 0 ? config.blankPenalty : 0), 0, 100);
  const evidenceGain = selected.reduce((sum,a) => sum + a.evidence, 0);
  const pressureGain = selected.reduce((sum,a) => sum + a.pressure, 0);
  const pressureBeforeStrike = state.pressure * config.pressureDecay + pressureGain;
  const act = state.week <= 3 ? 0 : state.week <= 7 ? 1 : 2;
  const threshold = config.actThresholds[act];
  const emergency = pressureBeforeStrike >= threshold;
  const scheduled = config.scheduledWeeks.includes(state.week);
  const strike = emergency ? 2 : scheduled ? (pressureBeforeStrike < threshold * config.strikeFractions[0] ? 0 : pressureBeforeStrike < threshold * config.strikeFractions[1] ? 1 : 2) : null;
  const reputationPenalty = strike === null ? 0 : config.strikeReputation[strike];
  return { selectedIds: selected.map(a => a.id), weightedScore, vanTasks, vanMultiplier, suspensionMultiplier, score, realCount,
    reputationBeforeStrike, reputationPenalty, reputation: Math.max(0, reputationBeforeStrike - reputationPenalty),
    evidenceGain, evidence: state.evidence + evidenceGain, pressureGain, pressureBeforeStrike,
    pressure: strike === null ? pressureBeforeStrike : pressureBeforeStrike * config.pressureCarry,
    strike, emergency, scheduled, threshold, label: paperLabel(score),
    // Equipment is unlocked as soon as the pre-strike reputation reaches a threshold.
    maxReputation: Math.max(state.maxReputation, reputationBeforeStrike),
  };
}
