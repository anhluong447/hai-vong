// Stable facade for browser pages, playtests and existing integrations.
export {createSession,transition} from '../domain/session.js';
export {joined,person,effectiveStat} from '../domain/people.js';
export {week,weekend,weekday,totalWeeks,schoolDay,isPublicationDay,act,storyAct,actForDay,dayOfWeek,SEMESTER_WEEKS,SEMESTER_DAYS} from '../domain/calendar.js';
export {summary} from '../domain/journalism.js';
export {STAT_NAMES,DEFAULTS,QUEST_STEPS} from '../../content/gameplay/definitions.js';
