import {diagnostic,failure} from '../../contracts/Diagnostic.js';
import {validateSchema} from '../../contracts/validateSchema.js';
import {executeOnce} from './executionLedger.js';
export function applyEffect(state,{effectId,params={},identity},{bundle,effects}) {
 const definition=bundle.catalog.get('events',effectId);
 if(!definition.ok)return definition;
 const errors=validateSchema(definition.value.paramsSchema,params,'command','/params');
 if(errors.length)return failure(errors);
 const handler=effects[definition.value.handlerId];
 if(!handler)return failure(diagnostic('event.handler.unknown','command','/effectId',[effectId]));
 if(typeof identity!=='string'||!identity)return failure(diagnostic('command.identity.invalid','command','/identity'));
 return executeOnce(state,identity,()=>handler(state,params,{bundle}));
}
