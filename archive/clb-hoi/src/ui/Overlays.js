import { h, delay } from './dom.js';
import { CANCELLED } from '../app/ports.js';
import { STRINGS } from './strings.js';

const CARD_MS = 2400;

/** Full-screen effects: fade to black, title cards, toasts, shake, error panel. */
export class Overlays {
  #abort = new AbortController();
  #cardSkip = null;

  constructor({ root, shakeTarget, clock = globalThis }) {
    this.shakeTarget = shakeTarget;
    this.clock = clock;
    this.fadeEl = h('div.fade.on');        // starts black; the first scene fades in
    this.cardTitle = h('div.card-title');
    this.cardSub = h('div.card-sub');
    this.cardBanner = h('div.card-banner', [this.cardTitle, this.cardSub]);
    this.cardEl = h('div.card.hidden', { onclick: () => this.#cardSkip?.() }, [this.cardBanner]);
    this.toasts = h('div.toasts');
    this.errorEl = h('div.error.hidden');
    root.append(this.fadeEl, this.cardEl, this.toasts, this.errorEl);
  }

  async fade(dir, ms = 600) {
    const signal = this.#abort.signal;
    this.fadeEl.style.transitionDuration = `${ms}ms`;
    this.fadeEl.classList.toggle('on', dir === 'out');
    return (await delay(ms, signal, this.clock)) ? undefined : CANCELLED;
  }

  async card(title, sub) {
    const signal = this.#abort.signal;
    this.cardTitle.textContent = title;
    this.cardSub.textContent = sub ?? '';
    this.cardEl.classList.remove('hidden');
    requestAnimationFrame(() => { if (!signal.aborted) this.cardEl.classList.add('shown'); });
    const skipped = new Promise((resolve) => { this.#cardSkip = resolve; });
    const finished = await Promise.race([delay(CARD_MS, signal, this.clock), skipped.then(() => true)]);
    if (signal.aborted) return CANCELLED;
    this.#cardSkip = null;
    this.cardEl.classList.remove('shown');
    await delay(350, signal, this.clock);
    if (signal.aborted) return CANCELLED;
    this.cardEl.classList.add('hidden');
    return finished ? undefined : CANCELLED;
  }

  /** Space/Enter/click while a card is up. @returns true if a card consumed it. */
  skipCard() {
    if (!this.#cardSkip) return false;
    this.#cardSkip();
    return true;
  }

  async wait(ms) {
    return (await delay(ms, this.#abort.signal, this.clock)) ? undefined : CANCELLED;
  }

  toast(text, ms = 2600) {
    const el = h('div.toast', text);
    this.toasts.append(el);
    setTimeout(() => el.classList.add('out'), ms);
    setTimeout(() => el.remove(), ms + 400);
  }

  shake() {
    this.shakeTarget.classList.remove('shake');
    void this.shakeTarget.offsetWidth; // restart the animation
    this.shakeTarget.classList.add('shake');
  }

  showError(error) {
    console.error(error);
    const details = error.errors
      ? error.errors.map((e) => `${error.file}:${e.line}  ${e.message}`).join('\n')
      : `${error.message}\n\n${error.stack ?? ''}`;
    this.errorEl.replaceChildren(
      h('div.error-panel', [
        h('h2', STRINGS.error.heading),
        h('pre', details),
        h('button.btn', { onclick: () => this.errorEl.classList.add('hidden') }, STRINGS.error.close),
      ]),
    );
    this.errorEl.classList.remove('hidden');
  }

  cancel() {
    this.#abort.abort();
    this.#abort = new AbortController();
    this.#cardSkip = null;
    this.cardEl.classList.remove('shown');
    this.cardEl.classList.add('hidden');
  }
}
