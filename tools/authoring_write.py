"""Allowlisted source writer for the explicitly enabled local authoring server.

Builders are trusted, pure functions returning {relative_generated_path: bytes}.
They must finish rendering before this module stages or replaces any output.
"""
import hashlib
import importlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
import threading

RESOURCES = {'menu-layout': 'content/ui/menu-layout.json', **{
    f'scene/{name}': f'content/maps/scenes/{name}.json'
    for name in ('home', 'yard', 'newsroom', 'street', 'interaction')}}
GENERATED = {
    'menu-layout': {'content/ui/menu-layout-data.js', 'content/ui/menu-layout-regions.js'},
    **{f'scene/{name}': {'content/maps/scenes-data.js'}
       for name in ('home', 'yard', 'newsroom', 'street', 'interaction')},
}
MAX_BODY = 1024 * 1024
MAX_SCENE_BODY = 8 * 1024 * 1024


class AuthoringError(Exception):
    def __init__(self, code, status=400, **details):
        super().__init__(code)
        self.code = code
        self.status = status
        self.details = details


def _safe_json(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str) or key in ('__proto__', 'constructor', 'prototype'):
                raise AuthoringError('INVALID_PAYLOAD')
            _safe_json(child)
    elif isinstance(value, list):
        for child in value:
            _safe_json(child)
    elif isinstance(value, float) and not math.isfinite(value):
        raise AuthoringError('INVALID_PAYLOAD')
    elif value is not None and not isinstance(value, (str, int, float, bool)):
        raise AuthoringError('INVALID_PAYLOAD')


