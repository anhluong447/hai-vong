"""Inspect a source into a candidate definition; authoring owns accepting/writing it."""
import argparse
import json
from pathlib import Path
import wave
from PIL import Image
from build_assets import ID,local,digest,failure

def inspect(root,source,asset_id,license_id):
    root=Path(root).resolve()
    try:
        if not ID.fullmatch(asset_id) or not license_id:return failure('asset.import.metadata',source)
        path=local(root,source);path.relative_to(root/'assets/sources');raw=path.read_bytes()
        definition={'id':asset_id,'source':source,'license':license_id,'required':True,'sourceHash':digest(raw),'bytes':len(raw)}
        if path.suffix.lower()=='.png':
            with Image.open(path) as image:image.verify()
            with Image.open(path) as image:definition.update(kind='image',width=image.width,height=image.height)
        elif path.suffix.lower()=='.wav':
            with wave.open(str(path),'rb') as audio:definition.update(kind='audio',duration=audio.getnframes()/audio.getframerate(),sampleRate=audio.getframerate(),channels=audio.getnchannels())
        else:return failure('asset.import.format',source)
        return {'ok':True,'value':definition}
    except (ValueError,OSError,wave.Error):return failure('asset.import.failed',source)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('--id',required=True);parser.add_argument('--license',required=True);args=parser.parse_args();result=inspect(Path(__file__).resolve().parents[2],args.source,args.id,args.license);print(json.dumps(result,indent=2));raise SystemExit(not result['ok'])
