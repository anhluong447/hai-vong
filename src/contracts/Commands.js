/** Protocol identifiers describe capabilities, never a particular story. */
export const STORY_OPCODES = Object.freeze(['say','choose','jump','setFlag','setBackdrop','showActor','playCue','transition','emitEffect','end']);
/** @typedef {{id:string,type:string,params:object}} Command */
/** @typedef {{id:string,type:string,params:object}} Outcome */
