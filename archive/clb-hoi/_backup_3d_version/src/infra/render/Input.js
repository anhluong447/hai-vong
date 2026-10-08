const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};
const INTERACT_KEYS = new Set(['KeyE', 'Enter', 'Space']);

/** Keyboard + pointer state for the 3D world (movement, camera look, interact). */
export class Input {
  #held = new Set();
  #look = { dx: 0, dy: 0 };
  #wheel = 0;
  #interactAt = -Infinity;
  #drag = null;
  enabled = true;

  constructor(canvas) {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled || isTyping(e)) return;
      if (MOVE_KEYS[e.code]) this.#held.add(MOVE_KEYS[e.code]);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.#held.add('run');
      if (INTERACT_KEYS.has(e.code) && !e.repeat) this.#interactAt = performance.now();
    });
    window.addEventListener('keyup', (e) => {
      if (MOVE_KEYS[e.code]) this.#held.delete(MOVE_KEYS[e.code]);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.#held.delete('run');
    });
    window.addEventListener('blur', () => this.#held.clear());

    canvas.addEventListener('pointerdown', (e) => {
      this.#drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.#drag || this.#drag.id !== e.pointerId) return;
      this.#look.dx += e.clientX - this.#drag.x;
      this.#look.dy += e.clientY - this.#drag.y;
      this.#drag.x = e.clientX;
      this.#drag.y = e.clientY;
    });
    const endDrag = (e) => { if (this.#drag?.id === e.pointerId) this.#drag = null; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (e) => { this.#wheel += Math.sign(e.deltaY); }, { passive: true });
  }

  /** @returns {{ x: number, z: number, run: boolean }} x: right+, z: forward+ */
  axis() {
    if (!this.enabled) return { x: 0, z: 0, run: false };
    const h = this.#held;
    return {
      x: (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0),
      z: (h.has('up') ? 1 : 0) - (h.has('down') ? 1 : 0),
      run: h.has('run'),
    };
  }

  consumeLook() {
    const look = { ...this.#look };
    this.#look.dx = 0;
    this.#look.dy = 0;
    return this.enabled ? look : { dx: 0, dy: 0 };
  }

  consumeWheel() {
    const w = this.#wheel;
    this.#wheel = 0;
    return this.enabled ? w : 0;
  }

  /** True if an interact press happened after `since` (performance.now() ms). Clears it. */
  consumeInteract(since = -Infinity) {
    const hit = this.enabled && this.#interactAt > since;
    this.#interactAt = -Infinity;
    return hit;
  }

  /** For on-screen buttons (touch). */
  requestInteract() { this.#interactAt = performance.now(); }

  releaseAll() { this.#held.clear(); }
}

const isTyping = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '');
