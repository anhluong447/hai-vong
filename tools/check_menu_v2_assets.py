"""Verify the local, Git-ignored menu v2 assets against their source inventory."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
FOLDER=ROOT/'assets/ui/coastal-menu-v2'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-inventory',action='store_true',help='Record an intentional asset update')
    args=parser.parse_args()
    entries=[]
    for name in ['scene.png','foliage.png','map.png']:
        path=FOLDER/name
        with Image.open(path) as image:
            assert image.size==(1672,941),(name,image.size)
            if name=='foliage.png':
                assert image.mode=='RGBA' and image.getchannel('A').getextrema()==(0,255),'Foliage needs actual transparent alpha'
            entries.append(dict(file=name,bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),size=list(image.size),mode=image.mode))
    inventory=FOLDER/'inventory.json'
    if args.write_inventory:
        inventory.write_text(json.dumps(dict(version=1,files=entries),indent=2)+'\n',encoding='utf-8')
    expected=json.loads(inventory.read_text(encoding='utf-8'))
    assert expected['files']==entries,'Asset bytes changed; inspect the change before updating inventory'
    prompts=json.loads((FOLDER/'prompts.json').read_text(encoding='utf-8'))
    map_prompt=json.loads((FOLDER/'map-prompt.json').read_text(encoding='utf-8'))
    assert {p['file'] for p in prompts['outputs']}|{map_prompt['file']}=={e['file'] for e in entries}
    print(f'Menu v2 assets: {len(entries)} native images; SHA-256, dimensions, foliage alpha and prompts verified')

if __name__=='__main__':main()
