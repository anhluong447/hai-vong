"""Read declared project sources and candidate overrides without writing them."""
import json
from pathlib import Path

def load_sources(root,candidate_name=None,candidate=None,candidates=None,*,project_path='content/project.json'):
    root=Path(root).resolve()
    def read(path):
        path=path.resolve();path.relative_to(root)
        name=path.relative_to(root).as_posix()
        if candidates is not None and name in candidates:return candidates[name]
        return candidate if candidate_name==name else json.loads(path.read_text(encoding='utf-8-sig'))
    path=root/project_path;project=read(path)
    schemas={key:read(path.parent/ref) for key,ref in project['schemas'].items()}
    docs=[]
    for ref in project['packs']:
        pack_path=(path.parent/ref).resolve();pack=read(pack_path)
        for entry in pack['documents']:
            doc_path=(pack_path.parent/entry['path']).resolve();doc_path.relative_to(root)
            docs.append({**entry,'sourceId':'/'+doc_path.relative_to(root).as_posix(),'data':read(doc_path)})
    return {'project':project,'schemas':schemas,'documents':docs}

