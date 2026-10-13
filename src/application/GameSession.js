import {createSession,transition} from '../domain/session.js';
import {validateGameplaySave} from '../domain/validateSave.js';
import {summary} from '../domain/journalism.js';

/** Owns one ruleset session; browser views and headless clients share this API. */
export class GameSession {
  constructor(config = {}) { this.state = createSession(config); }
  execute(action) {
    const next = transition(this.state, action);
    this.state = next;
    return next;
  }
  reset(config = {}) {
    const next = createSession(config);
    this.state = next;
    return next;
  }
  replace(candidate) {
    const next = validateGameplaySave(candidate);
    this.state = next;
    return next;
  }
  snapshot() { return structuredClone(this.state); }
  summary() { return summary(this.state); }
  get day() { return this.state.day; }
  get phase() { return this.state.phase; }
  get isEnded() { return this.state.ended; }
}
