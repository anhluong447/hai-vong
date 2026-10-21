"""Fixed-path tileset imports and recoverable catalog/generated publication."""
import base64
import binascii
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
from PIL import Image, UnidentifiedImageError
from .authoring_write import AuthoringError, _encode, _safe_json
from .world_tilesets import normalize_tileset
from . import build_world_scenes

CATALOG='content/world/tileset.json'
GENERATED='content/maps/scenes-data.js'
JOURNAL='tmp/authoring-transactions/tileset.json'
MAX_IMPORT_BODY=12*1024*1024
MAX_CATALOG_BODY=4*1024*1024
MAX_PNG=8*1024*1024


class TilesetWriter:
    def __init__(self,root,lock):
        self.root=Path(root).resolve(strict=True);self.lock=lock

    def _path(self,relative,create=False):
        path=self.root/relative
        try:path.resolve().relative_to(self.root)
        except (OSError,ValueError):raise AuthoringError('UNSAFE_PATH',403) from None
        current=self.root
        for part in Path(relative).parts:
            current=current/part
            if current.is_symlink() or (hasattr(current,'is_junction') and current.is_junction()):raise AuthoringError('UNSAFE_PATH',403)
        if create:path.parent.mkdir(parents=True,exist_ok=True)
        return path

    def _replace(self,path,data):
        relative=path.relative_to(self.root).as_posix();self._path(relative,create=True)
        fd,name=tempfile.mkstemp(prefix='.tileset-',suffix='.tmp',dir=path.parent)
        try:
            with os.fdopen(fd,'wb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
            self._path(relative);os.replace(name,path)
        finally:Path(name).unlink(missing_ok=True)

    def read(self):
        with self.lock:
            try:
                raw=self._path(CATALOG).read_bytes();source=json.loads(raw);_safe_json(source)
                legacy=json.loads(self._path('assets/pixel/atlas.json').read_bytes())
                payload=normalize_tileset(source,legacy,build_world_scenes.catalog(self.root))
            except AuthoringError:raise
            except (OSError,ValueError,KeyError,TypeError,RecursionError):raise AuthoringError('INVALID_CATALOG',422) from None
            return {'hash':hashlib.sha256(raw).hexdigest(),'payload':payload}

    def _check_hash(self,base_hash):
        current=self.read()
        if not isinstance(base_hash,str) or len(base_hash)!=64:raise AuthoringError('INVALID_BASE_HASH')
        if base_hash!=current['hash']:raise AuthoringError('CONFLICT',409,hash=current['hash'])
        return current

    def _dependencies(self):
        paths=[CATALOG,'assets/pixel/atlas.json','content/locales/vi.js','content/maps/scene-contract.json','content/maps/prefabs.json']+[f'content/maps/scenes/{s}.json' for s in ('home','yard','street','newsroom','interaction')]
        return {name:hashlib.sha256(self._path(name).read_bytes()).hexdigest() for name in paths}

    def _before_publish(self):
        """Failure/race injection seam, deliberately before dependency recheck."""

    def _images(self,catalog):
        for a in catalog['atlases']:
            data=self._path(a['imagePath']).read_bytes()
            if a['sha256'] and hashlib.sha256(data).hexdigest()!=a['sha256']:raise AuthoringError('IMAGE_HASH_MISMATCH',422)

    def _publish(self,payload,base_hash):
        self._check_hash(base_hash);dependencies=self._dependencies()
        try:
            payload=normalize_tileset(payload,text_keys=build_world_scenes.catalog(self.root));self._images(payload)
            outputs=build_world_scenes.render_outputs(root=self.root,tileset_override=payload)
            writes={CATALOG:_encode(payload),GENERATED:outputs[GENERATED].encode('utf-8')}
        except AuthoringError:raise
        except (OSError,ValueError,KeyError,TypeError,RecursionError):raise AuthoringError('VALIDATION_FAILED',422) from None
        self._before_publish()
        if self._dependencies()!=dependencies:raise AuthoringError('CONFLICT',409,hash=self.read()['hash'])
        entries=[{'path':name,'old':base64.b64encode(self._path(name).read_bytes()).decode(),'newHash':hashlib.sha256(data).hexdigest()} for name,data in writes.items()]
        journal=self._path(JOURNAL,create=True)
        self._replace(journal,_encode({'schemaVersion':1,'entries':entries}))
        try:
            for name,data in writes.items():self._replace(self._path(name),data)
        except Exception:
            self.recover()
            raise AuthoringError('WRITE_FAILED',500) from None
        journal.unlink()
        return {'hash':hashlib.sha256(writes[CATALOG]).hexdigest(),'payload':payload,'applied':True}

    def recover(self):
        with self.lock:
            journal=self._path(JOURNAL)
            if not journal.exists():return
            try:
                if journal.stat().st_size>16*1024*1024:raise ValueError('journal size')
                record=json.loads(journal.read_bytes());entries=record['entries']
                if record.get('schemaVersion')!=1 or not isinstance(entries,list) or {e['path'] for e in entries}!={CATALOG,GENERATED} or len(entries)!=2:raise ValueError('journal')
                restores=[]
                for entry in entries:
                    old=base64.b64decode(entry['old'],validate=True);path=self._path(entry['path']);current=path.read_bytes()
                    if current!=old and hashlib.sha256(current).hexdigest()!=entry['newHash']:raise AuthoringError('RECOVERY_CONFLICT',409)
                    if current!=old:restores.append((path,old))
                for path,data in reversed(restores):self._replace(path,data)
                journal.unlink()
            except AuthoringError:raise
            except (OSError,ValueError,KeyError,TypeError):raise AuthoringError('RECOVERY_FAILED',500) from None

    def save_catalog(self,request):
        if not isinstance(request,dict) or set(request)!={'baseHash','payload'}:raise AuthoringError('INVALID_REQUEST')
        _safe_json(request)
        if len(_encode(request))>MAX_CATALOG_BODY:raise AuthoringError('PAYLOAD_TOO_LARGE',413)
        with self.lock:
            current=self._check_hash(request['baseHash'])['payload']
            try:candidate=normalize_tileset(request['payload'],text_keys=build_world_scenes.catalog(self.root))
            except (ValueError,KeyError,TypeError):raise AuthoringError('VALIDATION_FAILED',422) from None
            identity=lambda c:[(t['id'],t['atlasId'],t['atlasIndex']) for t in c['tiles']]
            if candidate['atlases']!=current['atlases'] or candidate['nextTileId']!=current['nextTileId'] or identity(candidate)!=identity(current):raise AuthoringError('IMMUTABLE_TILE_IDENTITY',422)
            return self._publish(candidate,request['baseHash'])

    def import_png(self,request):
        required={'baseHash','pngBase64','sourceName','tilePixels','margin','spacing'}
        if not isinstance(request,dict) or set(request)!=required:raise AuthoringError('INVALID_REQUEST')
        _safe_json(request)
        if len(_encode(request))>MAX_IMPORT_BODY:raise AuthoringError('PAYLOAD_TOO_LARGE',413)
        with self.lock:
            current=self._check_hash(request['baseHash'])
            try:
                data=base64.b64decode(request['pngBase64'],validate=True)
                if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data)>MAX_PNG:raise ValueError('png')
                with Image.open(io.BytesIO(data)) as image:
                    if image.format!='PNG' or getattr(image,'n_frames',1)!=1 or max(image.size)>4096:raise ValueError('image')
                    width,height=image.size;image.verify()
                with Image.open(io.BytesIO(data)) as image:image.load()
                if not isinstance(request['sourceName'],str):raise ValueError('name')
                digest=hashlib.sha256(data).hexdigest();source_name=request['sourceName'].replace('\\','/').split('/')[-1]
                atlas={'id':digest,'sha256':digest,'imagePath':f'assets/tilesets/{digest}.png','sourceName':source_name,'imageWidth':width,'imageHeight':height,'tilePixels':request['tilePixels'],'margin':request['margin'],'spacing':request['spacing']}
                payload=current['payload'];existing=next((a for a in payload['atlases'] if a['id']==digest),None)
                if existing:
                    if any(existing[k]!=atlas[k] for k in ('tilePixels','margin','spacing')):raise ValueError('layout')
                    if self._path(atlas['imagePath']).exists() and hashlib.sha256(self._path(atlas['imagePath']).read_bytes()).hexdigest()!=digest:raise AuthoringError('IMAGE_HASH_MISMATCH',422)
                    self._replace(self._path(atlas['imagePath'],create=True),data)
                    return {**current,'applied':True}
                size=atlas['tilePixels'];spacing=atlas['spacing'];margin=atlas['margin']
                if type(size) is not int or size not in (16,24,32,48) or type(spacing) is not int or not 0<=spacing<=32 or type(margin) is not int or not 0<=margin<=32:raise ValueError('grid')
                cols=(width-2*margin+spacing)/(size+spacing);rows=(height-2*margin+spacing)/(size+spacing)
                if not cols.is_integer() or not rows.is_integer() or cols<=0 or rows<=0:raise ValueError('grid')
                count=int(cols*rows)
                if len(payload['tiles'])+count>8192:raise ValueError('count')
                payload['atlases'].append(atlas)
                start=payload['nextTileId'];payload['tiles'].extend({'id':start+i,'atlasId':digest,'atlasIndex':i,'collision':'none','blockedEdges':[],'drawPriority':'below'} for i in range(count));payload['nextTileId']+=count
                normalize_tileset(payload)
            except AuthoringError:raise
            except (ValueError,TypeError,KeyError,binascii.Error,UnidentifiedImageError,OSError,Image.DecompressionBombError):raise AuthoringError('INVALID_TILESET_IMAGE',422) from None
            path=self._path(atlas['imagePath'],create=True)
            if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()!=digest:raise AuthoringError('IMAGE_HASH_MISMATCH',422)
            self._replace(path,data)
            return self._publish(payload,request['baseHash'])
