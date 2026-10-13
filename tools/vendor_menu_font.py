"""Explicit network vendoring of the menu's thin OFL handwriting font.

Reuse the pinned Google Fonts revision; no network calls in build/check/runtime.
"""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT=Path(__file__).resolve().parent.parent


def main():
    revision=json.loads((ROOT/'assets/fonts/coastal-replica/manifest.json').read_text())['revision']
    destination=ROOT/'assets/fonts/coastal-menu/ooohbaby'
    destination.mkdir(parents=True,exist_ok=True)
    files=[]
    for name in ['OoohBaby-Regular.ttf','OFL.txt','METADATA.pb']:
        url=f'https://raw.githubusercontent.com/google/fonts/{revision}/ofl/ooohbaby/{name}'
        request=urllib.request.Request(url,headers={'User-Agent':'HoiAm-menu-authoring'})
        data=urllib.request.urlopen(request,timeout=30).read()
        (destination/name).write_bytes(data)
        files.append({'path':name,'url':url,'sha256':hashlib.sha256(data).hexdigest()})
    metadata=(destination/'METADATA.pb').read_text()
    if 'subsets: "vietnamese"' not in metadata or 'license: "OFL"' not in metadata:
        raise ValueError('Font must declare Vietnamese and OFL')
    (destination/'manifest.json').write_text(json.dumps({'family':'Oooh Baby','revision':revision,
        'role':'menu handwriting; normal 400; no synthetic bold/italic','files':files},indent=2)+'\n')
    print('Vendored Oooh Baby 400, Vietnamese/OFL, at '+revision[:12])


if __name__=='__main__': main()
