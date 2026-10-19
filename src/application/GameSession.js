import {createSession,transition} from '../domain/session.js';
import {validateGameplaySave} from '../domain/validateSave.js';
import {summary} from '../domain/journalism.js';
import {createCoastalSession,transitionCoastal,migrateCoastal} from '../domain/coastalSession.js';

/** Owns one ruleset session; browser views and headless clients share this API. */
export class GameSession {
  constructor(config = {},{coastal=false}={}) { this.coastal=coastal;this.state = coastal?createCoastalSession(config):createSession(config); }
  execute(action) {
    const next = this.state.version===3?transitionCoastal(this.state,action):transition(this.state, action);
    this.state = next;
    return next;
  }
  reset(config = {}) {
    const next = this.coastal?createCoastalSession(config):createSession(config);
    this.state = next;
    return next;
  }
  replace(candidate) {
    const validated = validateGameplaySave(candidate);
    const next = this.coastal?validateGameplaySave(migrateCoastal(validated)):validated;
    this.state = next;
    return next;
  }
  snapshot() { return structuredClone(this.state); }
  summary() { return summary(this.state); }
  get day() { return this.state.day; }
  get phase() { return this.state.phase; }
  get isEnded() { return this.state.ended; }
}
