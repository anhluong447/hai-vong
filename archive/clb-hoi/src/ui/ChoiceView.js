import { h, clear } from './dom.js';
import { CANCELLED } from '../app/ports.js';
import { STRINGS } from './strings.js';

/** Choice list with stance tags (Né tránh / Thật lòng / Mỉa mai). Keys 1-9 pick. */
export class ChoiceView {
  #pending = null;
  #options = [];

  constructor({ root, onHover }) {
    this.onHover = onHover;
    this.el = h('div.choices.hidden');
    root.append(this.el);
  }

  get active() { return this.#pending !== null; }

  choose(options) {
    this.#finish(CANCELLED);
    this.#options = options;
    clear(this.el);
    options.forEach((option, i) => {
      const tag = STRINGS.stance[option.stance];
      this.el.append(h('button.choice', {
        dataset: { stance: option.stance },
        style: `--i: ${i};`,
        onclick: (e) => { e.stopPropagation(); this.pick(i); },
        onmouseenter: () => this.onHover?.(),
      }, [
        h('span.choice-skew-bg'),
        h('span.choice-key', String(i + 1)),
        tag ? h('span.choice-tag', tag) : null,
        h('span.choice-text', option.text),
        h('span.choice-arrow', '▶'),
      ]));
    });
    this.el.classList.remove('hidden');
    return new Promise((resolve) => { this.#pending = resolve; });
  }

  /** @param {number} position index in the displayed list */
  pick(position) {
    const option = this.#options[position];
    if (option) this.#finish(option.index);
  }

  cancel() { this.#finish(CANCELLED); }

  #finish(value) {
    const pending = this.#pending;
    this.#pending = null;
    this.el.classList.add('hidden');
    pending?.(value);
  }
}
