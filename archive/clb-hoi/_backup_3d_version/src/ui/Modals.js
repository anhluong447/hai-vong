import { h, clear } from './dom.js';
import { STRINGS } from './strings.js';

/**
 * Stack of modal panels (menu, save/load, settings, backlog, notebook, confirm).
 * Esc closes the top one. While any is open, the world ignores input.
 */
export class ModalStack {
  #stack = [];

  constructor({ root, onChange }) {
    this.root = root;
    this.onChange = onChange;
  }

  get open() { return this.#stack.length > 0; }

  push(title, buildBody, { className = '' } = {}) {
    const body = h('div.modal-body');
    const panel = h(`div.modal-panel${className ? `.${className}` : ''}`, [
      h('div.modal-head', [h('h2', title), h('button.modal-close', { onclick: () => this.pop(), title: STRINGS.back }, '✕')]),
      body,
    ]);
    const layer = h('div.modal', { onclick: (e) => { if (e.target === layer) this.pop(); } }, [panel]);
    const entry = { layer, body, refresh: () => { clear(body); buildBody(body, entry); } };
    entry.refresh();
    this.root.append(layer);
    this.#stack.push(entry);
    this.onChange(true);
    return entry;
  }

  pop() {
    const entry = this.#stack.pop();
    entry?.layer.remove();
    if (!this.#stack.length) this.onChange(false);
  }

  closeAll() {
    while (this.#stack.length) this.pop();
  }

  confirm(message) {
    return new Promise((resolve) => {
      this.push(message, (body) => {
        body.append(h('div.row', [
          h('button.btn.primary', { onclick: () => { this.pop(); resolve(true); } }, STRINGS.confirm.yes),
          h('button.btn', { onclick: () => { this.pop(); resolve(false); } }, STRINGS.confirm.no),
        ]));
      }, { className: 'small' });
    });
  }
}

/** Pause menu. `actions` comes from the composition root. */
export function openPauseMenu(modals, actions) {
  modals.push(STRINGS.menu.heading, (body) => {
    const item = (label, fn) => h('button.menu-item', { onclick: fn }, label);
    body.append(
      item(STRINGS.menu.resume, () => modals.pop()),
      item(STRINGS.menu.save, () => openSlots(modals, actions, 'save')),
      item(STRINGS.menu.load, () => openSlots(modals, actions, 'load')),
      item(STRINGS.menu.backlog, () => actions.openBacklog()),
      item(STRINGS.menu.notebook, () => actions.openNotebook()),
      item(STRINGS.menu.settings, () => openSettings(modals, actions)),
      item(STRINGS.menu.toTitle, async () => {
        if (await modals.confirm(STRINGS.menu.confirmTitle)) {
          modals.closeAll();
          actions.toTitle();
        }
      }),
    );
  }, { className: 'small' });
}

/** @param {'save'|'load'} mode */
export function openSlots(modals, actions, mode) {
  modals.push(mode === 'save' ? STRINGS.slots.saveHeading : STRINGS.slots.loadHeading, (body, entry) => {
    const grid = h('div.slots');
    for (const info of actions.listSlots()) {
      const empty = info.savedAt === null;
      const disabled = (mode === 'load' && empty) || (mode === 'save' && info.slot === 'auto');
      grid.append(h('button.slot', {
        disabled,
        onclick: async () => {
          if (mode === 'save') {
            if (!empty && !(await modals.confirm(STRINGS.slots.overwrite))) return;
            actions.save(info.slot);
            actions.toast(STRINGS.slots.saved);
            entry.refresh();
          } else {
            modals.closeAll();
            actions.load(info.slot);
          }
        },
      }, [
        h('div.slot-name', slotLabel(info.slot)),
        empty
          ? h('div.slot-empty', STRINGS.slots.empty)
          : h('div.slot-meta', [
            h('div.slot-title', info.meta.chapterTitle ?? ''),
            h('div.slot-place', actions.locationName(info.meta.location)),
            h('div.slot-preview', info.meta.preview ? `“${info.meta.preview}”` : ''),
            h('div.slot-date', new Date(info.savedAt).toLocaleString('vi-VN')),
          ]),
      ]));
    }
    body.append(grid);
  }, { className: 'wide' });
}

export function openSettings(modals, actions) {
  const settings = actions.getSettings();
  modals.push(STRINGS.settings.heading, (body) => {
    const slider = (label, key, min, max, step) => {
      const value = h('span.slider-value', String(settings[key]));
      return h('label.slider', [
        h('span', label),
        h('input', {
          type: 'range', min, max, step, value: settings[key],
          oninput: (e) => {
            settings[key] = Number(e.target.value);
            value.textContent = e.target.value;
            actions.applySettings(settings);
          },
        }),
        value,
      ]);
    };
    body.append(
      slider(STRINGS.settings.textSpeed, 'textSpeed', 10, 120, 5),
      slider(STRINGS.settings.autoDelay, 'autoDelayMs', 400, 4000, 100),
      slider(STRINGS.settings.volume, 'masterVolume', 0, 1, 0.05),
    );
  }, { className: 'small' });
}

export function openBacklog(modals, entries) {
  modals.push(STRINGS.backlog.heading, (body) => {
    if (!entries.length) body.append(h('p.muted', STRINGS.backlog.empty));
    for (const e of entries) {
      if (e.type === 'choice') {
        body.append(h('div.log-choice', `➜ ${e.text}`));
      } else if (e.kind === 'dialogue') {
        body.append(h('div.log-line', [h('b', { style: { color: e.character?.accent ?? e.character?.color } }, e.speaker), ' ', e.text]));
      } else {
        body.append(h(`div.log-line.log-${e.kind}`, e.kind === 'thought' ? `(${e.text})` : e.text));
      }
    }
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }, { className: 'wide' });
}

export function openNotebook(modals, { notebook, state }) {
  modals.push(STRINGS.notebook.heading, (body) => {
    body.append(h('h3', STRINGS.notebook.rules));
    body.append(h('ol.rules', notebook.rules.map((r) => h('li', r))));
    body.append(h('h3', STRINGS.notebook.questions));
    const list = h('ol.questions');
    for (const [n, text] of Object.entries(notebook.questions)) {
      const entry = state?.notebook[n];
      const tags = [];
      if (entry?.asked) tags.push(h('span.tag', STRINGS.notebook.asked));
      if (entry?.answered) tags.push(h('span.tag.good', STRINGS.notebook.answered));
      list.append(h(`li${entry?.unlocked ? '' : '.locked'}`, { value: Number(n) }, [
        entry?.unlocked ? (text || STRINGS.notebook.blank) : STRINGS.notebook.locked,
        ...tags,
      ]));
    }
    body.append(list);
    body.append(h('p.muted', STRINGS.notebook.fragments(state?.fragments.length ?? 0, notebook.fragmentCount)));
  }, { className: 'book' });
}

function slotLabel(slot) {
  if (slot === 'auto') return STRINGS.slots.auto;
  if (slot === 'quick') return STRINGS.slots.quick;
  return STRINGS.slots.slot(slot.replace('slot', ''));
}
