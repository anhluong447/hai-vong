import {Inspector} from '../editors/Inspector.js';
import {ResourcePreview} from './ResourcePreview.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
/** Preview replacement claims ownership before awaiting disposal or decoding. */
export class ResourcePanel extends Inspector {
 resetPreview(){this.generation=(this.generation??0)+1;const previous=this.preview;this.preview=null;return previous?.dispose();}
 render(){void this.resetPreview();super.render();}
 async startPreview(method,id){
  const generation=(this.generation??0)+1;this.generation=generation;const previous=this.preview,preview=new ResourcePreview(this.previewRoot,this.workspace.bundle,this.ui.preview);this.preview=preview;
  await previous?.dispose();
  const stale=()=>failure(diagnostic('preview.stale',this.sourceId,'/'));
  if(this.disposed||this.generation!==generation){await preview.dispose();return stale();}
  let result;try{result=await preview[method](id);}catch{result=failure(diagnostic('preview.failed',this.sourceId,'/'));}
  if(this.disposed||this.generation!==generation){await preview.dispose();return stale();}
  if(!result.ok)await preview.dispose();return result;
 }
 reportPreview(result){if(!result.ok&&result.errors[0].code!=='preview.stale')this.notify(result);return result;}
 async dispose(){super.dispose();await this.resetPreview();}
}
