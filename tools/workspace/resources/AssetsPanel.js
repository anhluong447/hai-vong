import {ResourcePanel} from './ResourcePanel.js';
import {diagnostic,failure} from '../../../src/contracts/Diagnostic.js';
export class AssetsPanel extends ResourcePanel {
 render(){super.render();
  if(this.selected().data.kind==='asset-imports'){
   this.previewRoot.dataset.role='asset-recipe';const build=this.button(this.ui.labels.buildAssets,'build-assets',()=>{build.disabled=true;void this.rebuildAssets().then(result=>{if(!this.disposed){build.disabled=false;this.notify(result);}});});build.disabled=!this.rebuildAssets;this.previewRoot.append(build);return;
  }
  this.previewRoot.append(this.button(this.ui.labels.preview,'preview',()=>void this.previewAsset().then(result=>this.reportPreview(result))));
  const recipe=this.workspace.list().find(doc=>doc.data?.kind==='asset-imports');if(recipe){const link=this.button(this.ui.labels.recipe,'recipe',()=>this.openSource?.(recipe.id,'',recipe.data.id));link.disabled=!this.openSource;this.previewRoot.append(link);}
 }
 previewAsset(){const asset=this.workspace.bundle.catalog.get('assets',this.resourceId).value;
  if(asset.kind==='image')return this.startPreview('bitmap',asset.id);const cue=this.workspace.bundle.catalog.list('audio').find(cue=>cue.assetId===asset.id);return cue?this.startPreview('cue',cue.id):Promise.resolve(failure(diagnostic('authoring.audio.cue-required',this.sourceId,'/assetId',[asset.id])));
 }
}
