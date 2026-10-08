/**
 * Minimal synchronous pub/sub. Used to notify observers (HUD, backlog,
 * debug panel) without the publisher knowing who listens.
 */
export class EventBus {
  #handlers = new Map();

  /** @returns {() => void} unsubscribe function */
  on(type, handler) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.#handlers.get(type)?.delete(handler);
  }

  emit(type, payload) {
    const handlers = this.#handlers.get(type);
    if (!handlers) return;
    for (const handler of [...handlers]) handler(payload);
  }
}
