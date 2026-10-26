"""Deterministic, incremental PNG/atlas/Ogg renditions. Masters are never modified."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import wave
import zipfile
from local_environment import configure, require_venv_path, require_project_path
configure()
import PIL
require_venv_path(PIL.__file__, 'tool.pillow.outside_venv')
from PIL import Image

CODE_ROOT=Path(__file__).resolve().parents[2]
ID=re.compile(r'^[a-z0-9][a-z0-9_.:-]{0,79}$')
IMAGE_RECIPE_VERSION=1

def failure(code,source=''):return {'ok':False,'errors':[{'code':code,'sourceId':source,'pointer':'','relatedIds':[]}]}
def encoded(value):return (json.dumps(value,ensure_ascii=False,sort_keys=True,indent=2,allow_nan=False)+'\n').encode('utf-8')
def digest(data):return hashlib.sha256(data).hexdigest()
def local(root,name):
    target=(root/name).resolve();target.relative_to(root.resolve());return target

def write_changed(path,data):
    path=require_project_path(path)
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and path.read_bytes()==data:return
    temp=path.with_name('.'+path.name+'.tmp')
    try:temp.write_bytes(data);os.replace(temp,path)
    finally:
        if temp.exists():temp.unlink()

def ffmpeg_tool():
    import imageio_ffmpeg
    require_venv_path(imageio_ffmpeg.__file__, 'tool.imageio.outside_venv')
    path=require_venv_path(imageio_ffmpeg.get_ffmpeg_exe(), 'tool.ffmpeg.outside_venv')
    return path,imageio_ffmpeg.__version__,digest(path.read_bytes())

def png_bytes(image):
    buffer=io.BytesIO();image.convert('RGBA').save(buffer,format='PNG',optimize=True,compress_level=9);return buffer.getvalue()

def image_rendition(source,entry,maximum):
    """Normalize authored sheet regions into native frames; never change a master."""
    def box(value,keys):
        if not isinstance(value,dict) or set(value)!=set(keys):raise ValueError('image recipe shape')
        for key in keys:
            if type(value[key]) is not int or value[key]<(1 if key in ('width','height') else 0):raise ValueError('image recipe bounds')
        if max(value['width'],value['height'])>maximum:raise ValueError('image recipe dimensions')
    with Image.open(source) as opened:
        if opened.format!='PNG' or max(opened.size)>maximum:raise ValueError('image format/dimensions')
        image=opened.convert('RGBA')
    if 'crop' in entry:
        crop=entry['crop'];box(crop,('x','y','width','height'))
        if crop['x']+crop['width']>image.width or crop['y']+crop['height']>image.height:raise ValueError('image crop outside master')
        image=image.crop((crop['x'],crop['y'],crop['x']+crop['width'],crop['y']+crop['height']))
    if 'resize' in entry:
        resize=entry['resize']
        if not isinstance(resize,dict) or set(resize)!= {'width','height','sampling'}:raise ValueError('image resize shape')
        box({key:resize[key] for key in ('width','height')},('width','height'))
        if resize['sampling'] not in ('pixel','smooth'):raise ValueError('image sampling')
        image=image.resize((resize['width'],resize['height']),Image.Resampling.NEAREST if resize['sampling']=='pixel' else Image.Resampling.LANCZOS)
    if 'canvas' in entry:
        canvas=entry['canvas'];box(canvas,('x','y','width','height'))
        if canvas['x']+image.width>canvas['width'] or canvas['y']+image.height>canvas['height']:raise ValueError('image canvas outside bounds')
        padded=Image.new('RGBA',(canvas['width'],canvas['height']))
        padded.alpha_composite(image,(canvas['x'],canvas['y']));image=padded
    return image

def build(root,spec):
    root=Path(root).resolve()
    try:
        require_project_path(root)
        toolchain=json.loads((CODE_ROOT/'content/pipeline/toolchain.json').read_text(encoding='utf-8'))
        pinned={t['name']:t for t in toolchain['assetTools']}
        if pinned.get('Pillow',{}).get('version')!=PIL.__version__:return failure('tool.pillow.version')
        export=local(root,spec['exportRoot']);export.relative_to(root/'assets/exports')
        entries=spec['entries'];ids=set();licenses=spec.get('licenses',{})
        for entry in [*entries,*spec.get('atlases',[])]:
            if not ID.fullmatch(entry.get('id','')) or entry['id'] in ids:return failure('asset.id.invalid',entry.get('id',''))
            ids.add(entry['id'])
        for entry in entries:
            if entry.get('license') not in licenses:return failure('asset.license.unknown',entry['id'])
            if entry['kind']!='image' and any(key in entry for key in ('crop','resize','canvas')):return failure('asset.image_recipe.kind',entry['id'])
            source=local(root,entry['source']);source.relative_to(root/'assets/sources')
            if not source.is_file():return failure('asset.source.missing',entry['source'])
        state_path=root/'.cache/assets/build-state.json'
        previous=json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
        next_state={};manifest=[];rebuilt=[];by_id={e['id']:e for e in entries};input_hash={e['id']:digest(local(root,e['source']).read_bytes()) for e in entries}
        def emit(entry,key,produce):
            old=previous.get(entry['id']);old_resource=old.get('resource') if old else None
            if old and old['key']==key and old_resource:
                old_path=local(root,old_resource['path'].lstrip('/'))
                if old_path.is_file() and digest(old_path.read_bytes())==old_resource['hash']:
                    next_state[entry['id']]=old;manifest.append(old_resource);return
            data,metadata,extension=produce();content_hash=digest(data)
            filename=entry['id'].replace(':','_')+'.'+content_hash[:16]+'.'+extension;path=export/filename;write_changed(path,data)
            resource={'id':entry['id'],'kind':entry['kind'],'path':'/'+path.relative_to(root).as_posix(),'required':entry.get('required',True),'hash':content_hash,'bytes':len(data),'license':entry['license'],**metadata}
            for k in ['fallbackId','missingPolicy','dependencies']:
                if k in entry:resource[k]=entry[k]
            next_state[entry['id']]={'key':key,'resource':resource};manifest.append(resource);rebuilt.append(entry['id'])
        for entry in sorted(entries,key=lambda e:e['id']):
            source=local(root,entry['source']);key=digest(encoded({'entry':entry,'sourceHash':input_hash[entry['id']],'pillow':PIL.__version__}))
            if entry['kind']=='image':
                key=digest(encoded({'key':key,'imageRecipeVersion':IMAGE_RECIPE_VERSION}))
                def produce(entry=entry,source=source):
                    with image_rendition(source,entry,spec.get('maxImageDimension',4096)) as image:
                        return png_bytes(image),{'width':image.width,'height':image.height,'source':entry['source'],'sourceHash':input_hash[entry['id']]},'png'
                try:emit(entry,key,produce)
                except ValueError:return failure('asset.image_recipe.invalid',entry['source'])
            elif entry['kind']=='audio':
                path,wrapper,binary_hash=ffmpeg_tool();pin=pinned.get('imageio-ffmpeg',{})
                if wrapper!=pin.get('version') or binary_hash!=pin.get('binarySha256'):return failure('tool.ffmpeg.version',entry['id'])
                key=digest(encoded({'key':key,'ffmpeg':binary_hash}))
                def produce(entry=entry,source=source):
                    with wave.open(str(source),'rb') as audio:duration=audio.getnframes()/audio.getframerate()
                    target=root/'.cache/assets'/('audio-'+entry['id']+'.ogg');target.parent.mkdir(parents=True,exist_ok=True)
                    args=[str(path),'-nostdin','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libvorbis','-q:a',str(entry['quality']),'-ar',str(entry['sampleRate']),'-ac',str(entry['channels']),str(target)]
                    run=subprocess.run(args,capture_output=True,timeout=60)
                    if run.returncode:raise ValueError('audio conversion')
                    return target.read_bytes(),{'duration':duration,'source':entry['source'],'sourceHash':input_hash[entry['id']]},'ogg'
                emit(entry,key,produce)
            else:return failure('asset.kind.unsupported',entry['id'])
        for atlas in sorted(spec.get('atlases',[]),key=lambda a:a['id']):
            members=[by_id[id] for id in atlas['members']]
            if not members or any(m['kind']!='image' for m in members):return failure('asset.atlas.members',atlas['id'])
            if len({m['license'] for m in members})!=1:return failure('asset.atlas.license',atlas['id'])
            entry={**atlas,'kind':'image','license':members[0]['license'],'required':True}
            key=digest(encoded({'atlas':atlas,'members':members,'inputs':[input_hash[m['id']] for m in members],'pillow':PIL.__version__,'imageRecipeVersion':IMAGE_RECIPE_VERSION}))
            def produce(atlas=atlas,members=members):
                padding=atlas['padding'];maximum=atlas['maxSize'];x=y=padding;row_height=0;width=0;frames=[];images=[]
                for member in members:
                    img=image_rendition(local(root,member['source']),member,spec.get('maxImageDimension',4096))
                    if img.width+padding*2>maximum or img.height+padding*2>maximum:raise ValueError('atlas bounds')
                    if x+img.width+padding>maximum:x=padding;y+=row_height+padding;row_height=0
                    if y+img.height+padding>maximum:raise ValueError('atlas bounds')
                    frames.append({'id':member['id'],'x':x,'y':y,'width':img.width,'height':img.height});images.append(img);width=max(width,x+img.width+padding);x+=img.width+padding;row_height=max(row_height,img.height)
                height=y+row_height+padding;image=Image.new('RGBA',(width,height))
                for frame,img in zip(frames,images):image.alpha_composite(img,(frame['x'],frame['y']))
                return png_bytes(image),{'width':width,'height':height,'frames':frames},'png'
            emit(entry,key,produce)
        write_changed(state_path,encoded(next_state))
        return {'ok':True,'value':{'manifest':sorted(manifest,key=lambda r:r['id']),'rebuilt':rebuilt}}
    except (ValueError,KeyError,TypeError,OSError,ImportError,subprocess.SubprocessError):return failure('asset.build.failed')

def bundle_sources(root,spec,destination):
    root=Path(root).resolve();files=[]
    try:
        require_project_path(root)
        destination=require_project_path(destination)
        destination.relative_to(root)
        paths=sorted(set(e['source'] for e in spec['entries'])|set(spec.get('generationInputs',[])))
        Path(destination).parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
            for name in paths:
                path=local(root,name);path.relative_to(root/'assets/sources');raw=path.read_bytes();info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
                archive.writestr(info,raw);files.append({'path':name,'sha256':digest(raw),'bytes':len(raw)})
        return {'ok':True,'value':{'schemaVersion':1,'bundlePath':Path(destination).resolve().relative_to(root).as_posix(),'bundleVersion':spec.get('bundleVersion',1),'bundleSha256':digest(Path(destination).read_bytes()),'files':files}}
    except (ValueError,OSError):return failure('asset.bundle.failed')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=CODE_ROOT);parser.add_argument('--bundle',action='store_true');args=parser.parse_args();root=args.root.resolve()
    spec=json.loads((root/'content/assets/imports.json').read_text(encoding='utf-8'));result=build(root,spec)
    if result['ok']:
        write_changed(root/'content/assets/manifest.json',encoded(result['value']['manifest']))
        if args.bundle:
            bundled=bundle_sources(root,spec,root/spec['bundlePath'])
            if not bundled['ok']:result=bundled
            else:write_changed(root/'assets/ASSET-INVENTORY.json',encoded(bundled['value']))
    print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if result['ok'] else 1
if __name__=='__main__':raise SystemExit(main())
