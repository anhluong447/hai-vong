"""Offline provenance, alpha and Vietnamese glyph checks for menu materials."""
import hashlib
import argparse
import json
from pathlib import Path
import struct
import unicodedata

from PIL import Image

ROOT=Path(__file__).resolve().parent.parent


def glyphs(path):
    """Read Unicode cmap formats 4/12 without adding a font-tools dependency."""
    data=path.read_bytes()
    u16=lambda offset:struct.unpack_from('>H',data,offset)[0]
    u32=lambda offset:struct.unpack_from('>I',data,offset)[0]
    tables={data[12+i*16:16+i*16]:u32(20+i*16) for i in range(u16(4))}
    cmap=tables[b'cmap'];supported=set()
    for i in range(u16(cmap+2)):
        record=cmap+4+i*8; platform,encoding=struct.unpack_from('>HH',data,record)
        if platform!=0 and not (platform==3 and encoding in (1,10)):continue
        sub=cmap+u32(record+4);fmt=u16(sub)
        if fmt==12:
            for n in range(u32(sub+12)):
                start,end,glyph=struct.unpack_from('>III',data,sub+16+n*12)
                supported.update(range(start+(glyph==0),end+1))
        elif fmt==4:
            count=u16(sub+6)//2
            for n in range(count):
                end=u16(sub+14+2*n);start=u16(sub+16+2*count+2*n)
                delta=u16(sub+16+4*count+2*n);position=sub+16+6*count+2*n
                offset=u16(position)
                for code in range(start,end+1):
                    index=u16(position+offset+2*(code-start)) if offset else code
                    if index and (index+delta)&0xffff:supported.add(code)
    return supported


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'drafts/ui-reviews/menu-material-v2/material-audit.json')
    args=parser.parse_args()
    folder=ROOT/'assets/ui/coastal'
    manifest=json.loads((folder/'menu-materials.json').read_text())
    assets=[]
    for asset in manifest['assets']:
        path=folder/asset['path'];image=Image.open(path)
        assert hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256'],path
        assert list(image.size)==asset['size'] and image.mode=='RGBA',path
        extrema=image.getchannel('A').getextrema()
        assert extrema[0]==0 and extrema[1]>200,(path,extrema)
        assets.append({'path':asset['path'],'size':list(image.size),'bytes':path.stat().st_size,'alpha':extrema})
    # Baked context hints must be completely hidden under the live key controls.
    hint_alpha=Image.open(folder/'menu-hint-paper.png').getchannel('A')
    assert hint_alpha.crop((1370,877,1630,914)).getextrema()==(255,255)
    paper_inputs=json.loads((folder/'masters/paper-inputs.json').read_text())
    for item in paper_inputs['assets']:
        assert hashlib.sha256((folder/item['name']).read_bytes()).hexdigest()==item['sha256']
    font_folder=ROOT/'assets/fonts/coastal-menu/ooohbaby'
    font_manifest=json.loads((font_folder/'manifest.json').read_text())
    for file in font_manifest['files']:
        assert hashlib.sha256((font_folder/file['path']).read_bytes()).hexdigest()==file['sha256']
    vietnamese='ăâđêôơưĂÂĐÊÔƠƯ'+''.join(chr(code) for code in range(0x1ea0,0x1efa))
    required=set(map(ord,vietnamese+unicodedata.normalize('NFD',vietnamese)))
    fonts=[]
    for path in [font_folder/'OoohBaby-Regular.ttf',
        ROOT/'assets/fonts/coastal-replica/cormorantgaramond/cormorant-garamond.ttf',
        ROOT/'assets/fonts/coastal-replica/sourceserif4/source-serif-4.ttf',
        ROOT/'assets/fonts/coastal-replica/dancingscript/dancing-script.ttf']:
        missing=required-glyphs(path)
        assert not missing,(path,sorted(hex(c) for c in missing))
        fonts.append({'path':path.relative_to(ROOT).as_posix(),'checkedVietnameseCodepoints':len(required),'missing':[]})
    report={'assets':assets,'fonts':fonts,'method':'Unicode cmap coverage (NFC + NFD), not a shaping-quality assertion',
            'totalPngBytes':sum(item['bytes'] for item in assets)}
    output=args.output.resolve()
    assert output.is_relative_to(ROOT/'drafts') or output.is_relative_to(ROOT/'docs/ui-reviews'),output
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,indent=2)+'\n')
    print(f"Six alpha PNGs/hash checks passed; four fonts cover {len(required)} Vietnamese codepoints (NFC/NFD).")


if __name__=='__main__':main()
