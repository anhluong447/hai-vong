import { DialogueView } from './DialogueView.js';
import { ChoiceView } from './ChoiceView.js';
import { HudView } from './HudView.js';
import { Overlays } from './Overlays.js';
import { TitleView } from './TitleView.js';
import { DebugPanel } from './DebugPanel.js';
import { ModalStack, openPauseMenu, openSlots, openSettings, openBacklog, openNotebook } from './Modals.js';
import { STRINGS } from './strings.js';
import { PresentationClock } from './PresentationClock.js';
import { h } from './dom.js';

/**
 * Composes all 2D views, implements the ViewPort used by StoryDirector, and
 * routes keyboard input to whichever layer is on top.
 *
 * `actions` is the only way the UI talks to the application (see src/main.js).
 */
export class UIRoot {
  constructor({ root, shakeTarget, canvas, bus, locationsMeta, notebook, settings, profile, actions, debug = false }) {
    this.actions = actions;
    this.notebook = notebook;
    this.clock = new PresentationClock();

    this.overlays = new Overlays({ root, shakeTarget, clock: this.clock });
    this.dialogue = new DialogueView({ root, settings, clock: this.clock });
    this.choices = new ChoiceView({ root, onHover: () => actions.uiSound?.() });
    this.hud = new HudView({
      root,
      locationsMeta,
      onMenu: () => this.openMenu(),
      onNotebook: () => this.openNotebook(),
      onBacklog: () => this.openBacklog(),
      onAuto: () => this.toggleAuto(),
      onInteract: () => actions.interact(),
    });
    this.title = new TitleView({
      root,
      onNewGame: () => actions.newGame(),
      onContinue: () => actions.continue(),
      onLoad: () => openSlots(this.modals, actions, 'load'),
      onSettings: () => openSettings(this.modals, actions),
    });
    this.modals = new ModalStack({ root, onChange: (open) => {
      this.dialogue.setPaused(open);
      this.clock.setPaused(open);
      actions.onModal(open || this.title.visible);
    } });
    this.debugPanel = new DebugPanel({ root, bus, profile, visible: debug });
    this.endScreen = h('div.chapter-end.hidden', [
      h('div.chapter-end-panel', [
        h('p', STRINGS.end.heading),
        h('h2', STRINGS.gameTitle),
        h('p.muted', STRINGS.end.message),
        h('div.row', [
          h('button.btn.primary', { onclick: () => actions.toTitle() }, STRINGS.menu.toTitle),
          h('button.btn', { onclick: () => openSlots(this.modals, actions, 'save') }, STRINGS.menu.save),
          h('button.btn', { onclick: () => openSlots(this.modals, actions, 'load') }, STRINGS.menu.load),
        ]),
      ]),
    ]);
    root.append(this.endScreen);
    bus.on('story:end', () => this.endScreen.classList.remove('hidden'));
    bus.on('session:start', () => this.endScreen.classList.add('hidden'));

    bus.on('world:hotspot', (hotspot) => this.hud.setPrompt(hotspot));
    bus.on('story:ending', ({ title }) => this.toast(STRINGS.toasts.ending(title)));

    window.addEventListener('keydown', (e) => this.#onKeyDown(e));
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Control') this.dialogue.setSkipping(false);
    });
    // Click anywhere on the 3D view advances dialogue (not during exploration).
    canvas.addEventListener('click', () => {
      if (this.modals.open || this.title.visible) return;
      if (this.overlays.skipCard()) return;
      if (this.dialogue.active && !this.choices.active) this.dialogue.advance();
    });
  }

  // ---- ViewPort --------------------------------------------------------
  say(line) { return this.dialogue.say(line); }
  choose(options) { return this.choices.choose(options); }
  card(title, sub) { return this.overlays.card(title, sub); }
  fade(dir, ms) { return this.overlays.fade(dir, ms); }
  wait(ms) { return this.overlays.wait(ms); }
  toast(text) { this.overlays.toast(text); }
  shake() { this.overlays.shake(); }
  setScene(scene) {
    this.hud.setScene(scene);
    this.hud.show();
  }
  setObjective(text) { this.hud.setObjective(text); }
  hideDialogue() { this.dialogue.hide(); }
  showError(error) { this.overlays.showError(error); }
  cancel() {
    this.endScreen?.classList.add('hidden');
    this.dialogue.cancel();
    this.choices.cancel();
    this.overlays.cancel();
    this.hud.setObjective(null);
    this.hud.setPrompt(null);
  }

  // ---- screens -----------------------------------------------------------
  showTitle() {
    this.cancel();
    this.modals.closeAll();
    this.hud.hide();
    this.overlays.fadeEl.style.transitionDuration = '0ms';
    this.overlays.fadeEl.classList.add('on');
    this.title.show({ canContinue: this.actions.hasSave() });
    this.actions.onModal(true);
  }

  hideTitle() {
    this.title.hide();
    this.actions.onModal(this.modals.open);
  }

  openMenu() { openPauseMenu(this.modals, { ...this.actions, openBacklog: () => this.openBacklog(), openNotebook: () => this.openNotebook() }); }
  openBacklog() { openBacklog(this.modals, this.actions.getBacklog()); }
  openNotebook() { openNotebook(this.modals, { notebook: this.notebook, state: this.actions.getState() }); }

  toggleAuto() {
    const on = !this.dialogue.auto;
    this.dialogue.setAuto(on);
    this.hud.setAuto(on);
    this.toast(on ? STRINGS.toasts.autoOn : STRINGS.toasts.autoOff);
  }

  #onKeyDown(e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')) return;
    if (e.key === '`') {
      this.debugPanel.toggle();
      return;
    }
    if (this.modals.open) {
      if (e.key === 'Escape') this.modals.pop();
      return;
    }
    if (this.title.visible) return;

    if (e.key === 'Control') {
      this.dialogue.setSkipping(true);
      return;
    }
    switch (e.code) {
      case 'Escape': this.openMenu(); return;
      case 'KeyL': this.openBacklog(); return;
      case 'KeyN': this.openNotebook(); return;
      case 'KeyA':
        // A also means "walk left" while exploring, so it only toggles auto during dialogue.
        if (this.dialogue.active) this.toggleAuto();
        return;
      case 'F5': e.preventDefault(); this.actions.quicksave(); return;
      case 'F9': e.preventDefault(); this.actions.quickload(); return;
    }
    if (this.choices.active) {
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= 9) this.choices.pick(n - 1);
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (this.overlays.skipCard() || this.dialogue.active) e.preventDefault();
      if (this.dialogue.active) this.dialogue.advance();
    }
  }
}
