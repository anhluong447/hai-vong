/** @typedef {{code:string,sourceId:string,pointer:string,relatedIds:string[]}} Diagnostic */
/** @template T @typedef {{ok:true,value:T}|{ok:false,errors:Diagnostic[]}} Result */
export const diagnostic = (code, sourceId = '', pointer = '', relatedIds = []) => ({code,sourceId,pointer,relatedIds});
export const success = value => ({ok:true,value});
export const failure = (...errors) => ({ok:false,errors:errors.flat()});
