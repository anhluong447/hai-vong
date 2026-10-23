"""Owned polling over manifest inputs; no machine watcher/service or external cache."""
import hashlib,json
from pathlib import Path
from urllib.parse import unquote,urlsplit
from local_environment import require_project_path

def failure(code,source='watch'):
    return {'ok':False,'errors':[{'code':code,'sourceId':source,'pointer':'/','relatedIds':[]}]}

def tracked_inputs(root):
    root=require_project_path(root);names={'content/project.json'}
    def read(path):
        path=path.resolve();path.relative_to(root);names.add(path.relative_to(root).as_posix());return json.loads(path.read_text(encoding='utf-8-sig'))
    project_path=root/'content/project.json';project=read(project_path)
    for ref in project['schemas'].values():read(project_path.parent/ref)
    for ref in project['packs']:
        pack_path=(project_path.parent/ref).resolve();pack=read(pack_path)
        for entry in pack['documents']:
            data=read(pack_path.parent/entry['path'])
            if entry['kind']=='assets':
                for definition in data:
                    path=urlsplit(definition['path'])
                    if path.scheme or path.netloc:raise ValueError('watch.path.denied')
                    names.add(unquote(path.path).lstrip('/'))
            if entry['kind']=='config' and isinstance(data,dict) and data.get('kind')=='asset-imports':
                names.update(item['source'] for item in data['entries']);names.update(data.get('generationInputs',[]))
    return sorted(names)

class RevisionWatcher:
    def __init__(self,root,paths):self.root=require_project_path(root);self.paths=paths;self.previous={};self.fingerprint=None
    def scan(self):
        try:
            values={};missing=[]
            for name in sorted(set(self.paths())):
                name=name.replace('\\','/');path=(self.root/name).resolve()
                if not name or Path(name).is_absolute() or '..' in Path(name).parts or not path.is_relative_to(self.root):return failure('watch.path.denied',name)
                if not path.is_file():values[name]=None;missing.append(name)
                else:values[name]=hashlib.sha256(path.read_bytes()).hexdigest()
            changed=sorted(name for name in self.previous.keys()|values.keys() if self.previous.get(name,'absent')!=values.get(name,'absent'))
            fingerprint=hashlib.sha256(json.dumps(values,sort_keys=True,separators=(',',':')).encode()).hexdigest();self.previous=values;self.fingerprint=fingerprint
            return {'ok':True,'value':{'fingerprint':fingerprint,'changed':changed,'missing':missing}}
        except (ValueError,OSError,KeyError,TypeError):return failure('watch.inputs.invalid')
