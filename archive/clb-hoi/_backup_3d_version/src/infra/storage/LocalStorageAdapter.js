/**
 * StoragePort over window.localStorage, namespaced by prefix.
 * Falls back to memory when storage is unavailable (private mode, blocked).
 */
export class LocalStorageAdapter {
  #memory = new Map();

  constructor(prefix = 'clbhoi.') {
    this.prefix = prefix;
    this.available = probe();
    if (!this.available) console.warn('[storage] localStorage unavailable; saves will not persist.');
  }

  get(key) {
    const raw = this.available ? safe(() => localStorage.getItem(this.prefix + key)) : this.#memory.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(`[storage] corrupted entry "${key}" ignored`);
      return null;
    }
  }

  set(key, value) {
    const raw = JSON.stringify(value);
    if (this.available) safe(() => localStorage.setItem(this.prefix + key, raw));
    else this.#memory.set(key, raw);
  }

  remove(key) {
    if (this.available) safe(() => localStorage.removeItem(this.prefix + key));
    else this.#memory.delete(key);
  }
}

function probe() {
  try {
    const k = '__probe__';
    localStorage.setItem(k, k);
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function safe(fn) {
  try {
    return fn();
  } catch (err) {
    console.warn('[storage]', err);
    return null;
  }
}
