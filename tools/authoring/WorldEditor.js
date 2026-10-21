import {t} from '../../src/shared/text.js';
import {GameSession} from '../../src/application/GameSession.js';
import {PixelWorld} from '../../src/pixel/PixelWorld.js';
import {hydrateScene} from '../../content/maps/materialize.js';
import {validateWorldProject,validateWorldScene} from '../../src/shared/validateWorldScene.js';
import {normalizeTileset} from '../../src/shared/validateTileset.js';
import {TILESET as INITIAL_TILESET,TILESET_SOURCE_HASH} from '../../content/maps/scenes-data.js';
import {TilesetDocument} from './TilesetDocument.js';
import {TilesetEditor} from './TilesetEditor.js';
import {SCENES,PREFABS,KNOWN_REFS,SCENE_SOURCE_HASHES} from '../../content/maps/scenes-data.js';
import {worldMetrics,gridToPixel,actorFoot,clientToGrid,pickHeight} from '../../content/world/metrics.js';
import {WorldDocument} from './WorldDocument.js';
import {SourceSaveClient} from './SourceSaveClient.js';
import {TileMapEditor} from './TileMapEditor.js';

const text=id=>t(`authoring.world.${id}`);
export class WorldEditor{
 constructor(root){
  this.root=root;this.host=root.querySelector('#world-stage');this.status=root.querySelector('#world-status');this.abort=new AbortController();this.documents=new Map();this.mapId=new URLSearchParams(location.search).get('map')||'home';if(!SCENES[this.mapId])this.mapId='home';this.mode='edit';this.selection=null;this.session=new GameSession();this.sourceClient=new SourceSaveClient();
  this.tileCatalog=INITIAL_TILESET;this.localTileImages=new Map();this.localTileImports=new Map();this.tilesetDocument=new TilesetDocument({source:INITIAL_TILESET,sourceHash:TILESET_SOURCE_HASH,validate:c=>this.validateTilesetDraft(c)});
  for(const [id,source] of Object.entries(SCENES))this.documents.set(id,new WorldDocument({source,prefabs:PREFABS,knownRefs:KNOWN_REFS,sourceHash:SCENE_SOURCE_HASHES[id],getCatalog:()=>this.tileCatalog,getCatalogHash:()=>this.tilesetDocument.sourceHash,validateScene:candidate=>this.documents.size===Object.keys(SCENES).length?validateWorldProject({...this.sceneSources(),[candidate.id]:candidate},PREFABS,KNOWN_REFS,this.tileCatalog)[candidate.id]:validateWorldScene(candidate,PREFABS,KNOWN_REFS,{catalog:this.tileCatalog})}));
  const mapSelect=root.querySelector('#world-map');for(const id of Object.keys(SCENES)){const option=document.createElement('option');option.value=id;option.textContent=text(`map.${id}`);mapSelect.append(option);}mapSelect.value=this.mapId;
  this.listen(mapSelect,'change',()=>this.switchMap(mapSelect.value));this.listen(root.querySelector('#world-entities'),'change',event=>this.select(event.target.value));
  const palette=root.querySelector('#world-palette');for(const [prefab,ids] of [['prop',KNOWN_REFS.assets],['npc',KNOWN_REFS.sprites.filter(id=>id!=='khue')]])for(const id of ids){const option=document.createElement('option');option.value=`${prefab}:${id}`;option.textContent=`${prefab} / ${id}`;palette.append(option);}
  const toolbar=root.querySelector('#world-toolbar');for(const action of ['edit','play','undo','redo','export','import','draftSave','draftRestore','sourceSave']){const button=this.button(action,()=>this.action(action));button.dataset.action=action;toolbar.append(button);}
  root.querySelector('#world-palette-actions').append(this.button('spawn',()=>this.spawn()),this.button('delete',()=>this.remove()));
  this.listen(root.querySelector('#world-import'),'change',async event=>{const file=event.target.files[0],target=this.document;this.cancel();if(file)try{const text=await file.text();if(this.disposed)return;this.cancel();target.importJSON(text);}catch(error){this.reportError(error);}event.target.value='';});
  this.editLayer='entities';this.tilesetEditor=new TilesetEditor(root.querySelector('#tileset-inspector'),{document:this.tilesetDocument,onCatalogChange:catalog=>this.applyTilesetDraft(catalog),onImport:prepared=>this.importTileset(prepared),onSave:()=>this.saveTileset(),onError:error=>this.reportError(error),getImage:atlas=>this.downloadTileImage(atlas)});this.tileEditor=new TileMapEditor(this);
  this.listen(root,'keydown',event=>this.key(event));for(const document of this.documents.values())document.subscribe(()=>this.changed());this.buildWorld();this.refresh();
 }
 get document(){return this.documents.get(this.mapId);}
 setEditLayer(layer){if(!['entities','tiles'].includes(layer))throw new RangeError('world.tile.layer');this.cancel();this.editLayer=layer;this.tileEditor.setActive(layer==='tiles'&&this.mode==='edit');this.refresh();}
 listen(target,type,listener){target.addEventListener(type,listener,{signal:this.abort.signal});}
 button(id,action){const button=document.createElement('button');button.type='button';button.textContent=text(id);this.listen(button,'click',()=>{try{action();}catch(error){this.reportError(error);}});return button;}
 notice(id){this.status.textContent=text(id);}
 reportError(error){this.status.textContent=`${text(error?.message?.includes('sourceConflict')||error?.code==='CONFLICT'?'sourceConflict':'invalid')}\n${error.message}`;}
 sceneSources(){return Object.fromEntries([...this.documents].map(([id,doc])=>[id,doc.draft]));}
 catalog(){return Object.fromEntries(Object.entries(validateWorldProject(this.sceneSources(),PREFABS,KNOWN_REFS,this.tileCatalog)).map(([id,scene])=>[id,hydrateScene(scene,PREFABS,t)]));}
 buildWorld(){
  const position=this.world?.snapshot();this.world?.dispose();this.host.replaceChildren();const mapCatalog=this.catalog();
  this.world=new PixelWorld(this.host,{mapId:this.mapId,mapCatalog,tileCatalog:this.tileCatalog,authoredNPCs:true,getState:()=>this.session.state,onInteract:()=>this.notice('interactionDisabled'),onNotice:()=>{}});
  this.world.canvas.setAttribute('aria-label',text('canvas'));
  this.world.onBeforeEnter=(id,spawn)=>this.switchMap(id,spawn);if(position?.mapId===this.mapId)this.world.restore(position);this.world.setEditing(this.mode==='edit');
  this.overlay=document.createElement('canvas');this.overlay.className='world-grid-overlay';this.overlay.setAttribute('aria-label',text('selected'));this.overlay.tabIndex=0;this.host.append(this.overlay);this.overlay.hidden=this.mode!=='edit';
  this.overlayAbort?.abort();this.overlayAbort=new AbortController();const signal=this.overlayAbort.signal;this.overlay.addEventListener('pointerdown',event=>this.down(event),{signal});this.overlay.addEventListener('pointermove',event=>this.move(event),{signal});this.overlay.addEventListener('pointerup',event=>this.up(event),{signal});this.overlay.addEventListener('pointercancel',()=>this.cancel(),{signal});this.overlay.addEventListener('lostpointercapture',()=>{this.cancel();},{signal});
  this.overlay.addEventListener('blur',()=>{this.tileEditor.space=false;this.cancel();},{signal});
  this.world.onFrame=()=>{this.world.hint.textContent=this.mode==='edit'&&this.editLayer==='tiles'?this.tileEditor.hint():text(this.mode==='edit'?'editHint':'playHint');this.drawOverlay();};
 }
 changed(){if(!this.world)return;this.tileEditor?.cancel();this.world.replaceMapCatalog(this.catalog());this.world.draw(0);this.refresh();if(!this.saving)this.status.textContent=t(this.document.dirty?'authoring.dirty':'authoring.world.ready');}
 switchMap(id,spawn){this.cancel();this.tileEditor.saveCamera();this.world.editorCamera=null;this.mapId=id;this.root.querySelector('#world-map').value=id;this.selection=null;this.world.replaceMapCatalog(this.catalog());this.world.enter(id,spawn||this.world.mapCatalog[id].spawn);this.tileEditor.enterMap();this.refresh();}
 setMode(mode){this.cancel();this.tileEditor.saveCamera();this.mode=mode;if(mode==='play')this.world.restore(this.world.snapshot());this.world.setEditing(mode==='edit');if(mode==='play')this.world.setEditorCamera(null);else this.tileEditor.restoreCamera();this.overlay.hidden=mode!=='edit';this.refresh();if(mode==='play')this.world.canvas.focus();}
 select(id){this.selection=[...this.document.draft.objects,...this.document.draft.npcs].some(o=>o.id===id)?id:null;this.refresh();this.world.draw(0);}
 entity(){return[...this.document.draft.objects,...this.document.draft.npcs].find(o=>o.id===this.selection);}
 point(event){return clientToGrid({x:event.clientX,y:event.clientY},this.world.canvas.getBoundingClientRect(),this.world.canvas.width,this.world.scale,this.world.camera);}
 down(event){if(this.tileEditor.handlePointerDown(event))return;if(this.mode!=='edit'||!this.world.ready)return;event.preventDefault();const p=this.point(event),entities=[...this.world.map.objects,...this.world.map.npcs].sort((a,b)=>b.y-a.y),hit=entities.find(o=>o.x===p.x&&p.y<=o.y&&p.y>=o.y-pickHeight(o,o.sprite?this.world.sprite(o.sprite):null)+1);this.select(hit?.id);if(!hit)return;this.document.begin();this.drag={id:hit.id,pointerId:event.pointerId,start:p,origin:{x:hit.x,y:hit.y}};this.overlay.setPointerCapture(event.pointerId);this.overlay.focus();}
 move(event){if(this.tileEditor.handlePointerMove(event))return;if(!this.drag||event.pointerId!==this.drag.pointerId)return;const p=this.point(event),drag=this.drag;try{this.document.updateEntity(drag.id,{x:drag.origin.x+p.x-drag.start.x,y:drag.origin.y+p.y-drag.start.y});this.notice('ready');}catch(error){this.reportError(error);}}
 up(event){if(this.tileEditor.handlePointerUp(event))return;if(!this.drag||event.pointerId!==this.drag.pointerId)return;const id=this.drag.pointerId;this.drag=null;this.document.commit();if(this.overlay.hasPointerCapture(id))this.overlay.releasePointerCapture(id);}
 cancel(){this.tileEditor?.cancel();const pointerId=this.drag?.pointerId;this.drag=null;this.document.cancel();if(pointerId!==undefined&&this.overlay.hasPointerCapture(pointerId))this.overlay.releasePointerCapture(pointerId);}
 key(event){
  if(event.target.closest?.('#tileset-inspector'))return;
  if(this.tileEditor.handleKey(event))return;
  if(event.key==='Escape'&&this.drag){event.preventDefault();this.cancel();return;}
  if(this.mode!=='edit'||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();this.cancel();event.shiftKey?this.document.redo():this.document.undo();return;}
  if(this.drag||this.editLayer==='tiles')return;
  if(event.key==='Delete'){event.preventDefault();this.remove();}
  else if(this.selection&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const e=this.entity(),delta=event.shiftKey?5:1;try{this.document.updateEntity(e.id,{x:e.x+(event.key==='ArrowLeft'?-delta:event.key==='ArrowRight'?delta:0),y:e.y+(event.key==='ArrowUp'?-delta:event.key==='ArrowDown'?delta:0)});}catch(error){this.reportError(error);}}
 }
 spawn(){if(this.mode!=='edit')return;const [prefab,visual]=this.root.querySelector('#world-palette').value.split(':');const {width,height}=this.document.draft;const p={x:Math.max(1,Math.min(width-2,this.world.player.x+1)),y:Math.max(1,Math.min(height-2,this.world.player.y))};this.select(this.document.spawn(prefab,visual,p));}
 remove(){if(this.mode==='edit'&&this.selection){this.document.deleteEntity(this.selection);this.selection=null;this.refresh();}}
 refresh(){
  this.tileEditor.setActive(this.editLayer==='tiles'&&this.mode==='edit');
  const list=this.root.querySelector('#world-entities');list.replaceChildren();for(const entity of [...this.document.draft.objects,...this.document.draft.npcs]){const option=document.createElement('option');option.value=entity.id;option.textContent=entity.id;list.append(option);}list.value=this.selection||'';
  for(const button of this.root.querySelectorAll('[data-action]')){if(['edit','play'].includes(button.dataset.action))button.setAttribute('aria-pressed',String(button.dataset.action===this.mode));if(['undo','redo'].includes(button.dataset.action))button.disabled=this.mode!=='edit';}
  const inspector=this.root.querySelector('#world-inspector');inspector.replaceChildren();const entity=this.entity();if(!entity){inspector.textContent=text('noSelection');return;}const selected=document.createElement('p');selected.className='world-selected';selected.textContent=entity.id;inspector.append(selected);
  const o={...PREFABS[entity.prefab],...entity.overrides},sprite=o.sprite?this.world.sprite(o.sprite):null,pivot=o.pivotPx||sprite?.pivot||{x:o.asset?16:(sprite?.frameWidth||24)/2,y:o.asset?46:(sprite?.frameHeight||36)-2};
  for(const [key,value] of [['x',entity.x],['y',entity.y],['pivotX',pivot.x],['pivotY',pivot.y],['offsetX',o.offsetPx?.x||0],['offsetY',o.offsetPx?.y||0]]){const label=document.createElement('label'),span=document.createElement('span'),input=document.createElement('input');span.textContent=text(key);input.type='number';input.step=['x','y'].includes(key)?'1':'.01';input.value=value;input.dataset.field=key;input.disabled=this.mode!=='edit';label.append(span,input);inspector.append(label);input.addEventListener('change',()=>{try{const n=Number(input.value);if(input.value.trim()===''||!Number.isFinite(n))throw new Error('world.field.number');const patch=['x','y'].includes(key)?{[key]:n}:{overrides:{[key.startsWith('pivot')?'pivotPx':'offsetPx']:{...(key.startsWith('pivot')?pivot:o.offsetPx||{x:0,y:0}),[key.endsWith('X')?'x':'y']:n}}};this.document.updateEntity(entity.id,patch);}catch(error){this.reportError(error);}});}
  const label=document.createElement('label'),span=document.createElement('span'),area=document.createElement('textarea');span.textContent=text('footprint');area.value=JSON.stringify(o.footprint||[[0,0]]);area.dataset.field='footprint';area.disabled=this.mode!=='edit';label.append(span,area);inspector.append(label);area.addEventListener('change',()=>{try{this.document.updateEntity(entity.id,{overrides:{footprint:JSON.parse(area.value)}});}catch(error){this.reportError(error);}});
 }
 drawOverlay(){
  if(!this.overlay||this.mode!=='edit'||!this.world.ready)return;const world=this.world,rect=world.canvas.getBoundingClientRect(),hostRect=this.host.getBoundingClientRect(),overlay=this.overlay;overlay.width=world.canvas.width;overlay.height=world.canvas.height;overlay.style.width=`${rect.width}px`;overlay.style.height=`${rect.height}px`;overlay.style.left=`${rect.left-hostRect.left-this.host.clientLeft}px`;overlay.style.top=`${rect.top-hostRect.top-this.host.clientTop}px`;const ctx=overlay.getContext('2d'),tile=worldMetrics.tilePixels;ctx.lineWidth=.3;ctx.strokeStyle='#c4eee52d';if(this.editLayer!=='tiles'||this.tileEditor.showGrid){for(let x=-world.camera.x%tile;x<overlay.width;x+=tile){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,overlay.height);ctx.stroke();}for(let y=-world.camera.y%tile;y<overlay.height;y+=tile){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(overlay.width,y);ctx.stroke();}
  }if(this.editLayer==='tiles'){this.tileEditor.draw(ctx,world);return;}
  const source=this.entity();if(!source)return;const o={...PREFABS[source.prefab],...source.overrides},sprite=o.sprite?world.sprite(o.sprite):null,foot=actorFoot(source.x,source.y),x=foot.x-world.camera.x+(o.offsetPx?.x||0),y=foot.y-world.camera.y+(o.offsetPx?.y||0),fw=sprite?.frameWidth||32,fh=sprite?.frameHeight||48,pivot=o.pivotPx||sprite?.pivot||{x:fw/2,y:fh-2};ctx.lineWidth=1;ctx.strokeStyle='#70dffa';ctx.strokeRect(x-pivot.x,y-pivot.y,fw,fh);ctx.strokeStyle='#ffcf65';ctx.strokeRect(gridToPixel(source.x)-world.camera.x,gridToPixel(source.y-pickHeight(o,sprite)+1)-world.camera.y,tile,pickHeight(o,sprite)*tile);ctx.fillStyle='#ff8b7770';for(const [dx,dy] of o.footprint||[[0,0]])ctx.fillRect(gridToPixel(source.x+dx)-world.camera.x,gridToPixel(source.y+dy)-world.camera.y,tile,tile);ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();
 }
 async action(action){
  if(action==='sourceSave'&&this.saving)return;
  try{
   this.cancel();
   if(action==='edit'||action==='play')this.setMode(action);
   else if(action==='undo')this.document.undo();
   else if(action==='redo')this.document.redo();
   else if(action==='import')this.root.querySelector('#world-import').click();
   else if(action==='export'){const blob=new Blob([this.document.exportJSON()],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${this.mapId}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
   else if(action==='draftSave'){localStorage.setItem(`clb-bao-chi.authoring.world.v1.${this.mapId}`,JSON.stringify(this.document.draftEnvelope()));this.status.textContent=t('authoring.draftSaved');}
   else if(action==='draftRestore'){const saved=localStorage.getItem(`clb-bao-chi.authoring.world.v1.${this.mapId}`);if(saved)this.document.restoreDraft(JSON.parse(saved));}
   else if(action==='sourceSave'){
    if(this.tilesetDocument.dirty)throw new Error('world.tileset.unsaved');
    this.saving=true;this.document.commit();this.status.textContent=t('authoring.saving');
    const doc=this.document,resource=`scene/${this.mapId}`,submitted=JSON.parse(doc.exportJSON()),baseHash=doc.sourceHash,catalogHash=this.tilesetDocument.sourceHash,current=await this.sourceClient.getResource(resource);
    if(current.hash!==baseHash)throw new Error('world.draft.sourceConflict');
    const result=await this.sourceClient.saveScene(resource,{baseHash,catalogHash,payload:submitted});if(this.disposed)return;doc.acceptSource(result.hash,submitted);
    if(doc===this.document)this.status.textContent=t(result.applied?(doc.dirty?'authoring.savedWithDraft':'authoring.world.sourceApplied'):'authoring.world.sourceBuildFailed');
   }
  }catch(error){this.reportError(error);}finally{if(action==='sourceSave')this.saving=false;}
 }
 validateTilesetDraft(candidate){
  if(this.world&&!this.world.ready)throw new Error('world.tileset.loading');
  const catalog=normalizeTileset(candidate,undefined,{textKeys:KNOWN_REFS.textKeys});
  for(const old of this.tilesetDocument?.source.tiles||[])if(!catalog.tiles.some(t=>t.id===old.id&&t.atlasId===old.atlasId&&t.atlasIndex===old.atlasIndex))throw new Error('world.tileset.persistedIdentity');
  validateWorldProject(this.sceneSources(),PREFABS,KNOWN_REFS,catalog);return catalog;
 }
 applyTilesetDraft(catalog,images){
  if(this.disposed||catalog===this.tileCatalog)return;this.cancel();this.tileCatalog=catalog;
  const available=new Map([...(this.world?.tileImages||[]),...this.localTileImages,...(images||[])]);
  if(this.world?.ready){this.world.replaceTileCatalog(catalog,available);this.world.replaceMapCatalog(this.catalog());this.world.draw(0);}
  this.tileEditor?.rebuildPalette();
 }
 async importTileset(prepared){
  this.cancel();if(this.disposed)return;const payload=structuredClone(this.tileCatalog),atlas=prepared.payload.atlases.find(a=>a.id===prepared.atlasId),existing=payload.atlases.find(a=>a.id===atlas.id);
  if(existing){if(['tilePixels','margin','spacing'].some(k=>existing[k]!==atlas[k]))throw new Error('world.tileset.atlas.layout');}
  else{payload.atlases.push(atlas);for(const tile of prepared.payload.tiles.filter(t=>t.atlasId===atlas.id))payload.tiles.push({...tile,id:payload.nextTileId++});}
  this.validateTilesetDraft(payload);this.localTileImages.set(prepared.atlasId,prepared.image);this.localTileImports.set(prepared.atlasId,prepared);
  this.tilesetDocument.replace(payload);this.tileEditor.setPrimaryTile(payload.tiles.find(t=>t.atlasId===prepared.atlasId).id);
  await this.saveTileset({allowPreview:true});
 }
 async saveTileset({allowPreview=false}={}){
  if(this.catalogSaving)return;this.cancel();this.catalogSaving=true;
  const doc=this.tilesetDocument,snapshot=structuredClone(doc.draft),baseHash=doc.sourceHash;
  try{
   const current=await this.sourceClient.getResource('tileset-catalog');if(this.disposed)return;if(current.hash!==baseHash)throw Object.assign(new Error('CONFLICT'),{code:'CONFLICT'});
   let persisted=current;
   for(const atlas of snapshot.atlases){if(persisted.payload.atlases.some(a=>a.id===atlas.id))continue;const image=this.localTileImports.get(atlas.id);if(!image)throw new Error('world.tileset.image.restore');const {pngBase64,sourceName,tilePixels,margin,spacing}=image;
    persisted=await this.sourceClient.importTileset({baseHash:persisted.hash,pngBase64,sourceName,tilePixels,margin,spacing});if(this.disposed)return;doc.acceptSource(persisted.hash,persisted.payload);
   }
   const result=await this.sourceClient.saveTileset({baseHash:persisted.hash,payload:snapshot});if(this.disposed)return;doc.acceptSource(result.hash,snapshot);this.tilesetEditor.status.textContent=t(doc.dirty?'authoring.savedWithDraft':'authoring.tileset.saved');
  }catch(error){if(allowPreview&&error.status===404){this.tilesetEditor.status.textContent=t('authoring.tileset.previewOnly');}else{this.tilesetEditor.status.textContent=t('authoring.tileset.saveFailed');this.reportError(error);}}
  finally{this.catalogSaving=false;}
 }
 async downloadTileImage(atlas){
  const local=this.localTileImports.get(atlas.id);if(local)this.tilesetEditor.download(atlas.imagePath.split('/').at(-1),new Blob([local.bytes],{type:'image/png'}));
  else{const response=await fetch(atlas.imagePath);if(!response.ok)throw new Error('world.tileset.image.missing');this.tilesetEditor.download(atlas.imagePath.split('/').at(-1),await response.blob());}
 }
 dispose(){this.disposed=true;this.cancel();this.tileEditor.dispose();this.tilesetEditor.dispose();this.abort.abort();this.overlayAbort?.abort();this.world.dispose();this.host.replaceChildren();}
}
