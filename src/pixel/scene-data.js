import {validateWorldScene} from '../shared/validateWorldScene.js';
import {hydrateScene} from '../../content/maps/materialize.js';
export function materializeScene(scene,prefabs,knownRefs,resolveText){return hydrateScene(validateWorldScene(scene,prefabs,knownRefs),prefabs,resolveText);}
