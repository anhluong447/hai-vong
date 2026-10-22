"""Allowlisted, conflict-aware atomic JSON source replacement. Validation is injected."""
import hashlib
import json
import os
from pathlib import Path,PurePosixPath
import tempfile
import threading
from local_environment import require_project_path

WRITE_LOCK=threading.RLock()
def failed(code,source=''):return {'ok':False,'errors':[{'code':code,'sourceId':source,'pointer':'','relatedIds':[]}]}

def safe_path(root,name):
    name=name.replace('\\','/');parts=PurePosixPath(name).parts
    if not parts or any(p in {'.','..'} for p in parts) or PurePosixPath(name).is_absolute():raise ValueError('path')
    target=(root/name).resolve();target.relative_to(root)
    return target

class SourceWriter:
    def __init__(self,root,allowed,validator):self.root=require_project_path(root);self.allowed=set(allowed);self.validator=validator
    def read(self,name):
        if name not in self.allowed:return failed('authoring.path.denied',name)
        try:
            path=safe_path(self.root,name);raw=path.read_bytes()
            return {'ok':True,'value':{'data':json.loads(raw),'hash':hashlib.sha256(raw).hexdigest()}}
        except (ValueError,OSError):return failed('authoring.read.failed',name)
    def save(self,name,content,expected_hash):
        if name not in self.allowed:return failed('authoring.path.denied',name)
        try:
            path=safe_path(self.root,name)
            with WRITE_LOCK:
                if hashlib.sha256(path.read_bytes()).hexdigest()!=expected_hash:return failed('authoring.write.conflict',name)
                try:validated=self.validator(name,content)
                except Exception:return failed('authoring.validation.failed',name)
                if not validated['ok']:return validated
                # Recheck after validation: an external editor may have written while it ran.
                if hashlib.sha256(path.read_bytes()).hexdigest()!=expected_hash:return failed('authoring.write.conflict',name)
                data=(json.dumps(content,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode('utf-8')
                fd,tmp=tempfile.mkstemp(dir=path.parent,prefix='.write-',suffix='.json')
                try:
                    with os.fdopen(fd,'wb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
                    os.replace(tmp,path)
                finally:
                    if os.path.exists(tmp):os.unlink(tmp)
                return {'ok':True,'value':hashlib.sha256(data).hexdigest()}
        except (ValueError,TypeError,OSError):return failed('authoring.write.failed',name)
