/** Keeps the recent dialogue history for the log screen. */
export class Backlog {
  #entries = [];

  constructor({ bus, limit = 300 }) {
    this.limit = limit;
    bus.on('session:start', () => { this.#entries = []; });
    bus.on('story:line', (line) => this.#push({ type: 'line', ...line }));
    bus.on('story:choice', (option) => this.#push({ type: 'choice', text: option.text, stance: option.stance }));
  }

  entries() { return [...this.#entries]; }

  #push(entry) {
    this.#entries.push(entry);
    if (this.#entries.length > this.limit) this.#entries.shift();
  }
}
