import { DEFAULT_CONFIG, validateConfig } from './config.js?v=press-sandbox-2';
import { STAFF, createSubjects } from './fixtures.js?v=press-sandbox-2';
import { clamp, groupPower, quality, equipmentCount, articleValues, publicationPreview, ending } from './rules.js?v=press-sandbox-2';

export const STATE_VERSION = 1;
export function createGame(config = DEFAULT_CONFIG) {
  const validated = validateConfig(config);
  return { version: STATE_VERSION, kind: 'press-club-sandbox', config: validated, day: 1, week: 1, energy: validated.dailyEnergy,
    staff: structuredClone(STAFF), fatigue: Object.fromEntries(STAFF.map(c => [c.id, 0])), workedToday: [], subjects: createSubjects(),
    weekArticles: [], selectedArticleIds: [], reputation: validated.initialReputation, maxReputation: validated.initialReputation,
    pressure: 0, evidence: 0, difficultyOffset: 0, suspendedNextWeek: false, zeroRepStreak: 0, reports: [], journal: [], outcome: null };
}
export function subjectStatus(subject, day) {
  return subject.done ? 'DONE' : day > subject.expires ? 'EXPIRED' : day < subject.appears ? 'UPCOMING' : subject.scouted ? 'SCOUTED' : 'AVAILABLE';
}
export function activeSubjects(state) { return state.subjects.filter(s => ['AVAILABLE','SCOUTED'].includes(subjectStatus(s,state.day))); }
export function activeStaff(state) { return state.staff.filter(c => c.joinWeek <= state.week); }
const requireLive = state => { if (state.outcome) throw new Error('Học kỳ đã kết thúc. Hãy tạo lượt chơi mới.'); };
function availableSubject(state,id) { const s = activeSubjects(state).find(s => s.id === id); if (!s) throw new Error('Đề tài chưa xuất hiện, hết hạn hoặc đã làm.'); return s; }
function requirePerson(state,id) {
  const person = activeStaff(state).find(c => c.id === id);
  if (!person) throw new Error('Nhân sự chưa gia nhập.');
  if (state.workedToday.includes(id)) throw new Error(`${person.name} đã làm việc hôm nay.`);
  return person;
}
function log(state,type,text,details = {}) { state.journal.push({ day: state.day, week: state.week, type, text, details }); }
export function scout(state,id) {
  requireLive(state); const subject = availableSubject(state,id);
  if (subject.scouted) throw new Error('Đề tài đã được thăm dò.');
  if (state.energy < state.config.scoutCost) throw new Error('Không đủ energy để thăm dò.');
  const next = structuredClone(state); next.energy -= next.config.scoutCost;
  next.subjects.find(s => s.id === id).scouted = true;
  log(next,'scout',`Thăm dò ${id}`,{ attraction: subject.attraction, pressure: subject.pressure, energyCost: state.config.scoutCost }); return next;
}
export function interviewPreview(state,subjectId,reporterId,supporterId,grit = 0.5) {
  const subject = availableSubject(state,subjectId);
  const reporter = requirePerson(state,reporterId);
  const supporter = supporterId ? requirePerson(state,supporterId) : null;
  if (reporterId === supporterId) throw new Error('Phóng viên và hỗ trợ phải là hai người khác nhau.');
  if (!supporter && reporterId !== 'khue') throw new Error('Chỉ Khuê có thể tự hỗ trợ.');
  if (!supporter && activeStaff(state).some(c => c.id !== 'khue' && !state.workedToday.includes(c.id))) throw new Error('Còn người hỗ trợ khả dụng; hãy phân công một người.');
  if (state.energy < subject.energy) throw new Error('Không đủ energy cho phỏng vấn.');
  const power = groupPower(reporter,supporter,subject,state.fatigue,state.config);
  const equipment = equipmentCount(state.maxReputation,state.config);
  const q = quality(power,equipment,subject.difficulty,state.difficultyOffset,state.config);
  return { subject, power, equipment, q, ...articleValues(subject,q,grit,state.config) };
}
export function interview(state,subjectId,reporterId,supporterId) {
  requireLive(state); const preview = interviewPreview(state,subjectId,reporterId,supporterId);
  const next = structuredClone(state);
  next.energy -= preview.subject.energy;
  for (const id of [reporterId,supporterId].filter(Boolean)) { next.workedToday.push(id); next.fatigue[id] = Math.min(100,next.fatigue[id] + next.config.fatigueTask); }
  next.subjects.find(s => s.id === subjectId).done = true;
  const article = { id: subjectId, subjectId, reporterId, supporterId: supporterId || null, day: state.day, q: preview.q, power: preview.power, equipment: preview.equipment, difficultyOffset: state.difficultyOffset, grit: 0.5, ...articleValues(preview.subject,preview.q,0.5,state.config) };
  next.weekArticles.push(article);
  if (next.selectedArticleIds.length < next.config.slots && article.score > 0) next.selectedArticleIds.push(article.id);
  log(next,'interview',`Phỏng vấn ${subjectId}: Q = ${preview.q.toFixed(3)}`,{ ...article, energyCost: preview.subject.energy }); return next;
}
export function editArticle(state,id,grit) {
  requireLive(state);
  if (!Number.isFinite(grit) || grit < 0 || grit > 1) throw new Error('Gai góc phải nằm trong [0, 1].');
  const next = structuredClone(state); const article = next.weekArticles.find(a => a.id === id);
  if (!article) throw new Error('Không tìm thấy bài.');
  article.grit = grit; Object.assign(article,articleValues(next.subjects.find(s => s.id === article.subjectId),article.q,grit,next.config));
  log(next,'edit',`Biên tập ${id}: gai góc ${Math.round(grit * 100)}%`); return next;
}
export function selectArticles(state,ids) {
  requireLive(state);
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.length > state.config.slots || ids.some(id => !state.weekArticles.some(a => a.id === id && a.score > 0))) throw new Error('Chọn tối đa 4 bài thành công, không trùng nhau.');
  const next = structuredClone(state); next.selectedArticleIds = [...ids]; return next;
}
export function closeWeek(state) {
  requireLive(state);
  if (state.day % state.config.daysPerWeek !== 0) throw new Error('Chỉ phát hành báo vào cuối tuần.');
  const next = structuredClone(state); const report = { week: state.week, day: state.day, ...publicationPreview(state), articles: structuredClone(state.weekArticles), reputationAtStart: state.reputation, pressureAtStart: state.pressure };
  Object.assign(next,{ reputation: report.reputation, maxReputation: report.maxReputation, evidence: report.evidence, pressure: report.pressure,
    suspendedNextWeek: report.strike === 2,
    difficultyOffset: Math.min(next.config.maxDifficultyOffset,state.difficultyOffset + (report.strike !== null && report.strike >= 1 ? 1 : 0)),
    zeroRepStreak: report.reputation === 0 ? state.zeroRepStreak + 1 : 0 });
  for (const id of Object.keys(next.fatigue)) next.fatigue[id] = Math.max(0,next.fatigue[id] - next.config.fatigueNight - next.config.fatigueWeekend);
  next.reports.push(report); log(next,'publication',`Số ${state.week}: ${Math.round(report.score)} điểm · ${report.label}`,report);
  next.weekArticles = []; next.selectedArticleIds = []; next.workedToday = [];
  next.day++; next.week = Math.min(next.config.weeks,Math.floor((next.day - 1) / next.config.daysPerWeek) + 1);
  next.energy = next.config.dailyEnergy; next.outcome = ending(next,next.config);
  return next;
}
export function nextDay(state) {
  requireLive(state);
  if (state.day % state.config.daysPerWeek === 0) return closeWeek(state);
  const next = structuredClone(state);
  for (const id of Object.keys(next.fatigue)) next.fatigue[id] = Math.max(0,next.fatigue[id] - next.config.fatigueNight);
  next.day++; next.workedToday = []; next.energy = next.config.dailyEnergy;
  log(next,'day',`Bắt đầu ngày ${next.day}`); return next;
}

