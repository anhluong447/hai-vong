import {AssetCatalog} from '../../src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '../../src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '../../src/infrastructure/resources/BrowserResourceDecoder.js';
import {DialoguePresentationView} from '../../src/presentation/ui/DialoguePresentationView.js';
import {resolveDialoguePresentation} from '../../src/application/DialoguePresentation.js';
/** Editor-only leases; the model and rendering are shared with the player. */
export class DialoguePreview {
 constructor(root,{bundle,format,settings}){
  this.bundle=bundle;const decoder=new BrowserResourceDecoder();this.assets=new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:(...args)=>decoder.decode(...args)});
  const name=root.ownerDocument.createElement('span'),portrait=root.ownerDocument.createElement('canvas');name.dataset.role='dialogue-name';portrait.dataset.role='dialogue-portrait';portrait.setAttribute('aria-hidden','true');portrait.style.width=portrait.style.height=settings.height+'px';root.append(name,portrait);
  this.view=new DialoguePresentationView({root,format,assets:this.assets,revision:bundle.revision});
 }
 present(state){const model=resolveDialoguePresentation(state,this.bundle);return model.ok?this.view.present(model.value):Promise.resolve(model);}
 dispose(){this.view.dispose();this.assets.dispose();}
}
