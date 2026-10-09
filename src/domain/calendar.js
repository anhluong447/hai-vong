import {t} from '../shared/text.js';
import {CALENDAR} from '../../content/gameplay/balance.js';
export const weekend = day => (day - 1) % CALENDAR.daysPerWeek >= CALENDAR.schoolDays;
export const week = day => Math.floor((day - 1) / CALENDAR.daysPerWeek) + 1;
export const weekday = day => [t("src.gameplay.engine.thu_hai"),t("src.gameplay.engine.thu_ba"),t("src.gameplay.engine.thu_tu"),t("src.gameplay.engine.thu_nam"),t("src.gameplay.engine.thu_sau"),t("src.gameplay.engine.thu_bay"),t("src.gameplay.engine.chu_nhat")][(day - 1) % CALENDAR.daysPerWeek];
export function consumeSlot(s) {
  const phase=s.phase==='investigation'?s.investigationFrom:s.phase;
  s.phase={personal:'evening',evening:'bed',weekend1:'weekend2',weekend2:'evening'}[phase];
  delete s.investigationFrom;
}