// Explicit sandbox operation. It preserves date consistency and immediately evaluates disbanding.
export function patchDebug(state,patch) {
  requireLive(state); const next = structuredClone(state);
  for (const key of ['reputation','maxReputation','pressure','evidence','difficultyOffset','energy','zeroRepStreak']) {
    if (!(key in patch)) continue;
    const n = patch[key]; if (!Number.isFinite(n) || n < 0) throw new Error(`${key} phải là số không âm.`);
    const max = ['reputation','maxReputation'].includes(key) ? 100 : key === 'difficultyOffset' ? state.config.maxDifficultyOffset : key === 'energy' ? state.config.dailyEnergy : Infinity;
    if (n > max || (['difficultyOffset','energy','zeroRepStreak'].includes(key) && !Number.isInteger(n))) throw new Error(`${key} nằm ngoài phạm vi.`);
    next[key] = n;
  }
  if ('suspendedNextWeek' in patch) { if (typeof patch.suspendedNextWeek !== 'boolean') throw new Error('Cờ đình bản phải là boolean.'); next.suspendedNextWeek = patch.suspendedNextWeek; }
  if ('fatigue' in patch) for (const [id,value] of Object.entries(patch.fatigue)) {
    if (!(id in next.fatigue) || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Mệt phải nằm trong [0, 100] và có nhân sự tương ứng.'); next.fatigue[id] = value;
  }
  if ('joinWeek' in patch) for (const [id,value] of Object.entries(patch.joinWeek)) {
    const person = next.staff.find(c => c.id === id);
    if (!person || !Number.isInteger(value) || value < 1 || value > next.config.weeks) throw new Error('Tuần gia nhập phải nằm trong [1, 12].'); person.joinWeek = value;
  }
  next.maxReputation = Math.max(next.maxReputation,next.reputation);
  next.outcome = ending(next,next.config); log(next,'debug','Chỉnh trạng thái sandbox',patch); return next;
}
