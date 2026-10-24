"""Verify a versioned bundle completely before restoring any source master."""
import argparse
import hashlib
import json
from pathlib import Path,PurePosixPath
import zipfile
from build_assets import write_changed,failure
from local_environment import require_project_path

def restore(root,bundle,inventory):
    root=Path(root).resolve()
    try:
        require_project_path(root)
        if hashlib.sha256(Path(bundle).read_bytes()).hexdigest()!=inventory['bundleSha256']:return failure('asset.bundle.hash')
        pending=[]
        with zipfile.ZipFile(bundle) as archive:
            if set(archive.namelist())!={e['path'] for e in inventory['files']}:return failure('asset.bundle.inventory')
            for entry in inventory['files']:
                name=entry['path'];parts=PurePosixPath(name).parts
                if not parts or '..' in parts or PurePosixPath(name).is_absolute() or '\\' in name:raise ValueError('path')
                path=(root/name).resolve();path.relative_to(root/'assets/sources');raw=archive.read(name)
                if len(raw)!=entry['bytes'] or hashlib.sha256(raw).hexdigest()!=entry['sha256']:return failure('asset.source.hash',name)
                if path.exists() and path.read_bytes()!=raw:return failure('asset.restore.conflict',name)
                pending.append((path,raw))
        for path,raw in pending:write_changed(path,raw)
        return {'ok':True,'value':{'restored':len(pending)}}
    except (ValueError,KeyError,OSError,zipfile.BadZipFile):return failure('asset.restore.failed')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);args=parser.parse_args();root=args.root.resolve()
    inventory=json.loads((root/'assets/ASSET-INVENTORY.json').read_text(encoding='utf-8'));result=restore(root,root/inventory['bundlePath'],inventory);print(json.dumps(result));raise SystemExit(not result['ok'])
