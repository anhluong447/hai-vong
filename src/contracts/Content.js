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
