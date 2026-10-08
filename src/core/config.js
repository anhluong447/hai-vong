export const DEFAULT_CONFIG = Object.freeze({
  weeks: 12, daysPerWeek: 5, dailyEnergy: 4, scoutCost: 1,
  slots: 4, slotWeights: [0.80, 0.25, 0.12, 0.08],
  fatigueTask: 20, fatigueNight: 10, fatigueWeekend: 30, fatigueFactor: 0.5,
  reporterWeight: 0.6, supporterWeight: 0.4, soloSupport: 0.5,
  qualityOffset: 1, qualityCap: 1.4, qualityFail: 0.6,
  maxScore: 100000, attractionExponent: 2,
  scoreBase: 0.85, scoreGrit: 0.30, pressureBase: 0.5, evidenceBase: 12,
  initialReputation: 30, reputationAlpha: 0.3, emptyPenalty: 2, blankPenalty: 5,
  equipmentThresholds: [42, 55, 68], vanPenalty: 0.10, vanPenaltyCap: 0.25,
  pressureDecay: 0.85, actThresholds: [100, 130, 160], scheduledWeeks: [3, 7],
  strikeFractions: [0.4, 0.8], strikeReputation: [3, 6, 10],
  pressureCarry: 0.3, suspensionMultiplier: 0.5, maxDifficultyOffset: 2,
  evidenceRequired: 200, reputationRequired: 55,
});

export function validateConfig(config) {
  const keys = Object.keys(DEFAULT_CONFIG);
  if (!config || keys.some(key => !(key in config)) || Object.keys(config).some(key => !keys.includes(key))) throw new Error('Cấu hình thiếu hoặc có tham số không hợp lệ.');
  for (const [key, value] of Object.entries(config)) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0)) throw new Error(`Tham số ${key} phải là số hữu hạn không âm.`);
  }
  for (const key of ['weeks', 'daysPerWeek', 'dailyEnergy', 'slots']) if (!Number.isInteger(config[key]) || config[key] < 1) throw new Error(`${key} phải là số nguyên dương.`);
  if (config.weeks !== 12 || config.daysPerWeek !== 5 || config.slots !== 4) throw new Error('Bản sandbox này dùng lịch 12 × 5 ngày và 4 slot.');
  for (const key of ['scoutCost', 'maxScore', 'qualityCap', 'qualityFail', 'evidenceRequired']) if (config[key] <= 0) throw new Error(`${key} phải lớn hơn 0.`);
  for (const key of ['fatigueFactor', 'reputationAlpha', 'pressureDecay', 'pressureCarry', 'suspensionMultiplier', 'vanPenalty', 'vanPenaltyCap', 'soloSupport']) if (config[key] > 1) throw new Error(`${key} phải nằm trong [0, 1].`);
  if (config.qualityFail > config.qualityCap) throw new Error('Ngưỡng thất bại không được vượt trần Q.');
  if (config.initialReputation > 100 || config.reputationRequired > 100) throw new Error('Uy tín phải nằm trong [0, 100].');
  for (const [key, length] of [['slotWeights',4], ['equipmentThresholds',3], ['actThresholds',3], ['strikeFractions',2], ['strikeReputation',3], ['scheduledWeeks',2]]) if (config[key].length !== length) throw new Error(`${key} cần ${length} phần tử.`);
  if (config.equipmentThresholds.some((n,i,a) => n > 100 || (i > 0 && n <= a[i-1]))) throw new Error('Mốc trang bị phải tăng dần trong [0, 100].');
  if (config.actThresholds.some(n => n <= 0)) throw new Error('Ngưỡng áp lực phải lớn hơn 0.');
  if (config.strikeFractions[0] > config.strikeFractions[1] || config.strikeFractions[1] > 1) throw new Error('Tỉ lệ mức đòn phải tăng dần trong [0, 1].');
  if (config.scheduledWeeks.some(n => !Number.isInteger(n) || n < 1 || n > config.weeks)) throw new Error('Tuần ra đòn nằm ngoài học kỳ.');
  return structuredClone(config);
}
