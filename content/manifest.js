import {roster,templates,QUEST_STEPS,STAT_NAMES} from './gameplay/definitions.js';
import {MAPS} from './maps/definitions.js';
import {INTERACTION_SCENES} from './dialogue/interaction-scenes.js';

export const CONTENT_VERSION = 1;
export const GAME_CONTENT = Object.freeze({roster,templates,questSteps:QUEST_STEPS,stats:STAT_NAMES,maps:MAPS,scenes:INTERACTION_SCENES});
