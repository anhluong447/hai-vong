"""I/O checks complement the shared JS schema/semantic validator."""
import argparse
import hashlib
import json
from pathlib import Path
from local_environment import configure
configure()
from PIL import Image
from build_assets import local

def audit(root,manifest):
    root=Path(root).resolve();errors=[]
    for resource in manifest:
        def error(code):errors.append({'code':code,'sourceId':resource['id'],'pointer':'','relatedIds':[]})
        try:
            path=local(root,resource['path'].lstrip('/'));raw=path.read_bytes()
            if hashlib.sha256(raw).hexdigest()!=resource['hash'] or len(raw)!=resource['bytes']:error('asset.export.hash')
            if resource['kind']=='image':
                with Image.open(path) as image:
                    if (image.width,image.height)!=(resource['width'],resource['height']):error('asset.export.dimensions')
            if resource.get('source'):
                source=local(root,resource['source'])
                if hashlib.sha256(source.read_bytes()).hexdigest()!=resource['sourceHash']:error('asset.source.stale')
        except (ValueError,OSError,KeyError):error('asset.audit.failed')
    return {'ok':not errors,'errors':errors}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);args=parser.parse_args();root=args.root.resolve();result=audit(root,json.loads((root/'content/assets/manifest.json').read_text(encoding='utf-8')));print(json.dumps(result,indent=2));raise SystemExit(not result['ok'])
