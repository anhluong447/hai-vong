import {SAVE_SCHEMA_VERSION} from '../../contracts/SaveEnvelope.js';
import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
const canonical=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item);
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value))))).map(v=>v.toString(16).padStart(2,'0')).join('');
const bad=code=>failure(diagnostic(code,'save','/'));
/** Codec is I/O independent; full content/state validation is the application's restore boundary. */
export class SaveCodec {
 static async encode(payload,{buildId,contentVersion}) {
  try {
   const body={schemaVersion:SAVE_SCHEMA_VERSION,contentVersion,buildId,payload:structuredClone(payload)};
   if(typeof buildId!=='string'||typeof contentVersion!=='string')return bad('save.header.invalid');
   return success({...body,checksum:await digest(body)});
  } catch {return bad('save.encode.failed');}
 }
 static async decode(envelope) {
  try {
   if(!envelope||envelope.schemaVersion!==SAVE_SCHEMA_VERSION)return bad('save.version.unsupported');
   const {checksum,...body}=envelope;
   if(typeof body.contentVersion!=='string'||typeof body.buildId!=='string'||!body.payload||typeof body.payload!=='object')return bad('save.header.invalid');
   if(await digest(body)!==checksum)return bad('save.checksum.invalid');
   return success(structuredClone(body.payload));
  } catch {return bad('save.decode.failed');}
 }
}
