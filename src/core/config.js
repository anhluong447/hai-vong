import {t} from '../shared/text.js';
import {DEFAULT_CONFIG} from '../../content/sandbox/balance.js';
export {DEFAULT_CONFIG};

export function validateConfig(config) {
  const keys = Object.keys(DEFAULT_CONFIG);
  if (!config || keys.some(key => !(key in config)) || Object.keys(config).some(key => !keys.includes(key))) throw new Error(t("src.core.config.cau_hinh_thieu_hoac_co_tham_so_khong_hop_le"));
  for (const [key, value] of Object.entries(config)) {
    const values = Array.isArray(value) ? value : [value];
    if (values.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0)) throw new Error(t("src.core.config.tham_so_value0_phai_la_so_huu_han_khong_am", {value0: (key)}));
  }
  for (const key of ['weeks', 'daysPerWeek', 'dailyEnergy', 'slots']) if (!Number.isInteger(config[key]) || config[key] < 1) throw new Error(t("src.core.config.value0_phai_la_so_nguyen_duong", {value0: (key)}));
  if (config.weeks !== 12 || config.daysPerWeek !== 5 || config.slots !== 4) throw new Error(t("src.core.config.ban_sandbox_nay_dung_lich_12_5_ngay_va_4_slot"));
  for (const key of ['scoutCost', 'maxScore', 'qualityCap', 'qualityFail', 'evidenceRequired']) if (config[key] <= 0) throw new Error(t("src.core.config.value0_phai_lon_hon_0", {value0: (key)}));
  for (const key of ['fatigueFactor', 'reputationAlpha', 'pressureDecay', 'pressureCarry', 'suspensionMultiplier', 'vanPenalty', 'vanPenaltyCap', 'soloSupport']) if (config[key] > 1) throw new Error(t("src.core.config.value0_phai_nam_trong_0_1", {value0: (key)}));
  if (config.qualityFail > config.qualityCap) throw new Error(t("src.core.config.nguong_that_bai_khong_duoc_vuot_tran_q"));
  if (config.initialReputation > 100 || config.reputationRequired > 100) throw new Error(t("src.core.config.uy_tin_phai_nam_trong_0_100"));
  for (const [key, length] of [['slotWeights',4], ['equipmentThresholds',3], ['actThresholds',3], ['strikeFractions',2], ['strikeReputation',3], ['scheduledWeeks',2]]) if (config[key].length !== length) throw new Error(t("src.core.config.value0_can_value1_phan_tu", {value0: (key), value1: (length)}));
  if (config.equipmentThresholds.some((n,i,a) => n > 100 || (i > 0 && n <= a[i-1]))) throw new Error(t("src.core.config.moc_trang_bi_phai_tang_dan_trong_0_100"));
  if (config.actThresholds.some(n => n <= 0)) throw new Error(t("src.core.config.nguong_ap_luc_phai_lon_hon_0"));
  if (config.strikeFractions[0] > config.strikeFractions[1] || config.strikeFractions[1] > 1) throw new Error(t("src.core.config.ti_le_muc_don_phai_tang_dan_trong_0_1"));
  if (config.scheduledWeeks.some(n => !Number.isInteger(n) || n < 1 || n > config.weeks)) throw new Error(t("src.core.config.tuan_ra_don_nam_ngoai_hoc_ky"));
  return structuredClone(config);
}
