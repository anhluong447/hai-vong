import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
/** Pure keyed interpolation; DOM/rich-text rendering is a separate concern. */
export class TextService {
 constructor(locales,locale){this.locales=locales;this.locale=locale;}
 format(key,params={}) {
  const entry=this.locales[this.locale]?.[key];
  if(!entry)return failure(diagnostic('text.key.missing','locale','/'+key,[key]));
  if(Object.keys(params).some(k=>!entry.params.includes(k))||entry.params.some(k=>!Object.hasOwn(params,k)))return failure(diagnostic('text.params.invalid','locale','/'+key,[key]));
  return success(entry.value.replace(/\{([\w.]+)\}/g,(_,name)=>String(params[name])));
 }
}
