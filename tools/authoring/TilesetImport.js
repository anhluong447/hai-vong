import {normalizeTileset} from '../../src/shared/validateTileset.js';
export async function prepareTilesetImport(file,{tilePixels=16,margin=0,spacing=0},catalog){
 if(!file||file.size>8*1024*1024)throw new Error('world.tileset.image.size');
 const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length<33||[137,80,78,71,13,10,26,10].some((b,i)=>bytes[i]!==b))throw new Error('world.tileset.image.png');
 const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width>4096||height>4096)throw new Error('world.tileset.image.dimensions');
 for(let offset=8;offset+12<=bytes.length;){const length=view.getUint32(offset),kind=String.fromCharCode(...bytes.slice(offset+4,offset+8));if(kind==='acTL')throw new Error('world.tileset.image.animated');if(length>bytes.length-offset-12)throw new Error('world.tileset.image.png');offset+=length+12;}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''),sourceName=file.name.replaceAll('\\','/').split('/').at(-1),atlas={id:digest,imagePath:`assets/tilesets/${digest}.png`,sha256:digest,sourceName,imageWidth:width,imageHeight:height,tilePixels,margin,spacing};
 if(![16,24,32,48].includes(tilePixels)||!Number.isInteger(margin)||margin<0||margin>32||!Number.isInteger(spacing)||spacing<0||spacing>32)throw new Error('world.tileset.atlas.grid');
 const cols=(width-2*margin+spacing)/(tilePixels+spacing),rows=(height-2*margin+spacing)/(tilePixels+spacing);if(!Number.isInteger(cols)||cols<1||!Number.isInteger(rows)||rows<1)throw new Error('world.tileset.atlas.grid');
 const payload=normalizeTileset(catalog),existing=payload.atlases.find(a=>a.id===digest);
 if(existing){if(['tilePixels','margin','spacing'].some(k=>existing[k]!==atlas[k]))throw new Error('world.tileset.atlas.layout');}
 else{if(payload.tiles.length+cols*rows>8192)throw new Error('world.tileset.tiles');const start=payload.nextTileId;payload.atlases.push(atlas);for(let i=0;i<cols*rows;i++)payload.tiles.push({id:start+i,atlasId:digest,atlasIndex:i,collision:'none',blockedEdges:[],drawPriority:'below'});payload.nextTileId+=cols*rows;}
 normalizeTileset(payload);
 const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));let image;
 try{image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('world.tileset.image.decode'));img.src=url;});}finally{URL.revokeObjectURL(url);}
 let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
 return{payload,image,atlasId:digest,pngBase64:btoa(binary),sourceName,tilePixels,margin,spacing,bytes};
}
