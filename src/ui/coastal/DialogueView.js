import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {MotionScope} from './MotionScope.js';
import {paperSurface,waveLayer,replaceContent} from './surfaces.js';

const ICONS = {
  quill: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M6 25 Q13 8 27 3 Q29 10 23 17 L17 20 L14 24 L6 25Z" fill="currentColor" stroke="none"/><path d="M3 29 L24 7 M6 24 L13 25 M7 28 L22 28 M16 15 L20 18"/></svg>',
  chat: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5 Q1 6 1 13 V18 Q2 25 10 25 L7 30 L17 25 H22 Q30 24 30 16 V12 Q30 5 22 5Z"/><circle cx="10" cy="15" r=".9" fill="currentColor"/><circle cx="16" cy="15" r=".9" fill="currentColor"/><circle cx="22" cy="15" r=".9" fill="currentColor"/></svg>',
  proof: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 H22 L27 8 V29 H8Z M5 5 H2 V31 H24 M12 11 H23 M12 15 H23 M12 19 H23 M12 23 H20"/><path d="M22 3 V8 H27"/></svg>',
  chevron: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7 L21 16 L12 25"/></svg>',
  return: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M27 6 V19 H6 M12 12 L5 19 L12 26"/></svg>'
};

const INSIGNIA_SVG = '<svg viewBox="0 0 96 64"><path d="M25 27 C16 25 15 15 23 11 C32 6 39 11 38 18 C37 28 31 34 21 38 L20 33 C26 31 29 28 30 25 C29 27 27 28 25 27 Z"/><path d="M49 24 C39 22 41 10 48 7 C58 3 64 9 62 17 C61 26 54 33 44 36 L43 31 C48 29 53 24 53 21 C53 23 50 25 49 24 Z"/><path d="M5 50 C23 33 37 39 53 43 C70 48 79 43 91 34 C82 51 69 55 49 49 C32 43 20 44 5 50 Z"/><path d="M0 58 C18 48 32 50 51 56 C66 62 80 57 90 49 C79 63 62 67 44 60 C26 54 16 52 0 58 Z" opacity=".8"/></svg>';

const ARROW_SVG = '<svg viewBox="0 0 44 14"><path d="M0 7 H38 L34 3 M38 7 L34 11"/></svg>';

const SEAGULLS_SVG = '<svg viewBox="0 0 160 36"><path d="M12 18 q6 -6 12 0 q6 -6 12 0 M68 12 q5 -5 10 0 q5 -5 10 0 M118 22 q4 -4 8 0 q4 -4 8 0"/></svg>';

function registerV1Expressions(registry) {
  if (!registry?.characters) return;
  for (const [id, character] of Object.entries(registry.characters)) {
    if (!character.expressions) character.expressions = {};
    for (const exp of ['neutral', 'happy', 'serious']) {
      const v1Key = `v1_${exp}`;
      if (!character.expressions[v1Key]) character.expressions[v1Key] = `v1/${id}-${exp}.png`;
      const dashKey = `v1-${exp}`;
      if (!character.expressions[dashKey]) character.expressions[dashKey] = `v1/${id}-${exp}.png`;
    }
  }
}

function resolveSpeaker(speaker, registry) {
  if (!speaker) return '';
  if (registry?.characters?.[speaker]) return speaker;
  const lower = String(speaker).toLowerCase().trim();
  if (registry?.characters?.[lower]) return lower;
  for (const [id, char] of Object.entries(registry?.characters ?? {})) {
    if (char.name && char.name.toLowerCase() === lower) return id;
  }
  return speaker;
}

/**
 * Editorial Coastal Dialogue Component for Hoi Am.
 * Renders textured wave paper surface, shore ink bleed, wild flowers,
 * notebook decorations, large anime portrait, and vertical choice cards.
 */
