import { GameState } from '../core/state/GameState.js';
import { Profile } from '../core/state/Profile.js';

export const SLOTS = Object.freeze({
  AUTO: 'auto',
  QUICK: 'quick',
  manual: (n) => `slot${n}`,
});
export const MANUAL_SLOT_COUNT = 6;

const PROFILE_KEY = 'profile';
const slotKey = (slot) => `save:${slot}`;

/** Save slots + the cross-playthrough profile, over any StoragePort. */
export class SaveService {
  /** @param {{ storage: import('./ports.js').StoragePort, clock?: () => number }} deps */
  constructor({ storage, clock = () => Date.now() }) {
    this.storage = storage;
    this.clock = clock;
  }

  /** @param {{ chapterTitle?: string, location?: string, preview?: string }} meta shown in the slot list */
  save(slot, state, meta = {}) {
    this.storage.set(slotKey(slot), { savedAt: this.clock(), meta, state: state.toJSON() });
  }

  /** @returns {{ state: GameState, meta: object, savedAt: number } | null} */
  load(slot) {
    const data = this.storage.get(slotKey(slot));
    if (!data) return null;
    return { state: GameState.fromJSON(data.state), meta: data.meta ?? {}, savedAt: data.savedAt };
  }

  /** Slot summaries without deserializing state. */
  describe(slot) {
    const data = this.storage.get(slotKey(slot));
    return data ? { slot, savedAt: data.savedAt, meta: data.meta ?? {} } : { slot, savedAt: null, meta: null };
  }

  allSlots() {
    return [SLOTS.AUTO, SLOTS.QUICK, ...Array.from({ length: MANUAL_SLOT_COUNT }, (_, i) => SLOTS.manual(i + 1))];
  }

  /** Most recently written slot, for "Continue". */
  latest() {
    return this.allSlots()
      .map((slot) => this.describe(slot))
      .filter((d) => d.savedAt !== null)
      .sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
  }

  delete(slot) { this.storage.remove(slotKey(slot)); }

  loadProfile() { return new Profile(this.storage.get(PROFILE_KEY) ?? {}); }
  saveProfile(profile) { this.storage.set(PROFILE_KEY, profile.toJSON()); }
}
