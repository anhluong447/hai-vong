import { CANCELLED } from './ports.js';
import { LINE_KINDS } from '../core/model/constants.js';

/**
 * Drives a ScriptRunner: pulls commands and dispatches them to the view,
 * world and audio ports. Knows *what* to do for each command, never *how*.
 *
 * Bus events: story:chapter, story:line, story:choice, story:ending,
 *             story:end, story:error, state:changed
 */
export class StoryDirector {
  #generation = 0;
  #sceneShown = false;

  /**
   * @param {{
   *   chapters: import('./ChapterRepository.js').ChapterRepository,
   *   characters: import('../core/model/CharacterRegistry.js').CharacterRegistry,
   *   view: import('./ports.js').ViewPort,
   *   world: import('./ports.js').WorldPort,
   *   audio: import('./ports.js').AudioPort,
   *   bus: import('../core/events/EventBus.js').EventBus,
   *   profile: import('../core/state/Profile.js').Profile,
   *   onCheckpoint?: () => void,
   * }} deps
   */
  constructor(deps) {
    Object.assign(this, deps);
  }

  /** Abort the running script loop and any pending UI/world interaction. */
  stop() {
    this.#generation++;
    this.view.cancel();
    this.world.cancelExplore();
    this.world.cancelPending?.();
  }

  capture(state) { state.presentation = this.world.snapshot?.() ?? null; }

  /** Rebuild the screen from a state snapshot (used when loading a save). */
  async restore(state) {
    const generation = this.#generation;
    this.#sceneShown = false;
    if (state.scene) {
      await this.world.loadScene(state.scene);
      if (generation !== this.#generation) return;
      this.view.setScene(state.scene);
      this.#sceneShown = true;
    }
    for (const [id, { at, expr }] of Object.entries(state.cast)) this.world.showCharacter(id, at, expr);
    this.world.restoreSnapshot?.(state.presentation);
    this.audio.playBgm(state.audio.bgm);
    this.audio.setAmbience(state.audio.ambience);
    await this.view.fade('in', 500);
  }

  /** Runs until the script ends, errors, or stop() is called. */
  async run(runner) {
    const generation = ++this.#generation;
    const alive = () => generation === this.#generation;
    this.#announceChapter(runner);

    try {
      while (alive()) {
        const command = runner.next();
        await this.#perform(command, runner, alive);
        if (!alive()) return;
        this.bus.emit('state:changed', runner.state);
        if (command.type === 'end') {
          this.bus.emit('story:end', { chapterId: runner.state.chapterId });
          return;
        }
      }
    } catch (error) {
      if (!alive()) return;
      this.bus.emit('story:error', error);
      this.view.showError(error);
    }
  }

  async #perform(command, runner, alive) {
    const { view, world, audio } = this;

    switch (command.type) {
      case 'scene':
        view.hideDialogue();
        if (this.#sceneShown) await view.fade('out', 450);
        if (!alive()) return;
        await world.loadScene(command.scene);
        if (!alive()) return;
        view.setScene(command.scene);
        this.#sceneShown = true;
        await view.fade('in', 650);
        return;

      case 'show': world.showCharacter(command.id, command.at, command.expr); return;
      case 'hide': world.hideCharacter(command.id); return;
      case 'move': await world.moveCharacter(command.id, command.to, command.speed); return;
      case 'face': world.faceCharacter(command.id, command.target); return;
      case 'camera': world.setCamera(command.preset, command.target); return;

      case 'bgm': audio.playBgm(command.id); return;
      case 'ambience': audio.setAmbience(command.id); return;
      case 'sfx': audio.playSfx(command.id); return;

      case 'say': {
        const character = this.#speakerOf(command.line);
        const seen = this.profile.hasSeen(command.key);
        world.focusSpeaker(character && character.id !== this.characters.protagonistId ? character.id : null);
        this.bus.emit('story:line', { ...command.line, character });
        const result = await view.say({ ...command.line, character, seen });
        if (alive() && result !== CANCELLED) this.profile.markSeen(command.key);
        return;
      }

      case 'choice': {
        const picked = await view.choose(command.options);
        if (!alive() || picked === CANCELLED) return;
        const option = runner.choose(picked);
        this.bus.emit('story:choice', option);
        return;
      }

      case 'explore': {
        view.hideDialogue();
        world.focusSpeaker(null);
        view.setObjective(command.hint);
        const hotspot = await world.explore(command.handlers);
        if (!alive()) return;
        view.setObjective(null);
        if (hotspot === CANCELLED) return;
        if (!runner.interact(hotspot)) console.warn(`[director] no handler for hotspot "${hotspot}"`);
        return;
      }

      case 'wait': await view.wait(command.ms); return;
      case 'fade': await view.fade(command.dir, command.ms); return;
      case 'shake': view.shake(); return;
      case 'toast': view.toast(command.text); return;
      case 'card':
        view.hideDialogue();
        await view.card(command.title, command.sub);
        return;

      case 'ending':
        view.hideDialogue();
        this.bus.emit('story:ending', { id: command.id, title: command.title });
        await view.card(command.title, null);
        return;

      case 'save': this.onCheckpoint?.(); return;

      case 'next': {
        const program = await this.chapters.get(command.chapterId);
        if (!alive()) return;
        runner.start(command.chapterId, program);
        this.#announceChapter(runner);
        this.onCheckpoint?.();
        return;
      }

      case 'end':
        view.hideDialogue();
        return;

      default:
        console.warn(`[director] unhandled command "${command.type}"`, command);
    }
  }

  #speakerOf(line) {
    if (line.kind === LINE_KINDS.THOUGHT) return this.characters.protagonist;
    if (line.kind !== LINE_KINDS.DIALOGUE) return null;
    if (line.speakerId) {
      const character = this.characters.get(line.speakerId);
      if (!character) console.warn(`[director] unknown speaker id [${line.speakerId}]`);
      return character;
    }
    return this.characters.resolveSpeaker(line.speaker);
  }

  #announceChapter(runner) {
    this.bus.emit('story:chapter', { chapterId: runner.state.chapterId, meta: runner.program.meta });
  }
}
