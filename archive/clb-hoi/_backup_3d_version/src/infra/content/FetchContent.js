/** ContentPort over fetch(), relative to a base URL (the content/ folder). */
export class FetchContent {
  constructor(baseUrl) {
    this.base = new URL(baseUrl, document.baseURI);
  }

  async loadText(path) {
    const url = new URL(path, this.base);
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Cannot load ${url.pathname} (${response.status})`);
    return response.text();
  }

  async loadJson(path) {
    return JSON.parse(await this.loadText(path));
  }
}
