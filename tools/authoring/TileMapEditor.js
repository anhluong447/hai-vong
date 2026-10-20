import {t} from '../../src/shared/text.js';
import {TILESET,tileDefinition,tileSourceRect,isTerrainBlocked} from '../../content/world/tileset.js';
import {PREFABS} from '../../content/maps/scenes-data.js';
import {lineCells,rectangleCells,floodCells} from './TilePaint.js';
const copy=key=>t('authoring.tiles.'+key),tools=['brush','rectangle','fill','eyedropper','eraser'];
export class TileMapEditor{
 constructor(editor){
  this.editor=editor;this.tool='brush';this.primaryTile=2;this.eraseTile=0;this.stroke=null;this.cursor={x:0,y:0};this.active=false;this.showGrid=true;this.showCollision=false;this.abort=new AbortController();this.buttons=new Map();this.tiles=new Map();
  const root=editor.root;this.controls=root.querySelector('#tile-controls');
  for(const layer of ['entities','tiles']){const b=this.button(layer,()=>editor.setEditLayer(layer));b.dataset.layer=layer;root.querySelector('#world-layers').append(b);}
  for(const tool of tools){const b=this.button(tool,()=>this.setTool(tool));b.dataset.tileTool=tool;this.buttons.set(tool,b);root.querySelector('#tile-toolbar').append(b);}
  for(const name of ['grid','collision']){const b=this.button(name,()=>{this[name==='grid'?'showGrid':'showCollision']=!this[name==='grid'?'showGrid':'showCollision'];this.refresh();});b.dataset.tileToggle=name;this.buttons.set(name,b);root.querySelector('#tile-toolbar').append(b);}
  const palette=root.querySelector('#tile-palette'),erase=root.querySelector('#tile-erase');
  for(const tile of TILESET.tiles){const b=this.button('',()=>this.setPrimaryTile(tile.id)),canvas=document.createElement('canvas'),label=document.createElement('span');canvas.width=canvas.height=TILESET.tilePixels;canvas.setAttribute('aria-hidden','true');label.textContent=t(tile.labelKey);b.replaceChildren(canvas,label);b.dataset.tileId=tile.id;b.setAttribute('aria-label',t('authoring.tiles.tileLabel',{name:t(tile.labelKey),id:tile.id,kind:copy(tile.blocked?'blocked':'walkable')}));b.title=b.getAttribute('aria-label');palette.append(b);this.tiles.set(tile.id,{button:b,canvas});
   const option=document.createElement('option');option.value=tile.id;option.textContent=t(tile.labelKey);erase.append(option);
  }
  erase.value=this.eraseTile;erase.addEventListener('change',()=>this.setEraseTile(Number(erase.value)),{signal:this.abort.signal});
 }
 button(key,action){const b=document.createElement('button');b.type='button';if(key)b.textContent=copy(key);b.addEventListener('click',action,{signal:this.abort.signal});return b;}
 setActive(active){if(this.active!==active)this.cancel();this.active=active;this.refresh();}
 setTool(tool){if(!tools.includes(tool))throw new RangeError('world.tile.tool');this.cancel();this.tool=tool;this.refresh();}
 setPrimaryTile(id){tileDefinition(id);this.cancel();this.primaryTile=id;this.refresh();}
 setEraseTile(id){tileDefinition(id);this.cancel();this.eraseTile=id;this.refresh();}
 valid(p){const scene=this.editor.document.draft;return p.x>=0&&p.y>=0&&p.x<scene.width&&p.y<scene.height;}
 refresh(){
  const e=this.editor;this.controls.hidden=e.editLayer!=='tiles';e.root.querySelector('#entity-controls').hidden=e.editLayer==='tiles';e.root.querySelector('#world-inspector').hidden=e.editLayer==='tiles';e.root.querySelector('#tile-help').hidden=e.editLayer!=='tiles';
  for(const b of e.root.querySelectorAll('[data-layer]'))b.setAttribute('aria-pressed',String(b.dataset.layer===e.editLayer));
  for(const [key,b]of this.buttons){b.disabled=!this.active;b.setAttribute('aria-pressed',String(key==='grid'?this.showGrid:key==='collision'?this.showCollision:key===this.tool));}
  for(const [id,{button}]of this.tiles){button.disabled=!this.active;button.setAttribute('aria-pressed',String(id===this.primaryTile));}
  e.root.querySelector('#tile-erase').disabled=!this.active;e.root.querySelector('#tile-erase').value=this.eraseTile;
 }
 paintPalette(){if(!this.editor.world?.ready||this.paletteImage===this.editor.world.tiles)return;this.paletteImage=this.editor.world.tiles;
  for(const [id,{canvas}]of this.tiles){const r=tileSourceRect(id),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(this.paletteImage,r.x,r.y,r.width,r.height,0,0,canvas.width,canvas.height);}
 }
 add(cells){const s=this.stroke;for(const p of cells)if(this.valid(p))s.edits.set(p.y*this.editor.document.draft.width+p.x,{...p,tile:s.tile});}
 handlePointerDown(event){
  if(!this.active)return false;if(event.button!==0||this.stroke)return true;event.preventDefault();const e=this.editor,p=e.point(event);e.overlay.focus();if(!this.valid(p))return true;this.cursor=p;
  if(this.tool==='eyedropper'){this.setPrimaryTile(e.document.draft.tiles[p.y][p.x]);this.setTool('brush');return true;}
  this.stroke={document:e.document,pointerId:event.pointerId,node:e.overlay,start:p,previous:p,tile:this.tool==='eraser'?this.eraseTile:this.primaryTile,edits:new Map()};
  if(this.tool==='fill'){if(e.document.draft.tiles[p.y][p.x]!==this.primaryTile)this.add(floodCells(e.document.draft.tiles,p));}else this.add([p]);
  e.overlay.setPointerCapture(event.pointerId);return true;
 }
 handlePointerMove(event){
  if(!this.active)return false;const p=this.editor.point(event);if(this.valid(p))this.cursor=p;
  const s=this.stroke;if(!s||s.pointerId!==event.pointerId)return true;
  if(s.document!==this.editor.document){this.cancel();return true;}
  if(this.tool==='rectangle'){s.edits.clear();this.add(rectangleCells(s.start,p,this.editor.document.draft));}
  else if(this.tool!=='fill'){if(this.valid(p)){this.add(s.previous?lineCells(s.previous,p):[p]);s.previous=p;}else s.previous=null;}
  return true;
 }
 handlePointerUp(event){if(!this.active)return false;if(this.stroke?.pointerId===event.pointerId)this.commit();return true;}
 release(s){if(s?.node?.hasPointerCapture(s.pointerId))s.node.releasePointerCapture(s.pointerId);}
 cancel(){const s=this.stroke;this.stroke=null;this.release(s);}
 commit(){const s=this.stroke;if(!s)return;this.stroke=null;this.release(s);if(s.document!==this.editor.document)return;
  try{s.document.applyTileEdits([...s.edits.values()]);}catch{this.editor.status.textContent=copy('invalid');}
 }
 handleKey(){return false;}
 draw(ctx,world){
  this.paintPalette();if(!this.active)return;const size=TILESET.tilePixels,scene=this.editor.document.draft,left=Math.max(0,Math.floor(world.camera.x/size)),top=Math.max(0,Math.floor(world.camera.y/size)),right=Math.min(scene.width,Math.ceil((world.camera.x+world.canvas.width)/size)),bottom=Math.min(scene.height,Math.ceil((world.camera.y+world.canvas.height)/size));
  if(this.showCollision){ctx.fillStyle='#ed6f6a77';for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(isTerrainBlocked(scene.tiles[y][x]))ctx.fillRect(x*size-world.camera.x,y*size-world.camera.y,size,size);
   for(const instance of [...scene.objects,...scene.npcs]){const o={...PREFABS[instance.prefab],...instance.overrides};if(o.solid)for(const [dx,dy]of o.footprint||[[0,0]])ctx.fillRect((instance.x+dx)*size-world.camera.x,(instance.y+dy)*size-world.camera.y,size,size);}
  }
  ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.78;
  for(const p of this.stroke?.edits.values()??[]){if(p.x<left||p.x>=right||p.y<top||p.y>=bottom)continue;const r=tileSourceRect(p.tile);ctx.drawImage(world.tiles,r.x,r.y,r.width,r.height,p.x*size-world.camera.x,p.y*size-world.camera.y,size,size);}
  ctx.globalAlpha=1;ctx.strokeStyle='#ffe29a';ctx.lineWidth=1;ctx.strokeRect(this.cursor.x*size-world.camera.x+.5,this.cursor.y*size-world.camera.y+.5,size-1,size-1);
 }
 dispose(){this.cancel();this.abort.abort();}
}
