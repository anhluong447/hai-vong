import { STANCES } from '../model/constants.js';

export const SAVE_VERSION = 1;

const NOTEBOOK_ACTIONS = new Set(['unlock', 'ask', 'answer']);

/**
 * Everything that belongs to one playthrough and goes into a save slot.
 * Pure data + mutations; no knowledge of rendering, audio or storage.
 */
export class GameState {
  constructor(data = {}) {
    // Script position
    this.chapterId = data.chapterId ?? null;
    this.pc = data.pc ?? 0;
    this.callStack = [...(data.callStack ?? [])];

    // Story systems (see Bible: "Hệ thống lựa chọn")
    this.flags = { ...data.flags };
    this.bonds = { ...data.bonds };                          // ĐỘ GẮN BÓ per character
    this.stances = { avoid: 0, sincere: 0, wry: 0, ...data.stances };
    this.costs = [...(data.costs ?? [])];                    // CÁI GIÁ: [{ tag, chapterId }]
    this.fragments = [...(data.fragments ?? [])];            // Mảnh Thư numbers
    this.notebook = structuredClone(data.notebook ?? {});   // { [n]: { unlocked, asked, answered } }

    // Presentation snapshot, needed to rebuild the screen when loading
    this.scene = data.scene ? { ...data.scene } : null;
    this.cast = structuredClone(data.cast ?? {});
    this.audio = { bgm: null, ambience: null, ...data.audio };

    this.playtimeMs = data.playtimeMs ?? 0;
  }

  setFlag(name, value = true) { this.flags[name] = value; }
  clearFlag(name) { delete this.flags[name]; }

  addBond(characterId, delta) {
    this.bonds[characterId] = (this.bonds[characterId] ?? 0) + delta;
  }

  recordStance(stance) {
    if (stance && stance !== STANCES.NEUTRAL && stance in this.stances) this.stances[stance]++;
  }

  payCost(tag) { this.costs.push({ tag, chapterId: this.chapterId }); }

  collectFragment(n) {
    if (!this.fragments.includes(n)) this.fragments.push(n);
  }

  updateNotebook(action, n) {
    if (!NOTEBOOK_ACTIONS.has(action)) throw new Error(`Unknown notebook action "${action}"`);
    const entry = (this.notebook[n] ??= { unlocked: false, asked: false, answered: false });
    entry.unlocked = true;
    if (action === 'ask') entry.asked = true;
    if (action === 'answer') entry.answered = true;
  }

  /** Resolves condition paths such as ["bond","van"] or ["notebook","9","answered"]. */
  resolve([root, ...rest]) {
    switch (root) {
      case 'flag': return this.flags[rest.join('.')] ?? false;
      case 'bond': return this.bonds[rest[0]] ?? 0;
      case 'stance': return this.stances[rest[0]] ?? 0;
      case 'cost': return rest.length ? this.costs.filter((c) => c.tag === rest[0]).length : this.costs.length;
      case 'costs': return this.costs.length;
      case 'fragment': return rest.length ? this.fragments.includes(Number(rest[0])) : this.fragments.length;
      case 'fragments': return this.fragments.length;
      case 'notebook': {
        const entry = this.notebook[rest[0]];
        return Boolean(rest[1] ? entry?.[rest[1]] : entry?.unlocked);
      }
      default: return undefined;
    }
  }

  toJSON() {
    return {
      version: SAVE_VERSION,
      chapterId: this.chapterId,
      pc: this.pc,
      callStack: this.callStack,
      flags: this.flags,
      bonds: this.bonds,
      stances: this.stances,
      costs: this.costs,
      fragments: this.fragments,
      notebook: this.notebook,
      scene: this.scene,
      cast: this.cast,
      audio: this.audio,
      playtimeMs: this.playtimeMs,
    };
  }

  static fromJSON(json) {
    return new GameState(migrate(json));
  }
}

/** Upgrade older save formats here, one version step at a time. */
function migrate(json) {
  const data = { ...json };
  if ((data.version ?? 1) > SAVE_VERSION) {
    throw new Error(`Save was made by a newer version (${data.version}) of the game.`);
  }
  // if (data.version === 1) { ...transform...; data.version = 2; }
  return data;
}
