import { CANCELLED } from '../src/app/ports.js';

/** In-memory StoragePort. */
export class MemoryStorage {
  #data = new Map();
  get(key) { return this.#data.has(key) ? JSON.parse(this.#data.get(key)) : null; }
  set(key, value) { this.#data.set(key, JSON.stringify(value)); }
  remove(key) { this.#data.delete(key); }
}

/**
 * ViewPort fake. `onChoose(options, call)` decides which option index to pick.
 */
export class FakeView {
  constructor({ onChoose = () => 0 } = {}) {
    this.onChoose = onChoose;
    this.lines = [];
    this.cards = [];
    this.chooseCalls = 0;
    this.pending = new Set();
  }
  #hold(value) {
    // Resolve on a microtask so cancellation can race like the real UI.
    return new Promise((resolve) => {
      const entry = { resolve };
      this.pending.add(entry);
      queueMicrotask(() => { if (this.pending.delete(entry)) resolve(value); });
    });
  }
  say(line) { this.lines.push(line); return this.#hold(undefined); }
  async choose(options) {
    this.chooseCalls++;
    const picked = await this.onChoose(options, this.chooseCalls);
    return picked === CANCELLED ? CANCELLED : this.#hold(options[picked]?.index ?? picked);
  }
  card(title) { this.cards.push(title); return this.#hold(undefined); }
  fade() { return this.#hold(undefined); }
  wait() { return this.#hold(undefined); }
  toast() {}
  shake() {}
  setScene() {}
  setObjective() {}
  hideDialogue() {}
  showError(error) { this.error = error; }
  cancel() {
    for (const entry of this.pending) entry.resolve(CANCELLED);
    this.pending.clear();
  }
}

/** WorldPort fake. Visits every `on` hotspot once, then takes the first `exit`. */
export class FakeWorld {
  constructor() {
    this.visited = new Set();
    this.scenes = [];
    this.cast = new Set();
  }
  async loadScene(scene) { this.scenes.push(scene.location); this.cast.clear(); }
  showCharacter(id) { this.cast.add(id); }
  hideCharacter(id) { if (id === '*') this.cast.clear(); else this.cast.delete(id); }
  async moveCharacter() {}
  faceCharacter() {}
  focusSpeaker() {}
  setCamera() {}
  async explore(handlers) {
    const fresh = handlers.find((h) => h.kind === 'on' && !this.visited.has(h.hotspot));
    const pick = fresh ?? handlers.find((h) => h.kind === 'exit');
    this.visited.add(pick.hotspot);
    return pick.hotspot;
  }
  cancelExplore() {}
}

export const silentAudio = { playBgm() {}, setAmbience() {}, playSfx() {}, stopAll() {} };
