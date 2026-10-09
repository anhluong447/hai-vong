import vi from '../../content/locales/vi.js';

export const DEFAULT_LOCALE = 'vi-VN';
const catalogs = new Map([[DEFAULT_LOCALE, vi]]);
let activeLocale = DEFAULT_LOCALE;

export function registerLocale(locale, catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) throw new TypeError('Invalid locale catalog');
  for (const value of Object.values(catalog)) if (typeof value !== 'string') throw new TypeError('Invalid locale entry');
  catalogs.set(locale, Object.freeze({...catalog}));
}

export function setLocale(locale) {
  if (!catalogs.has(locale)) throw new RangeError(`Unknown locale: ${locale}`);
  activeLocale = locale;
}

export function t(key, params = {}) {
  const template = catalogs.get(activeLocale)[key] ?? vi[key];
  if (typeof template !== 'string') throw new RangeError(`Missing text key: ${key}`);
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_, name) => {
    if (!Object.hasOwn(params, name)) throw new RangeError(`Missing text parameter: ${key}.${name}`);
    return String(params[name]);
  });
}

/** Legacy saves may contain rendered messages; new events contain a key and parameters. */
export function eventText(event) {
  return event.textKey ? t(event.textKey, event.params) : event.message ?? event.text ?? '';
}

export function skillText(id) { return t(`skill.${id}`); }
