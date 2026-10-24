import {diagnostic} from './Diagnostic.js';
import {INPUT_ACTIONS,INPUT_CONTEXTS} from './InputActions.js';
import {defaultPreferences,validatePreferences} from './PlayerPreferences.js';
export const PLAYER_SCREENS=Object.freeze(['main','pause','slots','settings','backlog']);
const actions=new Set(['new','continue','load','save','settings','backlog','main','resume','audio','fullscreen']);
export function validateNavigation({catalog,project,locales,sourceFor}){
 const errors=[],has=key=>typeof key==='string'&&!!locales[project.defaultLocale]?.[key];
 const add=(id,code,pointer)=>errors.push(diagnostic(code,sourceFor('config',id),pointer,[id]));
 for(const config of catalog.list('config')){
  if(config.kind==='player-navigation'){
   const fail=p=>add(config.id,'navigation.invalid',p);
   if(!Number.isInteger(config.manualSlots)||config.manualSlots<1||!Number.isInteger(config.autoSlots)||config.autoSlots<1||!Number.isInteger(config.historyLimit)||config.historyLimit<1||!(config.autoDelay>0))fail('/');
   for(const field of ['textScales','textSpeeds'])if(!Array.isArray(config[field])||!config[field].length||config[field].some(v=>!Number.isFinite(v)||v<=0))fail('/'+field);
   for(const field of ['reservedCodes','cancelCaptureCodes'])if(!Array.isArray(config[field])||config[field].some(v=>typeof v!=='string')||!config[field].length)fail('/'+field);
   for(const field of ['main','pause'])if(!Array.isArray(config[field])||!config[field].length||config[field].some(item=>!item||!actions.has(item.action)||!has(item.key)))fail('/'+field);
   for(const field of ['main','pause'])if(Array.isArray(config[field])&&new Set(config[field].map(item=>item?.action)).size!==config[field].length)fail('/'+field);
   if(!Array.isArray(config.textKeys)||config.textKeys.some(key=>!has(key)))fail('/textKeys');
   if(!config.screenTitles||PLAYER_SCREENS.some(screen=>!has(config.screenTitles[screen]))||typeof config.bindingSeparator!=='string')fail('/screenTitles');
   if(config.legacyBindingCounts!==undefined&&(!Array.isArray(config.legacyBindingCounts)||config.legacyBindingCounts.some(count=>!Number.isInteger(count)||count<1)))fail('/legacyBindingCounts');
  }
  if(config.kind==='input-actions'){
   if(!config.labels||INPUT_ACTIONS.some(action=>!has(config.labels[action]))||!config.contexts||INPUT_CONTEXTS.some(context=>!has(config.contexts[context]))||!config.locales||Object.entries(config.locales).some(([locale,key])=>!locales[locale]||!has(key))||!config.buses||Object.values(config.buses).some(key=>!has(key)))add(config.id,'input.labels.invalid','/');
  }
  if(config.kind==='runtime'){
   const nav=catalog.get('config',config.navigationId),input=catalog.get('input',config.inputId),labels=catalog.get('config',config.actionLabelsId);
   if(!nav.ok||nav.value.kind!=='player-navigation'||!labels.ok||labels.value.kind!=='input-actions'){add(config.id,'navigation.missing','/navigationId');continue;}
   if(!nav.value.defaults?.audio||config.audioBuses?.some(bus=>!Object.hasOwn(nav.value.defaults.audio,bus.id)||!has(labels.value.buses?.[bus.id])))add(nav.value.id,'preferences.audio.invalid','/defaults/audio');
   if(input.ok&&Array.isArray(nav.value.textScales)&&Array.isArray(nav.value.textSpeeds)&&Array.isArray(nav.value.reservedCodes)){
    const checked=validatePreferences(defaultPreferences(nav.value,input.value,project.defaultLocale),{config:nav.value,input:input.value,locales});if(!checked.ok)add(nav.value.id,'preferences.defaults.invalid','/defaults');
   }
  }
 }
 const fallback=locales[project.defaultLocale];
 for(const [locale,catalogue]of Object.entries(locales)){
  try{new Intl.Locale(locale);}catch{add(locale,'text.locale.invalid','/locale');}
  for(const [key,entry]of Object.entries(fallback??{}))if(!catalogue[key]||JSON.stringify([...entry.params].sort())!==JSON.stringify([...catalogue[key].params].sort()))add(locale,'text.translation.missing','/'+key);
 }
 return errors;
}
