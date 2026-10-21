import {t} from '../shared/text.js';
export async function loadTileImage(path,atlas){
 let url;
 try{
  const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error('world.tileset.image.missing');
  const bytes=await response.arrayBuffer();
  if(atlas.sha256){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(digest!==atlas.sha256)throw new Error('world.tileset.image.hash');}
  url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('world.tileset.image.decode'));image.src=url;});
 }catch(error){throw new Error(t('error.tilesetImage',{path,code:error.message}));}
 finally{if(url)URL.revokeObjectURL(url);}
}
export async function loadTileImages(catalog,loadImage=loadTileImage){
 const entries=await Promise.all(catalog.atlases.map(async atlas=>{
  if(!/^assets\/(pixel\/tiles\.png|tilesets\/[a-f0-9]{64}\.png)$/.test(atlas.imagePath))throw new Error('world.tileset.image.path');
  const image=await loadImage(atlas.imagePath,atlas);
  if((image.naturalWidth||image.width)!==atlas.imageWidth||(image.naturalHeight||image.height)!==atlas.imageHeight)throw new Error(t('error.tilesetImage',{path:atlas.imagePath,code:'world.tileset.image.dimensions'}));
  return[atlas.id,image];
 }));return new Map(entries);
}
