import {LEGACY_SKILLS} from '../../content/gameplay/migrations.js';
import {createSession} from './session.js';
import {STAT_NAMES} from '../../content/gameplay/definitions.js';
import {t} from '../shared/text.js';
import {slots,skillNodes,equipmentItems} from '../../content/gameplay/coastal-progression.js';
const phases = new Set(['morning','club','personal','evening','weekend1','weekend2','investigation','bed']);
const statuses = new Set(['available','working','blocked','draft','expired','cancelled']);
const invalid = () => { throw new Error(t('save.invalid')); };
const finite = (value, min = 0, max = Infinity) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min = 0, max = Infinity) => Number.isInteger(value) && finite(value,min,max);
const boolean = value => typeof value === 'boolean';
const unique = values => new Set(values).size === values.length;

/** Migrates legacy v1 states, then validates before a session can be replaced. */
export function validateGameplaySave(candidate) {
  if(candidate?.version===3){
    const state=validateGameplaySave({...candidate,version:2});
    const c=state.coastal;
    if(!c||!integer(c.skillPoints)||!Array.isArray(c.learned)||!unique(c.learned)||!Array.isArray(c.inventory)||!unique(c.inventory))invalid();
    if(c.learned.some(id=>!skillNodes.some(n=>n.id===id))||c.inventory.some(id=>!equipmentItems.some(i=>i.id===id)))invalid();
    if(skillNodes.some(n=>c.learned.includes(n.id)&&n.prerequisite&&!c.learned.includes(n.prerequisite)))invalid();
    if(!c.equipment||Object.keys(c.equipment).length!==slots.length||!slots.every(slot=>Object.hasOwn(c.equipment,slot)))invalid();
    for(const slot of slots){const id=c.equipment[slot],item=equipmentItems.find(i=>i.id===id);if(id!==null&&(!item||!c.inventory.includes(id)||item.slot!==(slot.startsWith('accessory')?'accessory':slot)))invalid();}
    if(!unique(Object.values(c.equipment).filter(Boolean))||!finite(state.energy,0,10))invalid();
    if(!['morning','club','evening','bed'].includes(state.phase)||state.quests.some(q=>!['main','side'].includes(q.kind)))invalid();
    state.version=3;return state;
  }
  if (!candidate || ![1,2].includes(candidate.version) || !candidate.config) invalid();
  const state = structuredClone(candidate);
  const defaults = createSession(state.config);
  if (Object.keys(state.config).length !== Object.keys(defaults.config).length || Object.keys(defaults.config).some(key => !Object.hasOwn(state.config,key))) invalid();
  if (!integer(state.day,1,state.config.days) || !phases.has(state.phase)) invalid();
  for (const key of ['energy','money','reputation','pressure','grants']) if (!finite(state[key])) invalid();
  if (!integer(state.grants) || !boolean(state.ended) || !boolean(state.betrayal) || !boolean(state.sleepPrepared)) invalid();
  if (state.ended && state.day !== state.config.days) invalid();
  if (state.phase === 'investigation' && !['personal','evening','weekend1','weekend2'].includes(state.investigationFrom)) invalid();
  for (const key of ['people','cases','quests','drafts','articles','reports','messages','log']) if (!Array.isArray(state[key])) invalid();
  const ids = new Set(defaults.people.map(person => person.id));
  if (state.people.length !== ids.size || !unique(state.people.map(person => person?.id))) invalid();
  for (const person of state.people) {
    if (!person || !ids.has(person.id) || typeof person.name !== 'string' || !integer(person.joinDay,1,state.config.days)) invalid();
    if (!person.stats || Object.keys(STAT_NAMES).some(key => !finite(person.stats[key]))) invalid();
    for (const key of ['female','romance','weekendSkill']) if (!boolean(person[key])) invalid();
    if (!finite(person.fatigue) || !integer(person.bond) || !integer(person.events)) invalid();
    if (!Array.isArray(person.tools) || person.tools.some(key => !Object.hasOwn(STAT_NAMES,key)) || !unique(person.tools)) invalid();
    if (!Array.isArray(person.skills) || person.skills.some(key => key !== 'synergy' && !(state.version === 1 && Object.hasOwn(LEGACY_SKILLS,key)))) invalid();
    if (state.version === 1) person.skills = person.skills.map(key => LEGACY_SKILLS[key] ?? key);
  }
  for (const key of ['cases','quests','drafts','articles','messages']) {
    if (state[key].some(item => !item || typeof item.id !== 'string') || !unique(state[key].map(item => item.id))) invalid();
  }
  const cases = new Map(state.cases.map(item => [item.id,item]));
  for (const item of state.cases) {
    if (!statuses.has(item.status) || !Object.hasOwn(STAT_NAMES,item.need) || (item.owner !== null && !ids.has(item.owner))) invalid();
    for (const key of ['title','story','teaser','key']) if (typeof item[key] !== 'string') invalid();
    for (const key of ['week','expires','progress','attempts']) if (!integer(item[key])) invalid();
    for (const key of ['quality','attraction','difficulty']) if (!finite(item[key])) invalid();
    if (!boolean(item.opened) || (['working','blocked','draft'].includes(item.status) && !ids.has(item.owner))) invalid();
  }
  for (const quest of state.quests) {
    if (typeof quest.title !== 'string' || !boolean(quest.written) || !Array.isArray(quest.steps) || !Array.isArray(quest.quality)) invalid();
    if (!unique(quest.steps) || quest.steps.some(key => !['interview','photo','documents','courage'].includes(key)) || quest.quality.length !== quest.steps.length || quest.quality.some(value => !finite(value,0,1))) invalid();
  }
  for (const item of [...state.drafts,...state.articles]) {
    if (!ids.has(item.author) || !['khue','team'].includes(item.branch) || typeof item.title !== 'string' || !finite(item.quality,0,1) || !finite(item.attraction) || !integer(item.readyDay,1,state.config.days)) invalid();
  }
  for (const item of state.articles) if (!finite(item.score,0,100000) || !boolean(item.selected) || !boolean(item.published)) invalid();
  for (const message of state.messages) if (!cases.has(message.caseId) || !['progress','complete','mismatch'].includes(message.kind) || !boolean(message.resolved) || !integer(message.day,1,state.config.days)) invalid();
  for (const report of state.reports) if (!report || !integer(report.day,1,state.config.days) || !integer(report.week,1) || !finite(report.score) || !finite(report.reputation) || !Array.isArray(report.ids) || report.ids.some(id => !state.articles.some(article => article.id === id))) invalid();
  for (const event of state.log) {
    if (!event || !integer(event.day,1,state.config.days) || !phases.has(event.phase)) invalid();
    if (typeof event.textKey === 'string') {
      if (!event.params || typeof event.params !== 'object' || Array.isArray(event.params)) invalid();
      t(event.textKey,event.params);
    } else if (typeof event.message !== 'string') invalid();
  }
  if (!state.metrics || Object.keys(defaults.metrics).some(key => !finite(state.metrics[key]))) invalid();
  state.version = 2;
  return state;
}
