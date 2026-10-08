import { evaluate } from '../state/conditions.js';

const MAX_STEPS_WITHOUT_OUTPUT = 10_000;

/**
 * Interprets a compiled program against a GameState.
 *
 * - `next()` runs state-only instructions (flags, bonds, jumps...) silently and
 *   returns the next *command* the presentation layer must perform.
 * - `choose(i)` / `interact(hotspot)` resolve blocking commands.
 *
 * Resume semantics: `state.pc` always points at the instruction currently being
 * presented, so a save taken at any moment re-presents that same line on load.
 */
export class ScriptRunner {
  #cursor = 0;

  /**
   * @param {{ state: import('../state/GameState.js').GameState, profile: import('../state/Profile.js').Profile }} deps
   */
  constructor({ state, profile }) {
    this.state = state;
    this.profile = profile;
    this.program = null;
  }

  /** Begin a chapter from the top, or from a label (used by dev jump). */
  start(chapterId, program, { label } = {}) {
    this.program = program;
    this.state.chapterId = chapterId;
    this.state.callStack = [];
    this.#cursor = label ? this.#labelIndex(label) : 0;
    this.state.pc = this.#cursor;
    if (label) this.#stageUpTo(this.#cursor);
  }

  /** Continue a loaded save: re-present the instruction at state.pc. */
  resume(program) {
    this.program = program;
    this.#cursor = this.state.pc;
  }

  resolve = (path) => (path[0] === 'profile' ? this.profile.resolve(path.slice(1)) : this.state.resolve(path));

  test(cond) {
    return cond ? Boolean(evaluate(cond, this.resolve)) : true;
  }

