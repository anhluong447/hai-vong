import { h } from './dom.js';
import { STRINGS } from './strings.js';

export class TitleView {
  constructor({ root, onNewGame, onContinue, onLoad, onSettings }) {
    const makeBtn = (text, cls, fn) => h(`button.title-btn${cls ? `.${cls}` : ''}`, { onclick: fn }, [
      h('span.title-btn-skew'),
      h('span.title-btn-text', text),
      h('span.title-btn-slash', '//'),
    ]);

    this.continueButton = makeBtn(STRINGS.title.continue, '', onContinue);
    this.el = h('div.title-screen.hidden', [
      h('div.title-decor-line'),
      h('div.title-inner', [
        h('div.title-kicker', 'QUESTION CLUB // TĨNH ĐỂ TÂM SÁNG'),
        h('h1.title-name', STRINGS.gameTitle),
        h('p.title-tagline', STRINGS.tagline),
        h('div.title-menu', [
          makeBtn(STRINGS.title.newGame, 'primary', onNewGame),
          this.continueButton,
          makeBtn(STRINGS.title.load, '', onLoad),
          makeBtn(STRINGS.title.settings, '', onSettings),
        ]),
      ]),
    ]);
    root.append(this.el);
  }

  get visible() { return !this.el.classList.contains('hidden'); }

  show({ canContinue }) {
    this.continueButton.disabled = !canContinue;
    this.el.classList.remove('hidden');
  }

  hide() { this.el.classList.add('hidden'); }
}