def _encode(payload):
    return (json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')


def _hash(data):
    return hashlib.sha256(data).hexdigest()


class AuthoringWriter:
    def __init__(self, root, *, validators=None, builders=None):
        self.root = Path(root).resolve(strict=True)
        self.validators = validators
        self.builders = builders
        self.lock = threading.RLock()

    def _path(self, relative):
        candidate = self.root / relative
        # Refuse even in-root links: an allowlisted name must name its own source.
        current = self.root
        for part in Path(relative).parts:
            current = current / part
            if current.is_symlink() or (hasattr(current, 'is_junction') and current.is_junction()):
                raise AuthoringError('UNSAFE_PATH', 403)
        try:
            candidate.resolve(strict=True).relative_to(self.root)
        except (OSError, ValueError):
            raise AuthoringError('RESOURCE_UNAVAILABLE', 404) from None
        if not candidate.is_file():
            raise AuthoringError('RESOURCE_UNAVAILABLE', 404)
        return candidate

    def _source(self, resource):
        if not isinstance(resource, str) or resource not in RESOURCES:
            raise AuthoringError('UNKNOWN_RESOURCE', 404)
        return self._path(RESOURCES[resource])

    def read(self, resource):
        with self.lock:
            data = self._source(resource).read_bytes()
            try:
                payload = json.loads(data)
                _safe_json(payload)
            except (ValueError, RecursionError):
                raise AuthoringError('INVALID_SOURCE', 422) from None
            return {'payload': payload, 'hash': _hash(data)}

    def _before_scene_publish(self):
        """Dependency-race test seam; no source writes have happened here."""

    def save_scene(self, request):
        from .authoring_tilesets import TilesetWriter
        if not isinstance(request,dict) or set(request)!={'resourceId','schemaVersion','baseHash','catalogHash','payload'}:raise AuthoringError('INVALID_REQUEST')
        _safe_json(request)
        resource=request['resourceId'];payload=request['payload']
        if not isinstance(resource,str) or resource not in RESOURCES or not resource.startswith('scene/'):raise AuthoringError('UNKNOWN_RESOURCE',404)
        if type(request['schemaVersion']) is not int or request['schemaVersion']!=1 or not isinstance(payload,dict) or type(payload.get('schemaVersion')) is not int or payload['schemaVersion'] not in (1,2):raise AuthoringError('UNSUPPORTED_SCHEMA',422)
        if payload.get('id')!=resource.split('/',1)[1]:raise AuthoringError('VALIDATION_FAILED',422)
        for key in ('baseHash','catalogHash'):
            if not isinstance(request[key],str) or not re.fullmatch('[0-9a-f]{64}',request[key]):raise AuthoringError('INVALID_BASE_HASH')
        data=_encode(payload)
        if len(_encode(request))>MAX_SCENE_BODY:raise AuthoringError('PAYLOAD_TOO_LARGE',413)
        with self.lock:
            tilesets=TilesetWriter(self.root,self.lock);tilesets._check_hash(request['catalogHash']);dependencies=tilesets._dependencies()
            current=self.read(resource)
            if current['hash']!=request['baseHash']:raise AuthoringError('CONFLICT',409,hash=current['hash'])
            try:
                module=importlib.import_module('tools.build_world_scenes');module.render_outputs(root=self.root,overrides={resource.split('/',1)[1]:payload})
            except (OSError,ValueError,KeyError,TypeError,RecursionError):raise AuthoringError('VALIDATION_FAILED',422) from None
            self._before_scene_publish()
            if tilesets._dependencies()!=dependencies:raise AuthoringError('CONFLICT',409,hash=self.read(resource)['hash'])
            self._replace_source(self._source(resource),data,request['baseHash'],resource)
            try:applied,build_error=self._build(resource,payload)
            except Exception:applied,build_error=False,'BUILD_FAILED'
            result={'sourceSaved':True,'applied':applied,'hash':_hash(data)}
            if build_error:result['buildError']=build_error
            return result

    def _validate(self, resource, payload):
        if self.validators is not None:
            validator = self.validators.get(resource)
            if validator is None:
                raise AuthoringError('VALIDATOR_UNAVAILABLE', 503)
        else:
            try:
                module_name = 'tools.build_menu_layout' if resource == 'menu-layout' else 'tools.build_world_scenes'
                module = importlib.import_module(module_name)
                if resource == 'menu-layout':
                    validator = module.validate_layout
                else:
                    validator = lambda candidate: module.validate_scene(candidate, resource_id=resource, root=self.root)
            except (ImportError, AttributeError):
                raise AuthoringError('VALIDATOR_UNAVAILABLE', 503) from None
        try:
            result = validator(payload)
            if result is False or (isinstance(result, (list, tuple)) and result):
                raise ValueError('validation errors')
        except Exception:
            raise AuthoringError('VALIDATION_FAILED', 422) from None

    def _stage(self, path, data):
        fd, name = tempfile.mkstemp(prefix=f'.{path.name}.', suffix='.tmp', dir=path.parent)
        temporary = Path(name)
        try:
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            return temporary
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise

    def _replace_source(self, path, data, expected_hash, resource):
        staged = self._stage(path, data)
        try:
            # Recheck after validation/staging so an intervening IDE edit wins.
            checked = self._source(resource)
            if _hash(checked.read_bytes()) != expected_hash:
                raise AuthoringError('CONFLICT', 409, hash=_hash(checked.read_bytes()))
            os.replace(staged, checked)
        finally:
            staged.unlink(missing_ok=True)

    def _build(self, resource, payload):
        if self.builders is not None:
            builder = self.builders.get(resource)
            if builder is None:
                return False, 'BUILD_UNAVAILABLE'
        else:
            # Offline builders expose this pure adapter; no CLI is allowed to write
            # outputs before every generated byte has been produced successfully.
            module = importlib.import_module('tools.build_menu_layout' if resource == 'menu-layout' else 'tools.build_world_scenes')
            if resource == 'menu-layout':
                builder = module.render_outputs
            else:
                builder = lambda candidate: module.render_outputs(root=self.root, overrides={resource.split('/', 1)[1]: candidate})
        outputs = builder(payload)
        if not isinstance(outputs, dict) or not outputs or not set(outputs).issubset(GENERATED[resource]):
            raise ValueError('invalid generated output allowlist')
        staged = []
        replaced = []
        backups = {}
        try:
            for relative, data in outputs.items():
                if isinstance(data, str):
                    data = data.encode('utf-8')
                if not isinstance(data, bytes):
                    raise ValueError('invalid generated bytes')
                path = self._path(relative)
                backups[path] = path.read_bytes()
                staged.append((path, self._stage(path, data)))
            for path, temporary in staged:
                self._path(path.relative_to(self.root).as_posix())
                os.replace(temporary, path)
                replaced.append(path)
        except BaseException:
            for path in reversed(replaced):
                restored = self._stage(path, backups[path])
                try:
                    os.replace(restored, path)
                finally:
                    restored.unlink(missing_ok=True)
            raise
        finally:
            for _, temporary in staged:
                temporary.unlink(missing_ok=True)
        return True, None

    def save(self, request):
        if not isinstance(request, dict) or set(request) != {'resourceId', 'schemaVersion', 'baseHash', 'payload'}:
            raise AuthoringError('INVALID_REQUEST')
        _safe_json(request)
        resource, payload = request['resourceId'], request['payload']
        if type(request['schemaVersion']) is not int or request['schemaVersion'] != 1:
            raise AuthoringError('UNSUPPORTED_SCHEMA', 422)
        if not isinstance(payload, dict) or type(payload.get('schemaVersion')) is not int or payload['schemaVersion'] != 1:
            raise AuthoringError('UNSUPPORTED_SCHEMA', 422)
        base_hash = request['baseHash']
        if not isinstance(base_hash, str) or not re.fullmatch(r'[0-9a-f]{64}', base_hash):
            raise AuthoringError('INVALID_BASE_HASH')
        data = _encode(payload)
        if len(data) > MAX_BODY:
            raise AuthoringError('PAYLOAD_TOO_LARGE', 413)
        with self.lock:
            source = self._source(resource)
            current_hash = _hash(source.read_bytes())
            if current_hash != base_hash:
                raise AuthoringError('CONFLICT', 409, hash=current_hash)
            self._validate(resource, payload)
            try:
                self._replace_source(source, data, base_hash, resource)
            except AuthoringError:
                raise
            except OSError:
                raise AuthoringError('WRITE_FAILED', 500) from None
            try:
                applied, build_error = self._build(resource, payload)
            except Exception:
                applied, build_error = False, 'BUILD_FAILED'
            return {'sourceSaved': True, 'applied': applied, 'buildError': build_error, 'hash': _hash(data)}
