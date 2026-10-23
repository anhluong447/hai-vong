import {diagnostic,failure,success} from './Diagnostic.js';
const bad=code=>failure(diagnostic(code,'preferences','/'));
export function defaultPreferences(config,input,locale){return {...structuredClone(config.defaults),locale,bindings:structuredClone(input.bindings)};}
export function validatePreferences(value,{config,input,locales}){
 if(!value||!Object.hasOwn(locales,value.locale)||!config.textScales.includes(value.textScale)||!config.textSpeeds.includes(value.textSpeed)||typeof value.reducedMotion!=='boolean'||!value.audio||Object.keys(value.audio).length!==Object.keys(config.defaults.audio).length||Object.entries(value.audio).some(([id,gain])=>!Object.hasOwn(config.defaults.audio,id)||!Number.isFinite(gain)||gain<0||gain>1))return bad('preferences.invalid');
 if(!Array.isArray(value.bindings)||value.bindings.length!==input.bindings.length)return bad('input.bindings.invalid');
 const seen=new Set();for(const [i,binding]of value.bindings.entries()){
  const original=input.bindings[i];
  if(!binding||binding.action!==original.action||JSON.stringify(binding.contexts)!==JSON.stringify(original.contexts)||!validCode(binding.code)||config.reservedCodes.includes(binding.code))return bad('input.binding.invalid');
  for(const context of binding.contexts){const id=context+':'+binding.code;if(seen.has(id))return bad('input.binding.conflict');seen.add(id);}
 }
 return success(value);
}
const validCode=code=>typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Enter|Space|Escape|Backspace|Delete|Home|End|PageUp|PageDown|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Numpad[0-9])$/.test(code);
export function remapBinding(value,index,code,contract){
 if(!Number.isInteger(index)||!value.bindings[index])return bad('input.binding.invalid');const next=structuredClone(value);next.bindings[index].code=code;return validatePreferences(next,contract);
}
