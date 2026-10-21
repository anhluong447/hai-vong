const edges=['up','right','down','left'],hash=/^[a-f0-9]{64}$/;
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const fail=code=>{throw new Error(`world.tileset.${code}`);};
const require=(condition,code)=>{if(!condition)fail(code);};
const keys=(object,required,optional=[])=>object&&typeof object==='object'&&!Array.isArray(object)&&required.every(k=>Object.hasOwn(object,k))&&Object.keys(object).every(k=>[...required,...optional].includes(k));
export function normalizeTileset(source,legacyAtlas,{textKeys=null}={}){
 let candidate=structuredClone(source);
 if(candidate?.schemaVersion===1){
  require(keys(candidate,['schemaVersion','assetId','tilePixels','columns','count','tiles']),'fields');
  require(candidate.assetId==='pixel.tiles'&&candidate.tilePixels===16&&candidate.columns===8&&candidate.count===16,'atlas');
  if(legacyAtlas)require(legacyAtlas.tileSize===16&&legacyAtlas.tiles.columns===8&&legacyAtlas.tiles.count===16,'atlas');
  require(Array.isArray(candidate.tiles)&&candidate.tiles.length===16,'tiles');
  for(const [i,t] of candidate.tiles.entries())require(keys(t,['id','atlasIndex','labelKey','blocked'])&&t.id===i&&Number.isInteger(t.id)&&t.atlasIndex===i&&typeof t.blocked==='boolean'&&typeof t.labelKey==='string','tile');
  candidate={schemaVersion:2,nextTileId:16,atlases:[{id:'pixel.tiles',imagePath:`assets/pixel/${legacyAtlas?.tiles.file||'tiles.png'}`,sha256:null,sourceName:legacyAtlas?.tiles.file||'tiles.png',imageWidth:128,imageHeight:32,tilePixels:16,margin:0,spacing:0}],tiles:candidate.tiles.map(t=>({id:t.id,atlasId:'pixel.tiles',atlasIndex:t.atlasIndex,labelKey:t.labelKey,collision:t.blocked?'solid':'none',blockedEdges:[],drawPriority:'below'}))};
 }
 require(keys(candidate,['schemaVersion','nextTileId','atlases','tiles'])&&candidate.schemaVersion===2,'fields');
 require(Array.isArray(candidate.atlases)&&candidate.atlases.length>0&&candidate.atlases.length<=8192,'atlases');
 const atlases=new Map();
 for(const a of candidate.atlases){
  require(keys(a,['id','imagePath','sha256','sourceName','imageWidth','imageHeight','tilePixels','margin','spacing']),'atlas.fields');
  require(typeof a.id==='string'&&!atlases.has(a.id),'atlas.id');
  const legacy=a.id==='pixel.tiles';
  require(legacy?a.imagePath==='assets/pixel/tiles.png'&&a.sha256===null:hash.test(a.sha256)&&a.id===a.sha256&&a.imagePath===`assets/tilesets/${a.sha256}.png`,'atlas.path');
  require(typeof a.sourceName==='string'&&a.sourceName.length>0&&a.sourceName.length<=255,'atlas.name');
  require(integer(a.imageWidth,1,4096)&&integer(a.imageHeight,1,4096)&&[16,24,32,48].includes(a.tilePixels)&&integer(a.margin,0,32)&&integer(a.spacing,0,32),'atlas.grid');
  const cols=(a.imageWidth-2*a.margin+a.spacing)/(a.tilePixels+a.spacing),rows=(a.imageHeight-2*a.margin+a.spacing)/(a.tilePixels+a.spacing);
  require(Number.isInteger(cols)&&cols>0&&Number.isInteger(rows)&&rows>0,'atlas.grid');
  atlases.set(a.id,{count:cols*rows});
 }
 require(Array.isArray(candidate.tiles)&&candidate.tiles.length>0&&candidate.tiles.length<=8192,'tiles');
 const ids=new Set(),placements=new Set();
 for(const t of candidate.tiles){
  require(keys(t,['id','atlasId','atlasIndex','collision','blockedEdges','drawPriority'],['labelKey','editorName']),'tile.fields');
  require(integer(t.id,0,Number.MAX_SAFE_INTEGER)&&!ids.has(t.id),'tile.id');ids.add(t.id);
  require(atlases.has(t.atlasId)&&integer(t.atlasIndex,0,atlases.get(t.atlasId).count-1),'tile.atlas');
  const placement=`${t.atlasId}:${t.atlasIndex}`;require(!placements.has(placement),'tile.duplicate');placements.add(placement);
  require(['none','solid'].includes(t.collision)&&['below','above'].includes(t.drawPriority),'tile.properties');
  require(Array.isArray(t.blockedEdges)&&t.blockedEdges.every(e=>edges.includes(e))&&new Set(t.blockedEdges).size===t.blockedEdges.length,'tile.edges');
  if(Object.hasOwn(t,'labelKey'))require(typeof t.labelKey==='string'&&(!textKeys||textKeys.includes(t.labelKey)),'tile.label');
  if(Object.hasOwn(t,'editorName'))require(typeof t.editorName==='string'&&t.editorName.length<=120,'tile.name');
 }
 require(integer(candidate.nextTileId,0,Number.MAX_SAFE_INTEGER)&&candidate.tiles.every(t=>t.id<candidate.nextTileId),'nextTileId');
 return candidate;
}
