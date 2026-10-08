import { h } from './dom.js';

/** Writer/developer overlay: live flags, bonds, stances, costs. Toggle with ` (backquote) or ?debug. */
export class DebugPanel {
  constructor({ root, bus, profile, visible = false }) {
    this.profile = profile;
    this.pre = h('pre');
    this.el = h(`div.debug${visible ? '' : '.hidden'}`, [h('div.debug-head', 'DEBUG  ( ` để ẩn )'), this.pre]);
    root.append(this.el);
    bus.on('state:changed', (state) => this.render(state));
    bus.on('session:start', (state) => this.render(state));
  }

  toggle() {
    this.el.classList.toggle('hidden');
    this.render(this.last);
  }

  render(state) {
    this.last = state;
    if (this.el.classList.contains('hidden') || !state) return;
    const view = {
      at: `${state.chapterId} #${state.pc}`,
      callStack: state.callStack,
      scene: state.scene,
      flags: state.flags,
      bonds: state.bonds,
      stances: state.stances,
      costs: state.costs.map((c) => `${c.tag} (${c.chapterId})`),
      fragments: state.fragments,
      notebook: state.notebook,
      endings: this.profile.endings,
    };
    this.pre.textContent = JSON.stringify(view, null, 1);
  }
}
