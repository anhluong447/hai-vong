import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {formatTokens} from '../../contracts/TextTokens.js';
/** Pure keyed interpolation; DOM/rich-text rendering is a separate concern. */
export class TextService {
 constructor(locales,locale){this.locales=locales;this.locale=locale;}
 runs(key,params={}) {
  const entry=this.locales[this.locale]?.[key];
  if(!entry)return failure(diagnostic('text.key.missing','locale','/'+key,[key]));
  return formatTokens(entry,params,key);
 }
 format(key,params={}){const result=this.runs(key,params);return result.ok?success(result.value.map(r=>r.value).join('')):result;}
}
