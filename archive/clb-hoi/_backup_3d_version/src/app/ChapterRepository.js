/**
 * Loads and compiles chapter scripts listed in content/manifest.json.
 * Compiled programs are cached per chapter id.
 */
export class ChapterRepository {
  #cache = new Map();

  /**
   * @param {{ content: import('./ports.js').ContentPort, parse: Function, manifest: object }} deps
   */
  constructor({ content, parse, manifest }) {
    this.content = content;
    this.parse = parse;
    this.manifest = manifest;
  }

  get startChapterId() { return this.manifest.start; }

  entry(chapterId) {
    const entry = this.manifest.chapters[chapterId];
    if (!entry) throw new Error(`Chapter "${chapterId}" is not listed in content/manifest.json`);
    return entry;
  }

  async get(chapterId) {
    if (!this.#cache.has(chapterId)) {
      const pending = this.#compile(chapterId);
      this.#cache.set(chapterId, pending);
      pending.catch(() => this.#cache.delete(chapterId)); // allow retry after fixing the script
    }
    return this.#cache.get(chapterId);
  }

  async #compile(chapterId) {
    const entry = this.entry(chapterId);
    const source = await this.content.loadText(entry.file);
    const program = this.parse(source, { file: entry.file });
    program.id = chapterId;
    program.meta = { ...entry, ...program.meta };
    return program;
  }
}
