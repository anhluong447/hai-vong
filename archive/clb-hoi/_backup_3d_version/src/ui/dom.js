/**
 * h('div.dialogue#box', { onclick }, [children]) — tiny element builder.
 * Strings become text nodes (never parsed as HTML).
 */
export function h(selector, props = {}, children = []) {
  if (Array.isArray(props) || typeof props === 'string') {
    children = props;
    props = {};
  }
  const [, tag = 'div', rest = ''] = /^([a-z0-9-]*)(.*)$/i.exec(selector);
  const el = document.createElement(tag || 'div');
  for (const token of rest.match(/[.#][\w-]+/g) ?? []) {
    if (token[0] === '.') el.classList.add(token.slice(1));
    else el.id = token.slice(1);
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key in el && key !== 'list') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Cancellable delay: resolves true when elapsed, false when cancelled. */
export function delay(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    const timer = setTimeout(() => resolve(true), ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(false); }, { once: true });
  });
}
