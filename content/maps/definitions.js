import {t} from '../../src/shared/text.js';
import {SCENES,PREFABS} from './scenes-data.js';
import {hydrateScene} from './materialize.js';
export const MAPS=Object.fromEntries(Object.entries(SCENES).map(([id,scene])=>[id,hydrateScene(scene,PREFABS,t)]));
