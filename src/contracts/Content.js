/** @typedef {string} Id */
/** @typedef {string} Revision */
/** @typedef {{revision:string,project:object,catalogs:object}} ContentBundle */
/** Authored definitions are plain, immutable JSON. Never pass platform handles inward. */
export function immutableCopy(value) {
  const copy=structuredClone(value);
  function freeze(node) {
    if (node && typeof node==='object') { Object.values(node).forEach(freeze); Object.freeze(node); }
    return node;
  }
  return freeze(copy);
}
/** JSON object member order has no semantic meaning; array order does. */
export function sameJSON(a,b){
 if(a===b)return true;
 if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,index)=>sameJSON(value,b[index]));
 return !!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&sameJSON(a[key],b[key]));
}
