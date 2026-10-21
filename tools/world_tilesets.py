"""Pure tile catalog, grid and placement contracts shared with browser validation."""
import copy
import re

EDGES = ('up', 'right', 'down', 'left')
LAYER_IDS = tuple(f'layer-{i}' for i in range(1, 5))


def require(value, code):
    if not value: raise ValueError(f'world.tileset.{code}')


def integer(value, minimum=0, maximum=9007199254740991):
    return type(value) is int and minimum <= value <= maximum


def keys(value, required, optional=()):
    return isinstance(value, dict) and set(required).issubset(value) and set(value).issubset(set(required) | set(optional))


def normalize_tileset(source, legacy_atlas=None, text_keys=None):
    c = copy.deepcopy(source)
    require(isinstance(c,dict) and type(c.get('schemaVersion')) is int,'schemaVersion')
    if isinstance(c, dict) and c.get('schemaVersion') == 1:
        require(keys(c, ('schemaVersion','assetId','tilePixels','columns','count','tiles')), 'fields')
        require(c['assetId']=='pixel.tiles' and type(c['tilePixels']) is int and c['tilePixels']==16 and c['columns']==8 and c['count']==16, 'atlas')
        if legacy_atlas: require(legacy_atlas['tileSize']==16 and legacy_atlas['tiles']['columns']==8 and legacy_atlas['tiles']['count']==16, 'atlas')
        require(isinstance(c['tiles'],list) and len(c['tiles'])==16, 'tiles')
        for i,t in enumerate(c['tiles']):
            require(keys(t,('id','atlasIndex','labelKey','blocked')) and integer(t['id']) and t['id']==i and type(t['atlasIndex']) is int and t['atlasIndex']==i and type(t['blocked']) is bool and isinstance(t['labelKey'],str), 'tile')
        filename=legacy_atlas['tiles']['file'] if legacy_atlas else 'tiles.png'
        c={'schemaVersion':2,'nextTileId':16,'atlases':[{'id':'pixel.tiles','imagePath':f'assets/pixel/{filename}','sha256':None,'sourceName':filename,'imageWidth':128,'imageHeight':32,'tilePixels':16,'margin':0,'spacing':0}], 'tiles':[{'id':t['id'],'atlasId':'pixel.tiles','atlasIndex':t['atlasIndex'],'labelKey':t['labelKey'],'collision':'solid' if t['blocked'] else 'none','blockedEdges':[],'drawPriority':'below'} for t in c['tiles']]}
    require(keys(c,('schemaVersion','nextTileId','atlases','tiles')) and type(c['schemaVersion']) is int and c['schemaVersion']==2,'fields')
    require(isinstance(c['atlases'],list) and 0<len(c['atlases'])<=8192,'atlases')
    atlases={}
    for a in c['atlases']:
        require(keys(a,('id','imagePath','sha256','sourceName','imageWidth','imageHeight','tilePixels','margin','spacing')),'atlas.fields')
        require(isinstance(a['id'],str) and a['id'] not in atlases,'atlas.id')
        require((a['imagePath']=='assets/pixel/tiles.png' and a['sha256'] is None) if a['id']=='pixel.tiles' else isinstance(a['sha256'],str) and bool(re.fullmatch('[a-f0-9]{64}',a['sha256'])) and a['id']==a['sha256'] and a['imagePath']==f"assets/tilesets/{a['sha256']}.png",'atlas.path')
        require(isinstance(a['sourceName'],str) and 0<len(a['sourceName'])<=255,'atlas.name')
        require(integer(a['imageWidth'],1,4096) and integer(a['imageHeight'],1,4096) and type(a['tilePixels']) is int and a['tilePixels'] in (16,24,32,48) and integer(a['margin'],0,32) and integer(a['spacing'],0,32),'atlas.grid')
        cols=(a['imageWidth']-2*a['margin']+a['spacing'])/(a['tilePixels']+a['spacing']); rows=(a['imageHeight']-2*a['margin']+a['spacing'])/(a['tilePixels']+a['spacing'])
        require(cols.is_integer() and cols>0 and rows.is_integer() and rows>0,'atlas.grid'); atlases[a['id']]=int(cols*rows)
    require(isinstance(c['tiles'],list) and 0<len(c['tiles'])<=8192,'tiles')
    ids=set(); placements=set()
    for t in c['tiles']:
        require(keys(t,('id','atlasId','atlasIndex','collision','blockedEdges','drawPriority'),('labelKey','editorName')),'tile.fields')
        require(integer(t['id']) and t['id'] not in ids,'tile.id'); ids.add(t['id'])
        require(isinstance(t['atlasId'],str) and t['atlasId'] in atlases and integer(t['atlasIndex'],0,atlases[t['atlasId']]-1),'tile.atlas')
        placement=(t['atlasId'],t['atlasIndex']); require(placement not in placements,'tile.duplicate'); placements.add(placement)
        require(t['collision'] in ('none','solid') and t['drawPriority'] in ('below','above'),'tile.properties')
        require(isinstance(t['blockedEdges'],list) and all(e in EDGES for e in t['blockedEdges']) and len(set(t['blockedEdges']))==len(t['blockedEdges']),'tile.edges')
        if 'labelKey' in t: require(isinstance(t['labelKey'],str) and (text_keys is None or t['labelKey'] in text_keys),'tile.label')
        if 'editorName' in t: require(isinstance(t['editorName'],str) and len(t['editorName'])<=120,'tile.name')
    require(integer(c['nextTileId']) and all(i<c['nextTileId'] for i in ids),'nextTileId')
    return c


