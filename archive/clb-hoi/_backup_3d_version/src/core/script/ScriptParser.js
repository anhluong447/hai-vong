import { parseCondition } from '../state/conditions.js';
import { CONDITION_ROOTS, LINE_KINDS, STANCE_ALIASES, STANCES } from '../model/constants.js';

/**
 * Compiles a chapter script (see docs/SCRIPT_FORMAT.md) into a flat program:
 *
 *   { file, meta, instructions: Instruction[], labels: { [name]: index } }
 *
 * Blocks (@if, @choice, @explore) are flattened into jumps so that the whole
 * script position is a single integer (`pc`), which keeps save files trivial.
 */
export class ScriptError extends Error {
  constructor(file, errors) {
    super(`${file}\n${errors.map((e) => `  line ${e.line}: ${e.message}`).join('\n')}`);
    this.name = 'ScriptError';
    this.file = file;
    this.errors = errors;
  }
}

const Q_OPEN = `["“]`;
const Q_CLOSE = `["”]`;
// Speaker: "Text"   |   Speaker [id]: (manner) "Text"
const DIALOGUE_RE = new RegExp(`^([^:"“”()\\[\\]]{1,40}?)\\s*(?:\\[([\\w-]+)\\])?:\\s*(?:\\(([^)]*)\\)\\s*)?(${Q_OPEN}.*)$`);
const LABEL_RE = /^==\s*([\w.-]+)\s*$/;
const OPTION_RE = new RegExp(`^>\\s*(?:\\[([^\\]]+)\\]|(\\w+))?\\s*(${Q_OPEN}.*?${Q_CLOSE})\\s*->\\s*([\\w.-]+)\\s*(?:if\\s+(.+))?$`);
const HANDLER_RE = new RegExp(`^(on|exit)\\s+([\\w.-]+)(?:\\s+(${Q_OPEN}.*?${Q_CLOSE}))?\\s*->\\s*([\\w.-]+)\\s*(?:if\\s+(.+))?$`);
const ARG_RE = /([\w-]+)=(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+)/g;

export function parseScript(source, { file = '<script>' } = {}) {
  const instructions = [];
  const labels = {};
  const errors = [];
  let meta = {};
  const ifStack = [];
  let block = null; // open @choice / @explore

  const emit = (ins, line) => { instructions.push({ ...ins, line }); return instructions.length - 1; };
  const cond = (src) => (src ? parseCondition(src.trim(), { roots: CONDITION_ROOTS }) : null);

  const lines = source.replace(/^﻿/, '').split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trim();
    if (!text || text.startsWith('#') || text.startsWith('//') || /^(-{3,}|={3,})$/.test(text)) return;

    try {
      if (block) {
        parseBlockLine(block, text, cond);
        if (block.closed) {
          emit(block.instruction, block.line);
          block = null;
        }
        return;
      }

      const label = LABEL_RE.exec(text);
      if (label) {
        if (labels[label[1]] !== undefined) throw new Error(`Duplicate label "${label[1]}"`);
        labels[label[1]] = instructions.length;
        return;
      }

      if (text.startsWith('@')) {
        const [, name, rest = ''] = /^@(\w+)\s*(.*)$/.exec(text) ?? [];
        if (!name) throw new Error(`Malformed directive "${text}"`);

        switch (name) {
          case 'if': {
            const frame = { line, endJumps: [], pending: emit({ op: 'jumpUnless', cond: cond(need(rest, '@if condition')), target: null }, line) };
            ifStack.push(frame);
            return;
          }
          case 'elseif':
          case 'else': {
            const frame = ifStack.at(-1);
            if (!frame) throw new Error(`@${name} without @if`);
            if (frame.pending === null) throw new Error(`@${name} after @else`);
            frame.endJumps.push(emit({ op: 'jump', target: null }, line));
            instructions[frame.pending].target = instructions.length;
            frame.pending = name === 'elseif'
              ? emit({ op: 'jumpUnless', cond: cond(need(rest, '@elseif condition')), target: null }, line)
              : null;
            return;
          }
          case 'endif': {
            const frame = ifStack.pop();
            if (!frame) throw new Error('@endif without @if');
            if (frame.pending !== null) instructions[frame.pending].target = instructions.length;
            for (const j of frame.endJumps) instructions[j].target = instructions.length;
            return;
          }
          case 'choice':
            block = { kind: 'choice', line, instruction: { op: 'choice', options: [] } };
            return;
          case 'explore': {
            const args = parseArgs(rest);
            block = { kind: 'explore', line, instruction: { op: 'explore', hint: args.named.hint ?? args.positional[0] ?? null, handlers: [] } };
            return;
          }
          case 'chapter':
            meta = { ...meta, ...parseArgs(rest).named };
            return;
          default: {
            const build = DIRECTIVES[name];
            if (!build) throw new Error(`Unknown directive "@${name}"`);
            emit(build(parseArgs(rest), rest), line);
            return;
          }
        }
      }

      emit(parseLine(text), line);
    } catch (err) {
      errors.push({ line, message: err.message });
    }
  });

  if (block) errors.push({ line: block.line, message: `@${block.kind} is never closed with @end${block.kind}` });
  for (const frame of ifStack) errors.push({ line: frame.line, message: '@if is never closed with @endif' });

  for (const ins of instructions) {
    for (const target of labelRefs(ins)) {
      if (labels[target] === undefined) errors.push({ line: ins.line, message: `Unknown label "${target}"` });
    }
  }

  if (errors.length) throw new ScriptError(file, errors);
  return { file, meta, instructions, labels };
}

