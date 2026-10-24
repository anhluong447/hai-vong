import {diagnostic} from './Diagnostic.js';
import {SCRIPT_GAMEPLAY_FIELDS,HOME_ROUTES,NIGHT_CHOICES} from './GameplayActions.js';
/** The same typed capability checks serve authored commands and runtime handlers. */
export function validateGameplayEffects(handlerId,params,catalog,sourceId='command',pointer='/params'){
 if(!['gameplay.command','gameplay.assign'].includes(handlerId))return [];
 const errors=[],add=(code,key,id)=>errors.push(diagnostic(code,sourceId,pointer+'/'+key,id===undefined?[]:[id]));
 const fields=handlerId==='gameplay.assign'?['questId','memberId']:Object.hasOwn(SCRIPT_GAMEPLAY_FIELDS,params.action)?SCRIPT_GAMEPLAY_FIELDS[params.action]:null;
 if(!fields){add('gameplay.effect.action','action',params.action);return errors;}
 const keys=handlerId==='gameplay.assign'?fields:['action',...fields];
 for(const key of keys)if(typeof params[key]!=='string'||!params[key])add('gameplay.effect.params',key);
 for(const key of Object.keys(params))if(!keys.includes(key))add('gameplay.effect.params',key);
 if('questId'in params){const quest=catalog.get('quests',params.questId);if(!quest.ok)add('gameplay.effect.reference','questId',params.questId);else{
  if(handlerId==='gameplay.assign'&&quest.value.type!=='general')add('gameplay.effect.questType','questId',params.questId);
  if('stepId'in params&&!quest.value.steps.some(step=>step.id===params.stepId))add('gameplay.effect.reference','stepId',params.stepId);
 }}
 for(const field of ['memberId','performerId'])if(field in params&&!catalog.list('team').some(team=>team.members.some(member=>member.id===params[field])))add('gameplay.effect.reference',field,params[field]);
 if('route'in params&&!HOME_ROUTES.includes(params.route))add('gameplay.effect.params','route',params.route);
 if('choice'in params&&!NIGHT_CHOICES.includes(params.choice))add('gameplay.effect.params','choice',params.choice);
 return errors;
}
