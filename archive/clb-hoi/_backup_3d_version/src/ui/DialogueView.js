import { h } from './dom.js';
import { CANCELLED } from '../app/ports.js';
import { STRINGS } from './strings.js';

/**
 * Visual-novel dialogue box: name plate, portrait, typewriter text.
 * Modes: normal, auto (advances by itself), skip (fast-forwards read lines).
 */
export class DialogueView {
  #pending = null;   // resolve fn of the current say()
  #typing = null;    // { full, shown, raf }
  #autoTimer = null;
  #line = null;
  auto = false;
  skipping = false;

  /** @param {{ root: HTMLElement, settings: { textSpeed: number, autoDelayMs: number } }} deps */
  constructor({ root, settings }) {
    this.settings = settings;
    this.portraitImg = h('img.dlg-portrait-img');
    this.portraitInitial = h('span.dlg-portrait-initial');
    this.portraitBacking = h('div.dlg-portrait-backing');
    this.portrait = h('div.dlg-portrait', [this.portraitBacking, this.portraitImg, this.portraitInitial]);
    this.nameText = h('span.dlg-name-text');
    this.name = h('div.dlg-name', [this.nameText]);
    this.manner = h('div.dlg-manner');
    this.header = h('div.dlg-header', [this.name, this.manner]);
    this.text = h('div.dlg-text');
    this.indicator = h('div.dlg-next', '▼');
    this.body = h('div.dlg-body', [this.header, this.text]);
    this.el = h('div.dialogue.hidden', { onclick: () => this.advance() }, [
      this.portrait,
      this.body,
      this.indicator,
    ]);
    root.append(this.el);
  }

  get active() { return this.#pending !== null; }

  /** @returns {Promise<void|symbol>} resolves when the player advances */
  say(line) {
    this.#resolve(CANCELLED);
    this.#line = line;
    this.#render(line);
    return new Promise((resolve) => {
      this.#pending = resolve;
      this.#startTyping(line.text);
    });
  }

  /** Click / Space / Enter. */
  advance() {
    if (!this.#pending) return;
    if (this.#typing) this.#finishTyping();
    else this.#resolve(undefined);
  }

  setAuto(on) {
    this.auto = on;
    if (on && this.#pending && !this.#typing) this.#scheduleAuto();
    if (!on) clearTimeout(this.#autoTimer);
  }

  setSkipping(on) {
    this.skipping = on;
    if (on && this.#pending && this.#line?.seen) this.#resolve(undefined);
  }

  hide() {
    this.el.classList.add('hidden');
  }

  cancel() {
    this.#resolve(CANCELLED);
    this.hide();
  }

  #render(line) {
    const { character, kind } = line;
    this.el.classList.remove('hidden');
    this.el.dataset.kind = kind;
    const showSpeaker = kind === 'dialogue';
    this.nameText.textContent = showSpeaker ? line.speaker ?? character?.name ?? STRINGS.unknownSpeaker : '';
    this.manner.textContent = showSpeaker && line.manner ? line.manner : '';
    const color = character?.accent ?? character?.color ?? '#d4af37';
    this.el.style.setProperty('--speaker', color);

    const portraitVisible = kind === 'dialogue' || kind === 'thought';
    this.portrait.classList.toggle('hidden', !portraitVisible);
    this.el.classList.toggle('has-portrait', portraitVisible);

    if (portraitVisible) {
      const charId = character?.id;
      this.portraitInitial.textContent = character ? (character.short ?? character.name).charAt(0) : '?';
      this.portraitInitial.style.color = character?.hair ?? '#ddd';
      this.portraitBacking.style.borderColor = color;

      // Trigger crisp entrance animation on new lines
      this.portrait.classList.remove('bust-pop');
      void this.portrait.offsetWidth; // force DOM reflow
      this.portrait.classList.add('bust-pop');

      if (charId) {
        this.portraitImg.onload = () => {
          this.portraitImg.style.display = 'block';
          this.portraitInitial.style.display = 'none';
        };
        this.portraitImg.onerror = () => {
          this.portraitImg.style.display = 'none';
          this.portraitInitial.style.display = 'block';
        };
        this.portraitImg.src = `content/portraits/${charId}.png`;
      } else {
        this.portraitImg.style.display = 'none';
        this.portraitInitial.style.display = 'block';
      }
    }
  }

  #startTyping(full) {
    clearTimeout(this.#autoTimer);
    this.indicator.classList.remove('visible');
    if (this.skipping && this.#line.seen) {
      this.text.textContent = full;
      setTimeout(() => this.#resolve(undefined), 40);
      return;
    }
    const cps = Math.max(5, this.settings.textSpeed);
    const chars = Array.from(full); // keep Vietnamese combining marks together
    const typing = { chars, shown: 0, start: performance.now(), raf: 0 };
    this.#typing = typing;
    this.text.textContent = '';
    const step = () => {
      if (this.#typing !== typing) return;
      const elapsed = Math.max(0, performance.now() - typing.start);
      const count = Math.min(chars.length, Math.floor((elapsed / 1000) * cps) + 1);
      if (count !== typing.shown) {
        typing.shown = count;
        this.text.textContent = chars.slice(0, count).join('');
      }
      if (count >= chars.length) this.#finishTyping();
      else typing.raf = requestAnimationFrame(step);
    };
    typing.raf = requestAnimationFrame(step);
  }

  #finishTyping() {
    if (!this.#typing) return;
    cancelAnimationFrame(this.#typing.raf);
    this.text.textContent = this.#typing.chars.join('');
    this.#typing = null;
    this.indicator.classList.add('visible');
    if (this.auto) this.#scheduleAuto();
  }

  #scheduleAuto() {
    clearTimeout(this.#autoTimer);
    const length = this.#line?.text.length ?? 0;
    this.#autoTimer = setTimeout(() => this.#resolve(undefined), this.settings.autoDelayMs + length * 25);
  }

  #resolve(value) {
    clearTimeout(this.#autoTimer);
    if (this.#typing) {
      cancelAnimationFrame(this.#typing.raf);
      this.#typing = null;
    }
    const pending = this.#pending;
    this.#pending = null;
    pending?.(value);
  }
}