function parseBlockLine(block, text, cond) {
  if (text === `@end${block.kind}`) {
    const list = block.kind === 'choice' ? block.instruction.options : block.instruction.handlers;
    if (!list.length) throw new Error(`Empty @${block.kind}`);
    block.closed = true;
    return;
  }
  if (block.kind === 'choice') {
    const m = OPTION_RE.exec(text);
    if (!m) throw new Error(`Bad choice option. Expected: > [THẬT LÒNG] "Text" -> label`);
    const tag = (m[1] ?? m[2] ?? STANCES.NEUTRAL).trim().toLocaleLowerCase('vi');
    const stance = STANCE_ALIASES[tag];
    if (!stance) throw new Error(`Unknown stance "${m[1] ?? m[2]}"`);
    block.instruction.options.push({ stance, text: unquote(m[3]), target: m[4], cond: cond(m[5]) });
  } else {
    const m = HANDLER_RE.exec(text);
    if (!m) throw new Error(`Bad explore handler. Expected: on hotspot -> label  |  exit hotspot -> label`);
    block.instruction.handlers.push({
      kind: m[1], hotspot: m[2], prompt: m[3] ? unquote(m[3]) : null, target: m[4], cond: cond(m[5]),
    });
  }
}

/** Non-directive lines: dialogue, inner thought, stage direction or narration. */
function parseLine(text) {
  if (text.startsWith('|')) return say(LINE_KINDS.NARRATION, text.slice(1).trim());

  const d = DIALOGUE_RE.exec(text);
  if (d) {
    return { op: 'say', kind: LINE_KINDS.DIALOGUE, speaker: d[1].trim(), speakerId: d[2] ?? null, manner: d[3]?.trim() ?? null, text: unquote(d[4]) };
  }
  if (/^\(.*\)$/.test(text)) return say(LINE_KINDS.THOUGHT, text.slice(1, -1).trim());
  if (/^\[.*\]$/.test(text)) return say(LINE_KINDS.DIRECTION, text.slice(1, -1).trim());
  return say(LINE_KINDS.NARRATION, text);
}

const say = (kind, text) => ({ op: 'say', kind, speaker: null, speakerId: null, manner: null, text });