export class DialogueView {
  constructor(sprite, onClose) {
    this.sprite = sprite;
    this.onClose = onClose;
    this.onContinue = null;
    registerV1Expressions(sprite?.registry);

    const insignia = el('span', { class: 'coastal-insignia', 'aria-hidden': 'true' });
    insignia.innerHTML = INSIGNIA_SVG;

    this.name = text('h2', '', 'coastal-speaker');

    const arrow = el('span', { class: 'coastal-speaker-arrow', 'aria-hidden': 'true' });
    arrow.innerHTML = ARROW_SVG;

    const speakerBadge = el('div', { class: 'coastal-speaker-badge' }, [insignia, this.name, arrow]);
    const closeBtn = button(t('src.gameplay.main.dong_esc'), () => this.handleClose(), 'coastal-close');
    const head = el('div', { class: 'pixel-dialog-head' }, [speakerBadge, closeBtn]);

    this.caption = text('p', '', 'interaction-caption');
    const speakerRule = el('div', { class: 'coastal-speaker-rule', 'aria-hidden': 'true' });

    this.line = text('p', '', 'dialogue-line');
    this.line.setAttribute('aria-live', 'polite');

    this.body = el('div', { class: 'coastal-dialogue-actions' });

    const continueRule = el('div', { class: 'coastal-continue-rule', 'aria-hidden': 'true' });
    this.continueButton = el('button', {
      type: 'button',
      class: 'coastal-continue-btn',
      'aria-label': t('ui.replica.preview.continueAria')
    }, [
      el('span', { class: 'coastal-pipe', 'aria-hidden': 'true' }, ['|']),
      el('span', { class: 'coastal-continue-text' }, [t('ui.replica.dialogue.continue.1')]),
      el('span', { class: 'coastal-continue-icon', 'aria-hidden': 'true' }, [t('ui.replica.dialogue.continue.2')]),
      el('span', { class: 'coastal-pipe', 'aria-hidden': 'true' }, ['|'])
    ]);
    this.continueButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleContinue();
    });
    this.continueButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleContinue();
      }
    });

    const continueBar = el('div', { class: 'coastal-continue-bar' }, [continueRule, this.continueButton]);

    const seagulls = el('div', { class: 'coastal-dialogue-seagulls', 'aria-hidden': 'true' });
    seagulls.innerHTML = SEAGULLS_SVG;

    const waveBg = el('div', { class: 'coastal-dialogue-wave-bg', 'aria-hidden': 'true' }, [
      waveLayer(),
      el('div', { class: 'coastal-dialogue-ink', 'aria-hidden': 'true' }),
      el('div', { class: 'coastal-harbor-art', 'aria-hidden': 'true' }),
      seagulls
    ]);

    this.surface = paperSurface([
      waveBg,
      head,
      this.caption,
      speakerRule,
      this.line,
      this.body,
      continueBar
    ], 'pixel-dialog coastal-dialogue-surface');

    this.flowers = el('div', { class: 'coastal-flowers', 'aria-hidden': 'true' });
    this.notebook = el('div', { class: 'coastal-notebook', 'aria-hidden': 'true' }, [
      el('span', { class: 'coastal-notebook-text', 'aria-hidden': 'true' }, [t('ui.replica.dialogue.foreground_note.1')])
    ]);

    this.node = el('div', { class: 'dialogue-stage coastal-dialogue' }, [
      sprite.node,
      this.surface,
      this.flowers,
      this.notebook
    ]);

    this.motion = new MotionScope(this.node);
    this.key = null;
  }

  handleClose() {
    if (typeof this.onClose === 'function') this.onClose();
  }

  handleContinue() {
    if (typeof this.onContinue === 'function') {
      this.onContinue();
      return;
    }
    const focused=document.activeElement;
    if(this.body.contains(focused)&&focused.matches('button:not(:disabled)')){focused.click();return;}
    const primary = this.body.querySelector('button.primary:not(:disabled), .coastal-choice-card.primary:not(:disabled)');
    if (primary) {
      primary.click();
      return;
    }
    const firstChoice = this.body.querySelector('button:not(:disabled)');
    if (firstChoice) {
      firstChoice.click();
      return;
    }
    this.handleClose();
  }

  buildChoices(choices, onSelect) {
    const stack = el('div', {
      class: 'coastal-choices-stack',
      role: 'group',
      'aria-label': t('ui.coastal.dialogue.choicesAria')
    });
    const hasSelected = choices.some(c => Boolean(c.selected || c.primary));
    const items = choices.map((choice, index) => {
      const isSelected = Boolean(choice.selected || choice.primary || (!hasSelected && index === 0));
      const iconKey = choice.icon || (index === 0 ? 'quill' : index === 1 ? 'chat' : 'proof');
      const label = choice.text || choice.label || choice.title || (choice.textKey ? t(choice.textKey) : (typeof choice === 'string' ? choice : ''));
      const id = choice.id || `choice-${index + 1}`;

      const card = el('button', {
        type: 'button',
        class: `coastal-choice-card ${isSelected ? 'primary' : ''}`,
        'data-choice-id': id,
        'aria-pressed': String(isSelected)
      });

      const iconSpan = el('span', { class: 'coastal-choice-icon', 'aria-hidden': 'true' });
      iconSpan.innerHTML = ICONS[iconKey] || ICONS.chat;

      const textSpan = el('span', { class: 'coastal-choice-text' }, [label]);

      const chevronSpan = el('span', { class: 'coastal-choice-chevron', 'aria-hidden': 'true' });
      chevronSpan.innerHTML = ICONS.chevron;

      card.append(iconSpan, textSpan, chevronSpan);

      card.addEventListener('focus',()=>{
        stack.querySelectorAll('.coastal-choice-card').forEach(node=>{
          const selected=node===card;node.classList.toggle('primary',selected);node.setAttribute('aria-pressed',String(selected));
        });
      });
      card.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof onSelect === 'function') onSelect(choice, index);
        if (typeof choice.onSelect === 'function') choice.onSelect();
      });

      return card;
    });

    stack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const buttons = [...stack.querySelectorAll('.coastal-choice-card')];
        const currentIndex = buttons.indexOf(document.activeElement);
        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowDown'
            ? (currentIndex + 1) % buttons.length
            : (currentIndex - 1 + buttons.length) % buttons.length;
          buttons[nextIndex]?.focus();
        }
      }
    });

    stack.append(...items);
    return stack;
  }

  update({ speaker, expression = 'neutral', title = '', line = '', text = '', body = [], choices = null, onSelect = null, onClose = null, onContinue = null }) {
    if (onClose) this.onClose = onClose;
    this.onContinue = onContinue;

    const speakerId = resolveSpeaker(speaker, this.sprite?.registry);
    const character = this.sprite.get(speakerId) || this.sprite.get(speaker);
    this.sprite.set(speakerId || speaker, expression);

    this.name.textContent = character?.name || title || speaker || '';
    this.caption.textContent = title;
    this.caption.hidden = !title;

    const dialogueLine = text || line || '';
    this.line.hidden = !dialogueLine;

    const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.line.textContent !== dialogueLine) {
      this.line.textContent = dialogueLine;
      if (!reducedMotion) {
        this.motion.cancel();
        this.motion.play(this.line, [{ opacity: 0.25 }, { opacity: 1 }], { duration: 180 });
      }
    }

    if (Array.isArray(choices) && choices.length > 0) {
      const choiceGroup = this.buildChoices(choices, onSelect);
      replaceContent(this.body, [choiceGroup, ...(Array.isArray(body) ? body : [])]);
    } else {
      replaceContent(this.body, body);
    }

    const key = `${speaker}/${dialogueLine}`;
    if (this.key !== key) {
      if (!reducedMotion) {
        for (const [index, node] of [...this.body.querySelectorAll('button')].entries()) {
          this.motion.play(node, [
            { opacity: 0, transform: 'translateX(-8px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ], { duration: 220, delay: Math.min(index, 3) * 35 });
        }
      }
    }
    this.key = key;
  }

  dispose() {
    this.motion.dispose();
    this.sprite.clear();
  }
}
