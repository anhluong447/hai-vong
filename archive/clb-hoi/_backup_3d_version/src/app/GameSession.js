import { GameState } from '../core/state/GameState.js';
import { ScriptRunner } from '../core/script/ScriptRunner.js';
import { SLOTS } from './SaveService.js';

/**
 * Application facade used by menus: new game, continue, save, load, quit.
 * Owns the current GameState and ScriptRunner.
 *
 * Bus events: session:start, session:end
 */
export class GameSession {
  #startedAt = 0;
  #lastLine = null;

  /**
   * @param {{
   *   chapters: import('./ChapterRepository.js').ChapterRepository,
   *   director: import('./StoryDirector.js').StoryDirector,
   *   saves: import('./SaveService.js').SaveService,
   *   profile: import('../core/state/Profile.js').Profile,
   *   bus: import('../core/events/EventBus.js').EventBus,
   *   clock?: () => number,
   * }} deps
   */
  constructor({ chapters, director, saves, profile, bus, clock = () => Date.now() }) {
    Object.assign(this, { chapters, director, saves, profile, bus, clock });
    this.state = null;
    this.runner = null;
    bus.on('story:line', (line) => { this.#lastLine = line; });
    bus.on('story:end', () => this.saves.saveProfile(this.profile));
  }

  get active() { return this.state !== null; }

  /** @param {{ chapterId?: string, label?: string }} [options] dev jump support */
  async newGame({ chapterId, label } = {}) {
    const id = chapterId ?? this.chapters.startChapterId;
    const program = await this.chapters.get(id);
    this.director.stop();
    this.#begin(new GameState());
    this.runner.start(id, program, { label });
    if (label) await this.director.restore(this.state); // dev jump: show the stage the label lives in
    this.director.run(this.runner);
  }

  async load(slot) {
    const data = this.saves.load(slot);
    if (!data) return false;
    const program = await this.chapters.get(data.state.chapterId);
    this.director.stop();
    this.#begin(data.state);
    this.runner.resume(program);
    await this.director.restore(data.state);
    this.director.run(this.runner);
    return true;
  }

  async continue() {
    const latest = this.saves.latest();
    return latest ? this.load(latest.slot) : false;
  }

  save(slot) {
    if (!this.state) return;
    const now = this.clock();
    this.state.playtimeMs += now - this.#startedAt;
    this.#startedAt = now;
    this.saves.save(slot, this.state, this.#slotMeta());
    this.saves.saveProfile(this.profile);
  }

  autosave() { this.save(SLOTS.AUTO); }
  quicksave() { this.save(SLOTS.QUICK); }

  quit() {
    this.director.stop();
    this.saves.saveProfile(this.profile);
    this.state = null;
    this.runner = null;
    this.bus.emit('session:end');
  }

  #begin(state) {
    this.state = state;
    this.runner = new ScriptRunner({ state, profile: this.profile });
    this.#startedAt = this.clock();
    this.#lastLine = null;
    this.bus.emit('session:start', state);
  }

  #slotMeta() {
    const entry = this.chapters.manifest.chapters[this.state.chapterId];
    return {
      chapterTitle: entry?.title ?? this.state.chapterId,
      location: this.state.scene?.location ?? null,
      preview: this.#lastLine?.text?.slice(0, 90) ?? '',
      playtimeMs: this.state.playtimeMs,
    };
  }
}