  next() {
    const { instructions } = this.program;
    const { state } = this;
    let steps = 0;

    while (this.#cursor < instructions.length) {
      if (++steps > MAX_STEPS_WITHOUT_OUTPUT) {
        throw new Error(`${this.program.file}: script loops without showing anything (near line ${instructions[this.#cursor].line})`);
      }
      const index = this.#cursor;
      const ins = instructions[index];
      this.#cursor = index + 1;

      switch (ins.op) {
        // ---- control flow -------------------------------------------------
        case 'jump': this.#cursor = ins.target; break;
        case 'jumpUnless': if (!this.test(ins.cond)) this.#cursor = ins.target; break;
        case 'goto': this.#cursor = this.#labelIndex(ins.label); break;
        case 'call':
          state.callStack.push(this.#cursor);
          this.#cursor = this.#labelIndex(ins.label);
          break;
        case 'return':
          if (!state.callStack.length) throw this.#error(ins, '@return with nothing to return to');
          this.#cursor = state.callStack.pop();
          break;

        // ---- state only ---------------------------------------------------
        case 'flag': state.setFlag(ins.name, ins.value); break;
        case 'unflag': state.clearFlag(ins.name); break;
        case 'bond': state.addBond(ins.id, ins.delta); break;
        case 'cost': state.payCost(ins.tag); break;
        case 'fragment': state.collectFragment(ins.n); break;
        case 'notebook': state.updateNotebook(ins.action, ins.n); break;

        // ---- presentation state is mirrored so loads can rebuild the screen
        case 'scene':
          this.#enterScene(ins);
          return this.#present(index, { type: 'scene', scene: { ...state.scene } });
        case 'show':
          state.cast[ins.id] = { at: ins.at, expr: ins.expr };
          return this.#present(index, { type: 'show', id: ins.id, at: ins.at, expr: ins.expr });
        case 'move':
          if (state.cast[ins.id]) state.cast[ins.id].at = ins.to;
          return this.#present(index, { type: 'move', id: ins.id, to: ins.to, speed: ins.speed });
        case 'hide':
          if (ins.id === '*') state.cast = {};
          else delete state.cast[ins.id];
          return this.#present(index, { type: 'hide', id: ins.id });
        case 'bgm':
        case 'ambience':
          state.audio[ins.op] = ins.id;
          return this.#present(index, { type: ins.op, id: ins.id });

        case 'say':
          return this.#present(index, {
            type: 'say',
            key: `${state.chapterId}#${index}`,
            line: { kind: ins.kind, speaker: ins.speaker, speakerId: ins.speakerId, manner: ins.manner, text: ins.text },
          });

        case 'choice': {
          const options = ins.options
            .map((option, i) => ({ index: i, stance: option.stance, text: option.text }))
            .filter((_, i) => this.test(ins.options[i].cond));
          if (!options.length) throw this.#error(ins, 'every option of this @choice is hidden by its condition');
          return this.#block(index, { type: 'choice', options });
        }
        case 'explore': {
          const handlers = ins.handlers
            .filter((h) => this.test(h.cond))
            .map(({ kind, hotspot, prompt }) => ({ kind, hotspot, prompt }));
          if (!handlers.length) throw this.#error(ins, 'every handler of this @explore is hidden by its condition');
          return this.#block(index, { type: 'explore', hint: ins.hint, handlers: dedupeByHotspot(handlers) });
        }

        case 'ending':
          this.profile.unlockEnding(ins.id);
          return this.#present(index, { type: 'ending', id: ins.id, title: ins.title });
        case 'next':
          return this.#present(index, { type: 'next', chapterId: ins.chapterId });
        case 'end':
          this.#cursor = instructions.length;
          state.pc = index;
          return { type: 'end' };

        // wait, fade, shake, camera, card, toast, sfx, face, save
        default:
          return this.#present(index, { ...stripMeta(ins), type: ins.op });
      }
    }
    return { type: 'end' };
  }

  /** Resolve the pending @choice. @returns the chosen option. */
  choose(optionIndex) {
    const ins = this.#current('choice');
    const option = ins.options[optionIndex];
    if (!option || !this.test(option.cond)) throw this.#error(ins, `option ${optionIndex} is not available`);
    this.state.recordStance(option.stance);
    this.#jumpTo(this.#labelIndex(option.target));
    return option;
  }

  /**
   * Resolve the pending @explore with the hotspot the player used.
   * `on` handlers are subroutines: their label must end with @return, which comes
   * back to the same @explore. `exit` handlers leave the exploration.
   * @returns {boolean} false if no active handler matches.
   */
  interact(hotspot) {
    const ins = this.#current('explore');
    const handler = ins.handlers.find((h) => h.hotspot === hotspot && this.test(h.cond));
    if (!handler) return false;
    if (handler.kind === 'on') this.state.callStack.push(this.state.pc);
    this.#jumpTo(this.#labelIndex(handler.target));
    return true;
  }

  /**
   * Dev jump helper: rebuild scene/cast/audio by scanning the script linearly up
   * to `end`, so jumping into the middle of a scene still shows the right stage.
   * Branches are ignored and flags are not replayed.
   */
  #stageUpTo(end) {
    const { state } = this;
    for (const ins of this.program.instructions.slice(0, end)) {
      if (ins.op === 'scene') this.#enterScene(ins);
      else if (ins.op === 'show') state.cast[ins.id] = { at: ins.at, expr: ins.expr };
      else if (ins.op === 'move' && state.cast[ins.id]) state.cast[ins.id].at = ins.to;
      else if (ins.op === 'hide') {
        if (ins.id === '*') state.cast = {};
        else delete state.cast[ins.id];
      } else if (ins.op === 'bgm' || ins.op === 'ambience') state.audio[ins.op] = ins.id;
    }
  }

  /** Unspecified time/weather/season carry over from the previous scene. A new scene clears the cast. */
  #enterScene(ins) {
    const prev = this.state.scene ?? {};
    this.state.scene = {
      location: ins.location,
      time: ins.time ?? prev.time ?? 'morning',
      weather: ins.weather ?? prev.weather ?? 'clear',
      season: ins.season ?? prev.season ?? this.program.meta.season ?? 'autumn',
    };
    this.state.cast = {};
  }

  #present(index, command) {
    this.state.pc = index;
    return { ...command, pc: index };
  }

  /** Blocking commands keep the cursor on themselves until resolved. */
  #block(index, command) {
    this.#cursor = index;
    return this.#present(index, command);
  }

  #jumpTo(index) {
    this.#cursor = index;
    this.state.pc = index;
  }

  #current(op) {
    const ins = this.program.instructions[this.state.pc];
    if (ins?.op !== op) throw new Error(`No pending @${op} (at pc ${this.state.pc})`);
    return ins;
  }

  #labelIndex(label) {
    const index = this.program.labels[label];
    if (index === undefined) throw new Error(`${this.program.file}: unknown label "${label}"`);
    return index;
  }

  #error(ins, message) {
    return new Error(`${this.program.file} line ${ins.line}: ${message}`);
  }
}

function stripMeta({ op, line, ...rest }) {
  return rest;
}

/** First matching handler per hotspot wins, which lets scripts write first-time/repeat variants. */
function dedupeByHotspot(handlers) {
  const seen = new Set();
  return handlers.filter((h) => !seen.has(h.hotspot) && seen.add(h.hotspot));
}
