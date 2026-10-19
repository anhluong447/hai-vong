import {validateGameplaySave} from '../domain/validateSave.js';
export {validateGameplaySave};
import {t} from '../shared/text.js';
export const GAMEPLAY_SAVE_KEYS = Object.freeze({
  gameplay:'clb-bao-chi.gameplay.v1', pixel:'clb-bao-chi.pixel.v1', coastal:'clb-bao-chi.coastal.v3',
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
    let raw = this.storage.getItem(GAMEPLAY_SAVE_KEYS[this.mode]);
    const legacyFallback=!raw&&this.mode==='coastal';
    if(legacyFallback)raw=this.storage.getItem(GAMEPLAY_SAVE_KEYS.pixel);
    if (!raw) invalid();
    const payload = JSON.parse(raw);
    if (payload?.kind === 'press-gameplay-save') {
      if (payload.version !== 1 || payload.contentVersion !== 1 || (payload.mode !== this.mode&&!(legacyFallback&&payload.mode==='pixel'))) invalid();
      return {state:validateGameplaySave(payload.state),world:payload.world};
    }
    // Historical gameplay saves were raw states; pixel saves wrapped state and world.
    const wrapped=this.mode==='pixel'||this.mode==='coastal';
    return {state:validateGameplaySave(wrapped?payload?.state:payload),world:wrapped?payload.world:null};
  }
}
