import { SFX, AMBIENCE } from './synth.js';

/**
 * AudioPort over the Web Audio API.
 * Plays files listed in content/audio.json; falls back to synth placeholders.
 * Browsers block audio until a user gesture, so call unlock() from a click.
 */
export class WebAudioEngine {
  #ctx = null;
  #master = null;
  #buffers = new Map();
  #ambience = { id: null, stop: null };
  #bgm = { id: null, stop: null };
  #warned = new Set();

  /** @param {{ manifest: { bgm: object, ambience: object, sfx: object }, baseUrl: string, volume?: number }} options */
  constructor({ manifest, baseUrl, volume = 0.8 }) {
    this.manifest = manifest;
    this.baseUrl = baseUrl;
    this.volume = volume;
  }

  unlock() {
    if (!this.#ctx) {
      const Ctx = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctx) return;
      this.#ctx = new Ctx();
      this.#master = this.#ctx.createGain();
      this.#master.gain.value = this.volume;
      this.#master.connect(this.#ctx.destination);
      // Re-apply whatever the story requested before audio was unlocked.
      const { id: ambience } = this.#ambience;
      const { id: bgm } = this.#bgm;
      this.#ambience.id = null;
      this.#bgm.id = null;
      this.setAmbience(ambience);
      this.playBgm(bgm);
    }
    if (this.#ctx.state === 'suspended') this.#ctx.resume();
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.#master) this.#master.gain.value = volume;
  }

  playSfx(id) {
    if (!this.#ctx) return;
    const file = this.manifest.sfx?.[id];
    if (file) this.#playFile(file, { loop: false });
    else if (SFX[id]) SFX[id](this.#ctx, this.#master);
    else this.#warnOnce(`sfx "${id}"`);
  }

  setAmbience(id) { this.#switchLoop(this.#ambience, id, this.manifest.ambience, AMBIENCE); }
  playBgm(id) { this.#switchLoop(this.#bgm, id, this.manifest.bgm, {}); }

  stopAll() {
    this.setAmbience(null);
    this.playBgm(null);
  }

  #switchLoop(channel, id, files, recipes) {
    if (channel.id === id) return;
    channel.stop?.();
    channel.stop = null;
    channel.id = id;
    if (!id || !this.#ctx) return;
    if (files?.[id]) {
      this.#playFile(files[id], { loop: true }).then((stop) => {
        if (channel.id === id) channel.stop = stop;
        else stop();
      });
    } else if (recipes[id]) {
      channel.stop = recipes[id](this.#ctx, this.#master);
    } else {
      this.#warnOnce(`loop "${id}"`);
    }
  }

  async #playFile(path, { loop }) {
    try {
      const buffer = await this.#load(path);
      const src = this.#ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = loop;
      const gain = this.#ctx.createGain();
      src.connect(gain).connect(this.#master);
      src.start();
      return () => {
        gain.gain.setTargetAtTime(0, this.#ctx.currentTime, 0.3);
        src.stop(this.#ctx.currentTime + 1.5);
      };
    } catch (err) {
      console.warn(`[audio] ${path}:`, err);
      return () => {};
    }
  }

  async #load(path) {
    if (!this.#buffers.has(path)) {
      const request = fetch(new URL(path, this.baseUrl))
        .then((r) => r.arrayBuffer())
        .then((data) => this.#ctx.decodeAudioData(data));
      this.#buffers.set(path, request);
    }
    return this.#buffers.get(path);
  }

  #warnOnce(what) {
    if (this.#warned.has(what)) return;
    this.#warned.add(what);
    console.warn(`[audio] no file or synth recipe for ${what}`);
  }
}
