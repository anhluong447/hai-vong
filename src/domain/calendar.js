import {t} from '../shared/text.js';
import {CALENDAR} from '../../content/gameplay/balance.js';
export const weekend = day => (day - 1) % CALENDAR.daysPerWeek >= CALENDAR.schoolDays;
export const schoolDay = day => !weekend(day);
export const week = day => Math.floor((day - 1) / CALENDAR.daysPerWeek) + 1;
export const dayOfWeek = day => (day - 1) % CALENDAR.daysPerWeek + 1;
export const totalWeeks = (days = CALENDAR.maxDays) => Math.floor(days / CALENDAR.daysPerWeek);
export const weekday = day => [t("src.gameplay.engine.thu_hai"),t("src.gameplay.engine.thu_ba"),t("src.gameplay.engine.thu_tu"),t("src.gameplay.engine.thu_nam"),t("src.gameplay.engine.thu_sau"),t("src.gameplay.engine.thu_bay"),t("src.gameplay.engine.chu_nhat")][(day - 1) % CALENDAR.daysPerWeek];
export const isPublicationDay = day => (day - 1) % CALENDAR.daysPerWeek === CALENDAR.publicationDay;

/** 3-act story arc across 12 calendar weeks: Act 1 (W1-3), Act 2 (W4-7), Act 3 (W8-12). */
export const act = w => (w <= 3 ? 1 : (w <= 7 ? 2 : 3));
export const storyAct = act;
export const actForDay = day => act(week(day));
export const remainingDays = (day, totalDays = CALENDAR.maxDays) => Math.max(0, totalDays - day);
export const remainingWeeks = (day, totalDays = CALENDAR.maxDays) => Math.max(0, totalWeeks(totalDays) - week(day));
export const isSemesterEnd = (day, totalDays = CALENDAR.maxDays) => day >= totalDays;

export const SEMESTER_WEEKS = 12;
export const SEMESTER_DAYS = 84;
export const SCHOOL_DAYS_PER_SEMESTER = 60;

export function consumeSlot(s) {
  const phase=s.phase==='investigation'?s.investigationFrom:s.phase;
  s.phase={personal:'evening',evening:'bed',weekend1:'weekend2',weekend2:'evening'}[phase];
  delete s.investigationFrom;
}
