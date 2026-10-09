"""Vendor the three OFL/Vietnamese font families selected for the replica pilot.

Fetch an explicit Google Fonts repository revision; retain licenses, metadata,
URLs and hashes. Offline validation/build never fetches the network.
"""
import hashlib
import json
from pathlib import Path
import urllib.request
import subprocess
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/fonts/coastal-replica'
FAMILIES = [
    ('sourceserif4', 'Source Serif 4', 'SourceSerif4[opsz,wght].ttf', 'source-serif-4.ttf', 'editorial/body/numbers'),
    ('cormorantgaramond', 'Cormorant Garamond', 'CormorantGaramond[wght].ttf', 'cormorant-garamond.ttf', 'wordmark/display'),
    ('dancingscript', 'Dancing Script', 'DancingScript[wght].ttf', 'dancing-script.ttf', 'handwriting'),
]


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent':'HoiAm-asset-authoring'})
    return urllib.request.urlopen(request, timeout=30).read()


def main():
    # GitHub API unauthenticated limits are shared; ls-remote only reads the ref.
    result = subprocess.run(['git','ls-remote','https://github.com/google/fonts.git','refs/heads/main'],
                            check=True,capture_output=True,text=True,timeout=30)
    revision = result.stdout.split()[0]
    manifest = {'version':1, 'repository':'https://github.com/google/fonts', 'revision':revision, 'fonts':[]}
    for directory, family, source, target, role in FAMILIES:
        base = f'https://raw.githubusercontent.com/google/fonts/{revision}/ofl/{directory}/'
        folder = DEST / directory
        folder.mkdir(parents=True, exist_ok=True)
        sources = []
        for remote, local in [(source,target), ('OFL.txt','OFL.txt'), ('METADATA.pb','METADATA.pb')]:
            url = base + quote(remote)
            data = fetch(url)
            path = folder / local
            path.write_bytes(data)
            sources.append({'path':path.relative_to(ROOT).as_posix(), 'url':url, 'sha256':hashlib.sha256(data).hexdigest().upper()})
        metadata = (folder / 'METADATA.pb').read_text(encoding='utf-8')
        if 'subsets: "vietnamese"' not in metadata or 'license: "OFL"' not in metadata:
            raise ValueError(f'Font lacks Vietnamese/OFL metadata: {directory}')
        manifest['fonts'].append({'family':family,'role':role,'license':'SIL Open Font License 1.1', 'files':sources})
    (DEST / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('Vendored 3 Vietnamese/OFL families at pinned revision ' + revision[:12])


if __name__ == '__main__':
    main()
