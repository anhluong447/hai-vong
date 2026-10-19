"""Sample the approved dossier reference; store reproducible palette provenance."""
from collections import Counter
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png'
SAMPLES={
    'sidebar':(20,350,240,620),'paper':(880,355,1230,430),
    'gold':(490,365,690,382),'teal':(342,230,354,330),
    'ink':(900,218,1230,262),'tape':(908,463,1100,483),
    'cream':(75,482,87,494),
}
def main():
    im=Image.open(SOURCE).convert('RGB');samples={}
    for name,box in SAMPLES.items():
        pixels=list(im.crop(box).getdata())
        if name=='ink':pixels=[rgb for rgb in pixels if max(rgb)<85]
        rgb=Counter(pixels).most_common(1)[0][0]
        samples[name]=dict(box=list(box),modeRGB=rgb,hex='#'+''.join(f'{v:02x}' for v in rgb),filter='max-channel<85' if name=='ink' else None)
    result=dict(source=SOURCE.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),method='Exact RGB mode per ROI; dark-pixel filter for text ink',samples=samples)
    dest=ROOT/'docs/ui-specs/dossier-polish/palette.json';dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v['hex'] for k,v in samples.items()}))
if __name__=='__main__':main()
