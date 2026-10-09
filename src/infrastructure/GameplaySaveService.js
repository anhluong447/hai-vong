import {validateGameplaySave} from '../domain/validateSave.js';
export {validateGameplaySave};
import {t} from '../shared/text.js';
export const GAMEPLAY_SAVE_KEYS = Object.freeze({
  gameplay:'clb-bao-chi.gameplay.v1', pixel:'clb-bao-chi.pixel.v1',
});
const invalid = () => { throw new Error(t('save.invalid')); };
export class GameplaySaveService {
  constructor({mode='gameplay',storage=globalThis.localStorage,clock=()=>new Date().toISOString()} = {}) {
    if (!Object.hasOwn(GAMEPLAY_SAVE_KEYS,mode)) throw new RangeError(t('error.save_mode',{mode}));
    this.mode=mode; this.storage=storage; this.clock=clock;
  }
  save(state,world=null) {
    const validated = validateGameplaySave(state);
    const envelope = {kind:'press-gameplay-save',version:1,contentVersion:1,mode:this.mode,savedAt:this.clock(),state:validated,world};
    this.storage.setItem(GAMEPLAY_SAVE_KEYS[this.mode],JSON.stringify(envelope));
  }
  load() {
    const raw = this.storage.getItem(GAMEPLAY_SAVE_KEYS[this.mode]);
    if (!raw) invalid();
    const payload = JSON.parse(raw);
    if (payload?.kind === 'press-gameplay-save') {
      if (payload.version !== 1 || payload.contentVersion !== 1 || payload.mode !== this.mode) invalid();
      return {state:validateGameplaySave(payload.state),world:payload.world};
    }
    // Historical gameplay saves were raw states; pixel saves wrapped state and world.
    return {state:validateGameplaySave(this.mode==='pixel'?payload?.state:payload),world:this.mode==='pixel'?payload.world:null};
  }
}
