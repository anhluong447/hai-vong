/**
 * Lookup for character data (content/characters.json).
 * Maps the speaker names writers use in scripts ("Thanh Vân", "Vân") to ids.
 */
export class CharacterRegistry {
  #byId = new Map();
  #byAlias = new Map();

  /** @param {{ protagonist: string, characters: Array<{id: string, name: string, aliases?: string[]}> }} data */
  constructor(data) {
    this.protagonistId = data.protagonist;
    for (const character of data.characters) {
      this.#byId.set(character.id, character);
      for (const alias of [character.id, character.name, character.short, ...(character.aliases ?? [])]) {
        if (alias) this.#byAlias.set(normalize(alias), character);
      }
    }
    if (!this.#byId.has(this.protagonistId)) {
      throw new Error(`Protagonist "${this.protagonistId}" is not in characters.json`);
    }
  }

  get(id) { return this.#byId.get(id) ?? null; }
  has(id) { return this.#byId.has(id); }
  get protagonist() { return this.#byId.get(this.protagonistId); }
  all() { return [...this.#byId.values()]; }

  /** @returns the character for a speaker name, or null for unnamed/unknown speakers. */
  resolveSpeaker(name) {
    return name ? this.#byAlias.get(normalize(name)) ?? null : null;
  }
}

const normalize = (s) => s.trim().toLocaleLowerCase('vi');
