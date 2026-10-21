import {t} from '../../src/shared/text.js';
import {TILESET,tileDefinition,tileSourceRect,isTerrainBlocked} from '../../content/world/tileset.js';
import {worldMetrics} from '../../content/world/metrics.js';
import {cellPassage} from '../../src/shared/tilePassage.js';
import {PREFABS} from '../../content/maps/scenes-data.js';
import {lineCells,rectangleCells,floodCells} from './TilePaint.js';
const copy=key=>t('authoring.tiles.'+key),tools=['brush','rectangle','fill','eyedropper','eraser'];
export class TileMapEditor{
 constructor(editor){
  this.editor=editor;this.tool='brush';this.primaryTile=2;this.eraseTile=0;this.stroke=null;this.cursor={...editor.document.draft.spawn};this.active=false;this.showGrid=true;this.showCollision=false;this.abort=new AbortController();this.buttons=new Map();this.tiles=new Map();
  const root=editor.root;this.controls=root.querySelector('#tile-controls');
  for(const layer of ['entities','tiles']){const b=this.button(layer,()=>editor.setEditLayer(layer));b.dataset.layer=layer;root.querySelector('#world-layers').append(b);}
  for(const tool of tools){const b=this.button(tool,()=>this.setTool(tool));b.dataset.tileTool=tool;this.buttons.set(tool,b);root.querySelector('#tile-toolbar').append(b);}
  for(const name of ['grid','collision']){const b=this.button(name,()=>{this[name==='grid'?'showGrid':'showCollision']=!this[name==='grid'?'showGrid':'showCollision'];this.refresh();});b.dataset.tileToggle=name;this.buttons.set(name,b);root.querySelector('#tile-toolbar').append(b);}
  this.atlasId=editor.tileCatalog.atlases[0].id;this.rebuildPalette();
  root.querySelector('#tile-erase').addEventListener('change',event=>this.setEraseTile(Number(event.target.value)),{signal:this.abort.signal});
  root.querySelector('#tile-atlas').addEventListener('change',event=>{this.cancel();this.atlasId=event.target.value;this.rebuildPalette();},{signal:this.abort.signal});
  root.querySelector('#tile-search').addEventListener('input',()=>this.rebuildPalette(),{signal:this.abort.signal});
  root.querySelector('#tile-palette').addEventListener('keydown',event=>{const ids=[...this.tiles.keys()],index=ids.indexOf(Number(event.target.closest('[data-tile-id]')?.dataset.tileId)),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[event.key];if(index>=0&&delta){event.preventDefault();event.stopPropagation();const id=ids[Math.max(0,Math.min(ids.length-1,index+delta))];this.setPrimaryTile(id);this.tiles.get(id)?.button.focus();}},{signal:this.abort.signal});
  this.cameras=new Map();const signal=this.abort.signal;
  window.addEventListener('blur',()=>{this.space=false;this.cancel();},{signal});
  window.addEventListener('keyup',event=>{if(event.code==='Space'||event.key===' '){this.space=false;if(this.pan)this.cancel();}},{signal});
 }
 get catalog(){return this.editor.tileCatalog||TILESET;}
 tileLabel(tile){return tile.editorName|| (tile.labelKey?t(tile.labelKey):t('authoring.tileset.tileId',{id:tile.id}));}
 rebuildPalette(){
  const root=this.editor.root,palette=root.querySelector('#tile-palette'),erase=root.querySelector('#tile-erase'),atlasSelect=root.querySelector('#tile-atlas'),catalog=this.catalog,search=(root.querySelector('#tile-search').value||'').toLowerCase();
  if(!catalog.atlases.some(a=>a.id===this.atlasId))this.atlasId=catalog.atlases[0].id;
  if(!catalog.tiles.some(t=>t.id===this.primaryTile))this.primaryTile=catalog.tiles[0].id;
  palette.replaceChildren();erase.replaceChildren();atlasSelect.replaceChildren();this.tiles.clear();this.paletteRevision=-1;
  for(const atlas of catalog.atlases){const option=document.createElement('option');option.value=atlas.id;option.textContent=atlas.sourceName;atlasSelect.append(option);}atlasSelect.value=this.atlasId;
  for(const tile of catalog.tiles){const label=this.tileLabel(tile),option=document.createElement('option');option.value=tile.id;option.textContent=label;erase.append(option);
   if(tile.atlasId!==this.atlasId||(!label.toLowerCase().includes(search)&&!String(tile.id).includes(search)))continue;
   const button=document.createElement('button'),canvas=document.createElement('canvas'),span=document.createElement('span');button.type='button';canvas.width=canvas.height=worldMetrics.tilePixels;canvas.setAttribute('aria-hidden','true');span.textContent=label;button.append(canvas,span);button.dataset.tileId=tile.id;button.setAttribute('aria-label',t('authoring.tiles.tileLabel',{name:label,id:tile.id,kind:copy(tile.collision==='solid'?'blocked':'walkable')}));button.title=button.getAttribute('aria-label');
   button.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey){const ids=new Set(this.editor.tilesetEditor.selected);ids.has(tile.id)?ids.delete(tile.id):ids.add(tile.id);this.editor.tilesetEditor.select(ids.size?[...ids]:[tile.id]);}else this.setPrimaryTile(tile.id);});palette.append(button);this.tiles.set(tile.id,{button,canvas});
  }
  if(this.editor.world)this.refresh();
 }
 button(key,action){const b=document.createElement('button');b.type='button';if(key)b.textContent=copy(key);b.addEventListener('click',action,{signal:this.abort.signal});return b;}
 setActive(active){const changed=this.active!==active;if(changed)this.cancel();this.active=active;if(active&&!this.activated){this.activated=true;if(this.editor.world?.ready)this.ensureCursorVisible();}this.refresh();}
 setTool(tool){if(!tools.includes(tool))throw new RangeError('world.tile.tool');this.cancel();this.tool=tool;this.refresh();}
 setPrimaryTile(id){const tile=tileDefinition(id,this.catalog);this.cancel();this.primaryTile=id;if(tile.atlasId!==this.atlasId){this.atlasId=tile.atlasId;this.rebuildPalette();}this.editor.tilesetEditor?.select([id]);this.refresh();}
 setEraseTile(id){tileDefinition(id,this.catalog);this.cancel();this.eraseTile=id;this.refresh();}
 valid(p){const scene=this.editor.document.draft;return p.x>=0&&p.y>=0&&p.x<scene.width&&p.y<scene.height;}
 insideCanvas(event){const r=this.editor.world.canvas.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<r.right&&event.clientY>=r.top&&event.clientY<r.bottom;}
 refresh(){
  const e=this.editor;this.controls.hidden=e.editLayer!=='tiles';e.root.querySelector('#entity-controls').hidden=e.editLayer==='tiles';e.root.querySelector('#world-inspector').hidden=e.editLayer==='tiles';e.root.querySelector('#tile-help').hidden=e.editLayer!=='tiles';
  e.root.querySelector('#tileset-inspector').hidden=e.editLayer!=='tiles'||e.mode!=='edit';
  e.root.querySelector('#world-inspector-heading').textContent=e.editLayer==='tiles'?copy('inspector'):t('authoring.world.inspector');
  for(const b of e.root.querySelectorAll('[data-layer]'))b.setAttribute('aria-pressed',String(b.dataset.layer===e.editLayer));
  for(const [key,b]of this.buttons){b.disabled=!this.active;b.setAttribute('aria-pressed',String(key==='grid'?this.showGrid:key==='collision'?this.showCollision:key===this.tool));}
  for(const [id,{button}]of this.tiles){button.disabled=!this.active;button.setAttribute('aria-pressed',String(id===this.primaryTile));}
  e.root.querySelector('#tile-erase').disabled=!this.active;e.root.querySelector('#tile-erase').value=this.eraseTile;
 }
 hint(){return t('authoring.tiles.canvasHint',{tool:copy(this.tool)});}
 paintPalette(){const world=this.editor.world;if(!world?.ready||this.paletteRevision===world.tileRevision)return;this.paletteRevision=world.tileRevision;
  for(const [id,{canvas}]of this.tiles){const r=tileSourceRect(id,this.catalog),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(world.tileImages.get(r.atlasId),r.x,r.y,r.width,r.height,0,0,canvas.width,canvas.height);}
 }
 add(cells){const s=this.stroke;for(const p of cells)if(this.valid(p))s.edits.set(p.y*this.editor.document.draft.width+p.x,{...p,tile:s.tile});}
 handlePointerDown(event){
  if(!this.active)return false;if(event.button!==0||this.stroke||this.pan)return true;event.preventDefault();const e=this.editor,p=e.point(event);e.overlay.focus();
  if(this.space){this.pan={pointerId:event.pointerId,node:e.overlay,x:event.clientX,y:event.clientY,camera:{...e.world.camera}};e.overlay.setPointerCapture(event.pointerId);return true;}
  if(!this.valid(p)||!this.insideCanvas(event))return true;this.cursor=p;
  if(this.tool==='eyedropper'){this.setPrimaryTile(e.document.draft.tiles[p.y][p.x]);this.setTool('brush');return true;}
  this.stroke={document:e.document,pointerId:event.pointerId,node:e.overlay,start:p,previous:p,tile:this.tool==='eraser'?this.eraseTile:this.primaryTile,edits:new Map()};
  if(this.tool==='fill'){if(e.document.draft.tiles[p.y][p.x]!==this.primaryTile)this.add(floodCells(e.document.draft.tiles,p));}else this.add([p]);
  e.overlay.setPointerCapture(event.pointerId);return true;
 }
 handlePointerMove(event){
  if(!this.active)return false;
  if(this.pan){if(this.pan.pointerId===event.pointerId){const world=this.editor.world,ratio=world.canvas.getBoundingClientRect().width/world.canvas.width;world.setEditorCamera({x:this.pan.camera.x-(event.clientX-this.pan.x)/ratio,y:this.pan.camera.y-(event.clientY-this.pan.y)/ratio});}return true;}
  const p=this.editor.point(event),inside=this.insideCanvas(event);if(inside&&this.valid(p)&&(!this.stroke||this.stroke.pointerId===event.pointerId))this.cursor=p;
  const s=this.stroke;if(!s||s.pointerId!==event.pointerId)return true;
  if(s.document!==this.editor.document){this.cancel();return true;}
  if(this.tool==='rectangle'){s.edits.clear();this.add(rectangleCells(s.start,p,this.editor.document.draft));}
  else if(this.tool!=='fill'){if(inside&&this.valid(p)){this.add(s.previous?lineCells(s.previous,p):[p]);s.previous=p;}else s.previous=null;}
  return true;
 }
 handlePointerUp(event){if(!this.active)return false;if(this.pan?.pointerId===event.pointerId){const pan=this.pan;this.pan=null;this.release(pan);}else if(this.stroke?.pointerId===event.pointerId){this.handlePointerMove(event);this.commit();}return true;}
 release(s){if(s?.node?.hasPointerCapture(s.pointerId))s.node.releasePointerCapture(s.pointerId);}
 cancel(){const s=this.stroke,pan=this.pan;this.stroke=null;this.pan=null;this.release(s);this.release(pan);}
 commit(){const s=this.stroke;if(!s)return;this.stroke=null;this.release(s);if(s.document!==this.editor.document)return;
  try{s.document.applyTileEdits([...s.edits.values()]);}catch{this.editor.status.textContent=copy('invalid');}
 }
 handleKey(event){
  if(!this.active)return false;
  if(event.key==='Escape'&&(this.stroke||this.pan)){event.preventDefault();this.cancel();return true;}
  if(event.target!==this.editor.overlay)return false;
  const key=event.key.toLowerCase();
  if(event.ctrlKey||event.metaKey){if(key==='z'){event.preventDefault();this.cancel();event.shiftKey?this.editor.document.redo():this.editor.document.undo();return true;}return false;}
  if(event.altKey)return false;
  if(event.code==='Space'||event.key===' '){event.preventDefault();this.space=true;return true;}
  const tool={b:'brush',r:'rectangle',f:'fill',i:'eyedropper',e:'eraser'}[key];
  if(tool){event.preventDefault();this.setTool(tool);return true;}
  if(key==='g'||key==='c'){event.preventDefault();this[key==='g'?'showGrid':'showCollision']=!this[key==='g'?'showGrid':'showCollision'];this.refresh();return true;}
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(delta){event.preventDefault();if(this.stroke&&this.stroke.pointerId!==null)return true;const step=event.shiftKey?5:1,s=this.editor.document.draft;this.cursor={x:Math.max(0,Math.min(s.width-1,this.cursor.x+delta[0]*step)),y:Math.max(0,Math.min(s.height-1,this.cursor.y+delta[1]*step))};
   if(this.stroke){this.stroke.edits.clear();this.add(rectangleCells(this.stroke.start,this.cursor,s));}this.ensureCursorVisible();return true;
  }
  if(event.key==='Enter'){
   event.preventDefault();if(event.repeat)return true;if(this.stroke){if(this.stroke.pointerId===null)this.commit();return true;}
   if(this.tool==='eyedropper'){this.setPrimaryTile(this.editor.document.draft.tiles[this.cursor.y][this.cursor.x]);this.setTool('brush');return true;}
   this.stroke={document:this.editor.document,pointerId:null,node:null,start:{...this.cursor},tile:this.tool==='eraser'?this.eraseTile:this.primaryTile,edits:new Map()};
   if(this.tool==='fill'){if(this.editor.document.draft.tiles[this.cursor.y][this.cursor.x]!==this.primaryTile)this.add(floodCells(this.editor.document.draft.tiles,this.cursor));}else this.add([this.cursor]);
   if(this.tool!=='rectangle')this.commit();return true;
  }
  return false;
 }
 saveCamera(){if(this.editor.mode==='edit')this.cameras.set(this.editor.mapId,{...this.editor.world.camera});}
 restoreCamera(){this.editor.world.setEditorCamera(this.cameras.get(this.editor.mapId)??null);}
 enterMap(){this.cursor={...this.editor.document.draft.spawn};if(this.editor.mode==='edit')this.restoreCamera();}
 panBy(dxPx,dyPx){const world=this.editor.world;world.setEditorCamera({x:world.camera.x+dxPx,y:world.camera.y+dyPx});}
 ensureCursorVisible(){const world=this.editor.world,size=worldMetrics.tilePixels;let {x,y}=world.camera;const left=this.cursor.x*size,top=this.cursor.y*size;if(left<x)x=left;else if(left+size>x+world.canvas.width)x=left+size-world.canvas.width;if(top<y)y=top;else if(top+size>y+world.canvas.height)y=top+size-world.canvas.height;world.setEditorCamera({x,y});}
 draw(ctx,world){
  this.paintPalette();if(!this.active)return;const size=worldMetrics.tilePixels,scene=this.editor.document.draft,left=Math.max(0,Math.floor(world.camera.x/size)),top=Math.max(0,Math.floor(world.camera.y/size)),right=Math.min(scene.width,Math.ceil((world.camera.x+world.canvas.width)/size)),bottom=Math.min(scene.height,Math.ceil((world.camera.y+world.canvas.height)/size));
  if(this.showCollision){ctx.fillStyle='#ed6f6a77';for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(cellPassage(scene,x,y,this.catalog).blocked)ctx.fillRect(x*size-world.camera.x,y*size-world.camera.y,size,size);
   for(const instance of [...scene.objects,...scene.npcs]){const o={...PREFABS[instance.prefab],...instance.overrides};if(o.solid)for(const [dx,dy]of o.footprint||[[0,0]])ctx.fillRect((instance.x+dx)*size-world.camera.x,(instance.y+dy)*size-world.camera.y,size,size);}
  }
  ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.78;
  for(const p of this.stroke?.edits.values()??[]){if(p.x<left||p.x>=right||p.y<top||p.y>=bottom)continue;const r=tileSourceRect(p.tile,this.catalog);ctx.drawImage(world.tileImages.get(r.atlasId),r.x,r.y,r.width,r.height,p.x*size-world.camera.x,p.y*size-world.camera.y,size,size);}
  ctx.globalAlpha=1;ctx.strokeStyle='#ffe29a';ctx.lineWidth=1;ctx.strokeRect(this.cursor.x*size-world.camera.x+.5,this.cursor.y*size-world.camera.y+.5,size-1,size-1);
 }
 dispose(){this.cancel();this.abort.abort();}
}
