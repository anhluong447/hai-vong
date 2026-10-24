import {immutableCopy} from '../../contracts/Content.js';
import {validateResources} from '../../contracts/validateResources.js';
import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
export class AssetCatalog {
 #entries;
 constructor(definitions){this.#entries=new Map(definitions.map(d=>[d.id,immutableCopy(d)]));}
 static create(definitions){const errors=validateResources(definitions);return errors.length?failure(errors):success(new AssetCatalog(definitions));}
 get(id){const entry=this.#entries.get(id);return entry?success(entry):failure(diagnostic('asset.reference.missing','assets','/'+id,[id]));}
}
