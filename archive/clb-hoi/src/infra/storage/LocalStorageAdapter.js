/**
 * StoragePort over window.localStorage, namespaced by prefix.
 * Write failures reach the caller; the UI must never report an unpersisted save.
 */
export class LocalStorageAdapter {

  constructor(prefix = 'clbhoi.') {
    this.prefix = prefix;
    this.available = probe();
    if (!this.available) console.warn('[storage] localStorage unavailable; saves will not persist.');
  }

  get(key) {
    const raw = this.available ? safe(() => localStorage.getItem(this.prefix + key)) : null;
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
    if (!this.available) throw new Error('Không thể lưu: trình duyệt không cho phép lưu trữ. Hãy bật lưu trữ cho trang này.');
    try {
      localStorage.setItem(this.prefix + key, raw);
    } catch (cause) {
      throw new Error('Không thể lưu dữ liệu. Bộ nhớ trình duyệt đã đầy hoặc bị chặn.', { cause });
    }
  }

  remove(key) {
    if (this.available) safe(() => localStorage.removeItem(this.prefix + key));
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
