export function validateAssetPack(candidate,knownRefs={}){
 const require=(ok,path)=>{if(!ok)throw new Error(`asset.pack.${path}`);};
 require(candidate&&candidate.schemaVersion===1&&Array.isArray(candidate.assets),'schemaVersion');const ids=new Set();
 for(const [index,asset] of candidate.assets.entries()){
  const path=`assets.${index}`;require(typeof asset.id==='string'&&!ids.has(asset.id),`${path}.id`);ids.add(asset.id);
  require(typeof asset.path==='string'&&asset.path.startsWith('assets/')&&!asset.path.includes('..')&&!asset.path.includes('archive/'),`${path}.path`);
  if(knownRefs.paths)require(knownRefs.paths.includes(asset.path),`${path}.missingPath`);
  require(typeof asset.sha256==='string'&&/^[a-f\d]{64}$/i.test(asset.sha256),`${path}.sha256`);
  if(asset.framePx){require(['width','height'].every(k=>Number.isInteger(asset.framePx[k])&&asset.framePx[k]>0),`${path}.framePx`);require(asset.pivotUnit==='pixel'&&asset.pivotPx&&['x','y'].every(k=>Number.isFinite(asset.pivotPx[k])),`${path}.pivotPx`);if(asset.regionPx)require(asset.regionPx.x>=0&&asset.regionPx.y>=0&&asset.regionPx.x+asset.framePx.width<=asset.imagePx.width&&asset.regionPx.y+asset.framePx.height<=asset.imagePx.height,`${path}.regionPx`);}
  for(const ref of asset.references||[])if(knownRefs.ids)require(knownRefs.ids.includes(ref),`${path}.reference`);
 }
 return JSON.parse(JSON.stringify(candidate));
}
