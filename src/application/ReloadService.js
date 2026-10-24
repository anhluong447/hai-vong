import {validateProject} from '../domain/story/validateProject.js';
import {createRunState,validateRunState} from '../domain/story/RunState.js';
import {diagnostic,failure,success} from '../contracts/Diagnostic.js';
const bad=code=>failure(diagnostic(code,'reload','/'));
/** Ports own clocks, cancellation signals and browser/resource preparation. */
export class ReloadService {
 constructor(ports){Object.assign(this,ports);this.epoch=0;this.fingerprint=null;}
 async apply(sources,{fingerprint,mode='preserve',mapping,context}={}){
  if(this.disposed)return bad('reload.disposed');const epoch=++this.epoch;this.controller?.abort();this.controller=this.cancellation();const signal=this.controller.signal;let token,adopted=false;
  try{
   if(typeof fingerprint!=='string'||!fingerprint||!['preserve','restart'].includes(mode))return bad('reload.request.invalid');
   const checked=validateProject(sources);if(!checked.ok)return checked;const bundle=checked.value,before=await this.capture();
   if(before.bundle.project.id!==bundle.project.id)return bad('reload.project.mismatch');
   let snapshot=mode==='restart'?createRunState(bundle):before.snapshot;
   if(mode!=='restart'&&mapping){if(!this.migrate)return bad('reload.mapping.unavailable');const migrated=await this.migrate(snapshot,bundle,mapping);if(!migrated.ok)return migrated;snapshot=migrated.value;}
   const valid=validateRunState(snapshot,bundle);if(!valid.ok)return failure([diagnostic('reload.restart-required','reload','/snapshot'),...valid.errors]);
   const prepared=await this.prepare({bundle,snapshot,signal,mode,context});if(!prepared.ok)return prepared;token=prepared.value;
   if(this.disposed||epoch!==this.epoch||signal.aborted)return bad('reload.stale');
   const latest=await this.capture();if((before.token===undefined?latest.snapshot!==before.snapshot:latest.token!==before.token)||latest.bundle!==before.bundle)return bad('reload.conflict');
   if(this.disposed||epoch!==this.epoch||signal.aborted)return bad('reload.stale');
   const committed=this.commit(token,{sources,bundle,snapshot,fingerprint,context});if(!committed?.ok)return committed??bad('reload.commit.failed');
   adopted=true;this.fingerprint=fingerprint;return success({fingerprint,bundle});
  }catch{return bad('reload.failed');}
  finally{if(token&&!adopted)try{await this.abort(token);}catch{return bad('reload.cleanup.failed');}}
 }
 cancel(){this.epoch++;this.controller?.abort();}
 dispose(){this.disposed=true;this.cancel();}
}
