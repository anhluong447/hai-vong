import {AssetCatalog} from '/src/infrastructure/resources/AssetCatalog.js';
import {AssetService} from '/src/infrastructure/resources/AssetService.js';
import {BrowserResourceDecoder} from '/src/infrastructure/resources/BrowserResourceDecoder.js';
export function resourceService(bundle,wrap=decode=>decode){
 const decoder=new BrowserResourceDecoder();return new AssetService({catalog:AssetCatalog.create(bundle.catalog.list('assets')).value,revision:bundle.revision,decode:wrap((...args)=>decoder.decode(...args))});
}
