import {immutableCopy} from '../../contracts/Content.js';
import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export class ContentCatalog {
 #entries=new Map();
 constructor(entries) { for(const [kind,definitions] of Object.entries(entries)) this.#entries.set(kind,new Map(definitions.map(d=>[d.id,immutableCopy(d)])));Object.freeze(this); }
 get(kind,id) { const value=this.#entries.get(kind)?.get(id);return value?success(value):failure(diagnostic('content.reference.missing',kind,'',[id])); }
 list(kind) { return Object.freeze([...(this.#entries.get(kind)?.values()??[])]); }
}
