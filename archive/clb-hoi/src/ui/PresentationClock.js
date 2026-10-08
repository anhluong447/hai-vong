/** Timers that preserve their remaining duration while a menu is open. */
export class PresentationClock {
  paused = false;
  #timers = new Set();

  setTimeout = (fn, ms) => {
    const timer = { fn, remaining: ms, due: 0, id: null };
    this.#timers.add(timer);
    if (!this.paused) this.#schedule(timer);
    return timer;
  };

  clearTimeout = (timer) => {
    if (!timer) return;
    clearTimeout(timer.id);
    this.#timers.delete(timer);
  };

  setPaused(paused) {
    if (paused === this.paused) return;
    this.paused = paused;
    for (const timer of this.#timers) {
      if (paused) {
        timer.remaining = Math.max(0, timer.due - performance.now());
        clearTimeout(timer.id);
      } else this.#schedule(timer);
    }
  }

  #schedule(timer) {
    timer.due = performance.now() + timer.remaining;
    timer.id = setTimeout(() => {
      this.#timers.delete(timer);
      timer.fn();
    }, timer.remaining);
  }
}
