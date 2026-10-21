/** Optional same-origin authoring transport; presentation maps technical codes to text. */
export class SourceSaveError extends Error {
  constructor(code, status = 0, details = null) {
    super(code);
    this.name = 'SourceSaveError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class SourceSaveClient {
  constructor({ fetch: fetchImplementation = globalThis.fetch?.bind(globalThis), bootstrap = null } = {}) {
    this.fetch = fetchImplementation;
    this.bootstrap = bootstrap;
    this.tokenPromise = null;
  }

  async request(path, options = {}) {
    let response;
    try {
      response = await this.fetch(path, {
        credentials: 'same-origin', mode: 'same-origin', cache: 'no-store', redirect: 'error', ...options,
      });
    } catch {
      throw new SourceSaveError('NETWORK_ERROR');
    }
    let result;
    try {
      result = await response.json();
    } catch {
      throw new SourceSaveError('INVALID_RESPONSE', response.status);
    }
    if (!response.ok) {
      throw new SourceSaveError(typeof result?.error === 'string' ? result.error : 'REQUEST_FAILED', response.status, result);
    }
    return result;
  }

  async sessionToken() {
    if (!this.tokenPromise) {
      this.tokenPromise = Promise.resolve()
        .then(() => this.bootstrap ? this.bootstrap() : this.request('/__authoring/session'))
        .then((session) => {
          if (typeof session?.token !== 'string' || !session.token) throw new SourceSaveError('INVALID_RESPONSE');
          return session.token;
        })
        .catch((error) => {
          this.tokenPromise = null;
          throw error instanceof SourceSaveError ? error : new SourceSaveError('NETWORK_ERROR');
        });
    }
    return this.tokenPromise;
  }

  async getResource(resourceId) {
    const result = await this.request(`/__authoring/resource?id=${encodeURIComponent(resourceId)}`);
    if (!result || typeof result.hash !== 'string' || !result.payload || typeof result.payload !== 'object') {
      throw new SourceSaveError('INVALID_RESPONSE');
    }
    return result;
  }

  async saveResource(resourceId, { schemaVersion, baseHash, payload }) {
    const token = await this.sessionToken();
    const result = await this.request('/__authoring/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Authoring-Token': token },
      body: JSON.stringify({ resourceId, schemaVersion, baseHash, payload }),
    });
    if (!result || result.sourceSaved !== true || typeof result.applied !== 'boolean' || typeof result.hash !== 'string') {
      throw new SourceSaveError('INVALID_RESPONSE');
    }
    return result;
  }
  async tilesetRequest(path,request){
    const token=await this.sessionToken(),result=await this.request(path,{method:'POST',headers:{'Content-Type':'application/json','X-Authoring-Token':token},body:JSON.stringify(request)});
    if(result?.applied!==true||typeof result.hash!=='string'||!result.payload)throw new SourceSaveError('INVALID_RESPONSE');return result;
  }
  importTileset(request){return this.tilesetRequest('/__authoring/tilesets/import',request);}
  saveTileset(request){return this.tilesetRequest('/__authoring/tilesets/save',request);}
}