def tile_source_rect(tile_id, catalog):
    tile=next((t for t in catalog['tiles'] if type(tile_id) is int and t['id']==tile_id),None)
    require(tile is not None,'unknown')
    a=next(a for a in catalog['atlases'] if a['id']==tile['atlasId']); step=a['tilePixels']+a['spacing']; columns=(a['imageWidth']-2*a['margin']+a['spacing'])//step
    return {'atlasId':a['id'],'x':a['margin']+(tile['atlasIndex']%columns)*step,'y':a['margin']+(tile['atlasIndex']//columns)*step,'width':a['tilePixels'],'height':a['tilePixels']}


def normalize_tile_layers(scene):
    def check(value):
        if not value: raise ValueError('world.scene.layers')
    check(isinstance(scene,dict) and type(scene.get('schemaVersion')) is int and integer(scene.get('width'),1,256) and integer(scene.get('height'),1,256))
    if scene.get('schemaVersion')==1 and 'tiles' in scene and 'layers' not in scene:
        layers=[{'id':lid,'tiles':scene['tiles'] if i==0 else [[None]*scene['width'] for _ in range(scene['height'])]} for i,lid in enumerate(LAYER_IDS)]
    else:
        check(scene.get('schemaVersion')==2 and 'tiles' not in scene); layers=scene.get('layers')
    check(isinstance(layers,list) and len(layers)==4)
    for i,layer in enumerate(layers):
        check(keys(layer,('id','tiles')) and layer['id']==LAYER_IDS[i] and isinstance(layer['tiles'],list) and len(layer['tiles'])==scene['height'])
        check(all(isinstance(row,list) and len(row)==scene['width'] and all((i>0 and t is None) or integer(t) for t in row) for row in layer['tiles']))
    return copy.deepcopy(layers)


def cell_passage(scene, x, y, catalog):
    if not integer(x,0,scene['width']-1) or not integer(y,0,scene['height']-1):
        return {'blocked':True,'blockedEdges':list(EDGES)}
    tiles={t['id']:t for t in catalog['tiles']}; blocked=False; edges=set()
    for layer in scene.get('layers',[{'tiles':scene.get('tiles')}]):
        value=layer['tiles'][y][x]
        if value is None: continue
        require(type(value) is int and value in tiles,'unknown'); tile=tiles[value]
        blocked |= tile['collision']=='solid';edges.update(tile['blockedEdges'])
    return {'blocked':blocked,'blockedEdges':[e for e in EDGES if e in edges]}
