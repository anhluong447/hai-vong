"""Allowlisted, conflict-aware atomic JSON source replacement. Validation is injected."""
import hashlib
import json
import os
from pathlib import Path,PurePosixPath
import tempfile
import threading
import uuid
from local_environment import require_project_path

WRITE_LOCK=threading.RLock()
def failed(code,source=''):return {'ok':False,'errors':[{'code':code,'sourceId':source,'pointer':'','relatedIds':[]}]}

def safe_path(root,name):
    name=name.replace('\\','/');parts=PurePosixPath(name).parts
    if not parts or any(p in {'.','..'} for p in parts) or PurePosixPath(name).is_absolute():raise ValueError('path')
    target=(root/name).resolve();target.relative_to(root)
    return target

def atomic_bytes(path,data):
    path=require_project_path(path)
    fd,tmp=tempfile.mkstemp(dir=path.parent,prefix='.write-',suffix='.json')
    try:
        with os.fdopen(fd,'wb') as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def encoded(value):return (json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode('utf-8')
def digest(data):return hashlib.sha256(data).hexdigest()

def recover_batches(root,allowed):
    """Recover interrupted process writes, refusing to overwrite outside edits."""
    root=require_project_path(root);directory=root/'.cache/authoring-transactions';recovered=[]
    with WRITE_LOCK:
        try:
            for manifest in sorted(directory.glob('*/transaction.json')):
                require_project_path(manifest);transaction=json.loads(manifest.read_bytes())
                if transaction['phase'] in ('committed','rolled-back'):continue
                if transaction['phase']!='prepared' or not transaction['entries']:raise ValueError('journal')
                records=[]
                for i,entry in enumerate(transaction['entries']):
                    name=entry['documentId']
                    if name not in allowed:raise ValueError('allowlist')
                    path=safe_path(root,name);before=require_project_path(manifest.parent/f'{i}.before').read_bytes();current=digest(path.read_bytes())
                    if digest(before)!=entry['beforeHash']:raise ValueError('journal hash')
                    if current not in (entry['beforeHash'],entry['afterHash']):return failed('authoring.recovery.conflict',name)
                    records.append((path,before,current,entry))
                committed=all(current==entry['afterHash'] for _,_,current,entry in records)
                if not committed:
                    for path,before,current,entry in records:
                        if current!=entry['beforeHash']:atomic_bytes(path,before)
                transaction['phase']='committed' if committed else 'rolled-back';atomic_bytes(manifest,encoded(transaction));recovered.append(manifest.parent.name)
            return {'ok':True,'value':recovered}
        except (ValueError,KeyError,TypeError,OSError):return failed('authoring.recovery.failed',str(directory))

class SourceWriter:
    def __init__(self,root,allowed,validator,validator_many=None):self.root=require_project_path(root);self.allowed=set(allowed);self.validator=validator;self.validator_many=validator_many
    def save_many(self,requests):
        if not self.validator_many:return failed('authoring.writer.batch-unavailable')
        if not isinstance(requests,list) or not requests:return failed('authoring.request.invalid')
        with WRITE_LOCK:
            try:
                recovered=recover_batches(self.root,self.allowed)
                if not recovered['ok']:return recovered
                records=[];seen=set()
                for entry in requests:
                    name=entry['documentId']
                    if name not in self.allowed or name in seen:return failed('authoring.path.denied',name)
                    seen.add(name);path=safe_path(self.root,name);before=path.read_bytes()
                    if digest(before)!=entry['expectedHash']:return failed('authoring.write.conflict',name)
                    after=encoded(entry['content']);records.append((name,path,before,after))
                try:validated=self.validator_many({entry['documentId']:entry['content'] for entry in requests})
                except Exception:return failed('authoring.validation.failed')
                if not validated['ok']:return validated
                for name,path,before,_ in records:
                    if path.read_bytes()!=before:return failed('authoring.write.conflict',name)
                journal=require_project_path(self.root/'.cache/authoring-transactions'/uuid.uuid4().hex);journal.mkdir(parents=True)
                transaction={'phase':'prepared','entries':[{'documentId':name,'beforeHash':digest(before),'afterHash':digest(after)} for name,_,before,after in records]}
                for i,(_,_,before,_) in enumerate(records):atomic_bytes(journal/f'{i}.before',before)
                manifest=journal/'transaction.json';atomic_bytes(manifest,encoded(transaction))
                try:
                    for _,path,_,after in records:atomic_bytes(path,after)
                except OSError:
                    recovered=recover_batches(self.root,self.allowed)
                    return failed('authoring.write.failed') if recovered['ok'] else recovered
                # Sources are committed. A failed journal-finalization is recoverable,
                # and must not report that an already committed edit failed.
                transaction['phase']='committed'
                try:atomic_bytes(manifest,encoded(transaction))
                except OSError:pass
                return {'ok':True,'value':{name:digest(after) for name,_,_,after in records}}
            except (ValueError,KeyError,TypeError,OSError):return failed('authoring.write.failed')
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