/** One builder per simple directive. Each returns an instruction object. */
const DIRECTIVES = {
  scene: ({ positional: [location], named }) => ({
    op: 'scene', location: need(location, 'location id'), time: named.time, weather: named.weather, season: named.season,
  }),
  show: ({ positional: [id], named }) => ({ op: 'show', id: need(id, 'character id'), at: named.at ?? 'center', expr: named.expr ?? 'neutral' }),
  hide: ({ positional: [id] }) => ({ op: 'hide', id: id ?? '*' }),
  move: ({ positional: [id], named }) => ({ op: 'move', id: need(id, 'character id'), to: need(named.to, 'to=mark'), speed: num(named.speed ?? 1.6) }),
  face: ({ positional: [id], named }) => ({ op: 'face', id: need(id, 'character id'), target: named.to ?? 'player' }),
  bgm: ({ positional: [id] }) => ({ op: 'bgm', id: id && id !== 'none' ? id : null }),
  ambience: ({ positional: [id] }) => ({ op: 'ambience', id: id && id !== 'none' ? id : null }),
  sfx: ({ positional: [id] }) => ({ op: 'sfx', id: need(id, 'sound id') }),
  wait: ({ positional: [ms] }) => ({ op: 'wait', ms: num(need(ms, 'milliseconds')) }),
  fade: ({ positional: [dir], named }) => ({ op: 'fade', dir: oneOf(dir ?? 'out', ['in', 'out']), ms: num(named.ms ?? 600) }),
  shake: () => ({ op: 'shake' }),
  camera: ({ positional: [preset], named }) => ({ op: 'camera', preset: need(preset, 'camera preset'), target: named.on ?? null }),
  card: ({ positional: [title], named }) => ({ op: 'card', title: need(title, 'title'), sub: named.sub ?? null }),
  toast: ({ positional: [message] }) => ({ op: 'toast', text: need(message, 'text') }),
  flag: ({ positional: [name], named }) => {
    if (name) return { op: 'flag', name, value: true };
    const [key, value] = Object.entries(named)[0] ?? [];
    return { op: 'flag', name: need(key, 'flag name'), value: literal(value) };
  },
  unflag: ({ positional: [name] }) => ({ op: 'unflag', name: need(name, 'flag name') }),
  bond: ({ positional: [id, delta] }) => ({ op: 'bond', id: need(id, 'character id'), delta: num(need(delta, 'amount')) }),
  cost: ({ positional: [tag] }) => ({ op: 'cost', tag: need(tag, 'cost tag') }),
  fragment: ({ positional: [n] }) => ({ op: 'fragment', n: num(need(n, 'fragment number')) }),
  notebook: ({ positional: [action, n] }) => ({ op: 'notebook', action: oneOf(action, ['unlock', 'ask', 'answer']), n: num(need(n, 'question number')) }),
  ending: ({ positional: [id, title] }) => ({ op: 'ending', id: need(id, 'ending id'), title: title ?? id }),
  save: () => ({ op: 'save' }),
  goto: ({ positional: [label] }) => ({ op: 'goto', label: need(label, 'label') }),
  call: ({ positional: [label] }) => ({ op: 'call', label: need(label, 'label') }),
  return: () => ({ op: 'return' }),
  next: ({ positional: [chapterId] }) => ({ op: 'next', chapterId: need(chapterId, 'chapter id') }),
  end: () => ({ op: 'end' }),
};

function labelRefs(ins) {
  switch (ins.op) {
    case 'goto':
    case 'call': return [ins.label];
    case 'choice': return ins.options.map((o) => o.target);
    case 'explore': return ins.handlers.map((h) => h.target);
    default: return [];
  }
}

function parseArgs(src) {
  const positional = [];
  const named = {};
  for (const m of src.matchAll(ARG_RE)) {
    if (m[1]) named[m[1]] = m[2] ?? m[3];
    else positional.push(m[4] ?? m[5]);
  }
  return { positional, named };
}

function unquote(s) {
  const t = s.trim();
  return /^["“]/.test(t) && /["”]$/.test(t) && t.length >= 2 ? t.slice(1, -1) : t;
}

function need(value, what) {
  if (value === undefined || value === null || value === '') throw new Error(`Missing ${what}`);
  return value;
}

function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`"${value}" is not a number`);
  return n;
}

function oneOf(value, allowed) {
  if (!allowed.includes(value)) throw new Error(`"${value}" must be one of: ${allowed.join(', ')}`);
  return value;
}

function literal(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}
