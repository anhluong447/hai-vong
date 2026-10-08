import { validateConfig } from '../core/config.js?v=press-sandbox-2';
import { STATE_VERSION } from '../core/game.js?v=press-sandbox-2';

export const SAVE_KEY = 'clb-bao-chi.sandbox.v1';
export function validateSave(state) {
  if (!state || state.kind !== 'press-club-sandbox' || state.version !== STATE_VERSION) throw new Error('Save không thuộc sandbox CLB Báo Chí hoặc khác phiên bản.');
  validateConfig(state.config);
  if (!Number.isInteger(state.day) || state.day < 1 || state.day > 61 || !Number.isInteger(state.week) || state.week !== Math.min(12,Math.floor((state.day - 1) / 5) + 1)) throw new Error('Ngày/tuần trong save không hợp lệ.');
  for (const key of ['energy','reputation','maxReputation','pressure','evidence','difficultyOffset','zeroRepStreak']) if (!Number.isFinite(state[key]) || state[key] < 0) throw new Error(`Save có ${key} không hợp lệ.`);
  if (state.energy > state.config.dailyEnergy || state.reputation > 100 || state.maxReputation > 100 || state.maxReputation < state.reputation || state.difficultyOffset > state.config.maxDifficultyOffset) throw new Error('Chỉ số save nằm ngoài phạm vi.');
  for (const key of ['staff','subjects','weekArticles','selectedArticleIds','workedToday','reports','journal']) if (!Array.isArray(state[key])) throw new Error(`Save thiếu ${key}.`);
  if (state.staff.length !== 6 || new Set(state.staff.map(c => c.id)).size !== 6 || state.subjects.length !== 96 || new Set(state.subjects.map(s => s.id)).size !== 96) throw new Error('Dữ liệu nhân sự/đề tài không hợp lệ.');
  for (const person of state.staff) {
    if (!Number.isInteger(person.joinWeek) || person.joinWeek < 1 || person.joinWeek > 12 || !person.stats || ['PV','ANH','TL','GD','HC'].some(k => !Number.isFinite(person.stats[k]) || person.stats[k] < 1 || person.stats[k] > 10)) throw new Error('Chỉ số nhân sự không hợp lệ.');
    if (!Number.isFinite(state.fatigue?.[person.id]) || state.fatigue[person.id] < 0 || state.fatigue[person.id] > 100) throw new Error('Mệt trong save không hợp lệ.');
  }
  for (const s of state.subjects) if (!s.id || typeof s.name !== 'string' || !['ANH','TL','GD','HC'].includes(s.need) || ['appears','expires','attraction','difficulty','energy','pressure','preview','previewPressure'].some(k => !Number.isFinite(s[k]) || s[k] < 0) || typeof s.main !== 'boolean' || typeof s.done !== 'boolean' || typeof s.scouted !== 'boolean') throw new Error('Đề tài trong save không hợp lệ.');
  if (typeof state.suspendedNextWeek !== 'boolean' || ![null,'win','bitter','defeat','disbanded'].includes(state.outcome)) throw new Error('Trạng thái kết cục không hợp lệ.');
  for (const a of state.weekArticles) if (!state.subjects.some(s => s.id === a.subjectId && s.done) || !state.staff.some(c => c.id === a.reporterId) || (a.supporterId !== null && !state.staff.some(c => c.id === a.supporterId)) || ['q','score','pressure','evidence','grit'].some(k => !Number.isFinite(a[k]) || a[k] < 0) || a.grit > 1) throw new Error('Bài báo trong save không hợp lệ.');
  if (state.selectedArticleIds.length > 4 || new Set(state.selectedArticleIds).size !== state.selectedArticleIds.length || state.selectedArticleIds.some(id => !state.weekArticles.some(a => a.id === id && a.score > 0)) || state.workedToday.some(id => !state.staff.some(c => c.id === id))) throw new Error('Phân công hoặc bài được chọn không hợp lệ.');
  return structuredClone(state);
}
export class SaveService {
  constructor(storage = globalThis.localStorage) { this.storage = storage; }
  save(state) { this.storage.setItem(SAVE_KEY,JSON.stringify({ savedAt: new Date().toISOString(), state: validateSave(state) })); }
  load() { const raw = this.storage.getItem(SAVE_KEY); if (!raw) throw new Error('Chưa có save sandbox.'); return validateSave(JSON.parse(raw).state); }
}
