import { h } from './dom.js';
import { STRINGS } from './strings.js';

/** Location/season/time, exploration objective, interaction prompt, quick buttons. */
export class HudView {
  constructor({ root, locationsMeta, onMenu, onNotebook, onBacklog, onAuto, onInteract }) {
    this.locationsMeta = locationsMeta;
    this.placeTag = h('span.hud-tag', 'FIELD // ');
    this.placeName = h('span.hud-place-text');
    this.place = h('div.hud-place', [this.placeTag, this.placeName]);

    this.whenTag = h('span.hud-tag', 'CHRONO // ');
    this.whenText = h('span.hud-when-text');
    this.when = h('div.hud-when', [this.whenTag, this.whenText]);

    this.objIcon = h('span.hud-obj-icon', '◆');
    this.objText = h('span.hud-obj-text');
    this.objective = h('div.hud-objective.hidden', [this.objIcon, this.objText]);

    this.prompt = h('button.hud-prompt.hidden', { onclick: (e) => { e.stopPropagation(); onInteract(); } });

    const btn = (label, key, fn) => h('button.hud-btn', { onclick: fn }, [
      h('span.hud-btn-label', label),
      h('span.hud-btn-key', key),
    ]);

    this.autoButton = btn('AUTO', 'A', onAuto);

    this.el = h('div.hud.hidden', [
      h('div.hud-location', [this.place, this.when, this.objective]),
      h('div.hud-buttons', [
        this.autoButton,
        btn('LOG', 'L', onBacklog),
        btn('NOTE', 'N', onNotebook),
        btn('SYSTEM', 'ESC', onMenu),
      ]),
      this.prompt,
    ]);
    root.append(this.el);
  }

  show() { this.el.classList.remove('hidden'); }
  hide() { this.el.classList.add('hidden'); }

  setScene(scene) {
    this.placeName.textContent = this.locationsMeta[scene.location]?.name ?? scene.location;
    this.whenText.textContent = `${STRINGS.seasons[scene.season] ?? scene.season} · ${STRINGS.times[scene.time] ?? scene.time}`;
  }

  setObjective(text) {
    this.objText.textContent = text ?? '';
    this.objective.classList.toggle('hidden', !text);
  }

  setPrompt(hotspot) {
    this.prompt.classList.toggle('hidden', !hotspot);
    if (hotspot) {
      this.prompt.replaceChildren(
        h('span.hud-prompt-icon', '✦'),
        h('kbd', STRINGS.hud.interactKey),
        h('span.hud-prompt-text', hotspot.prompt),
      );
    }
  }

  setAuto(on) { this.autoButton.classList.toggle('on', on); }
}
