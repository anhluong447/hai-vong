/**
 * Data shared across all playthroughs: endings reached, lines already read,
 * settings. The hidden route (Hy) unlocks from here: `profile.routes >= 2`.
 */
export class Profile {
  constructor(data = {}) {
    this.endings = [...(data.endings ?? [])]; // ids like "van.true", "nhi.normal"
    this.seen = { ...data.seen };             // { "c01#42": 1 } for skip-read
    this.settings = {
      textSpeed: 45,      // characters per second
      autoDelayMs: 1400,
      masterVolume: 0.8,
      ...data.settings,
    };
  }

  markSeen(key) { this.seen[key] = 1; }
  hasSeen(key) { return this.seen[key] === 1; }

  unlockEnding(id) {
    if (!this.endings.includes(id)) this.endings.push(id);
  }

  /** Routes with at least one ending; route = part before the dot. */
  get completedRoutes() {
    return new Set(this.endings.map((id) => id.split('.')[0]));
  }

  resolve([root, ...rest]) {
    switch (root) {
      case 'endings': return this.endings.length;
      case 'ending': return this.endings.includes(rest.join('.'));
      case 'routes': return this.completedRoutes.size;
      case 'route': return this.completedRoutes.has(rest[0]);
      default: return undefined;
    }
  }

  toJSON() {
    return { endings: this.endings, seen: this.seen, settings: this.settings };
  }
}
