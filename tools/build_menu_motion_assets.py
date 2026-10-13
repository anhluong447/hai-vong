"""Offline periodic wave tiles, fixed protection masks and local foliage mask.

The approved context image is read only. No particle simulation or runtime noise.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from build_menu_materials import bezier

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/ui/coastal'
CONFIG=ROOT/'content/ui/coastal-menu-motion.json'


def rgba(path,rgb,alpha):
    rgb=np.broadcast_to(np.asarray(rgb),(*alpha.shape,3))
    Image.fromarray(np.dstack((np.clip(rgb,0,255).astype('uint8'),np.clip(alpha,0,255).astype('uint8')))).save(path,optimize=True)


def expanded_core(mask,padding):
    return mask.filter(ImageFilter.MaxFilter(padding*2+1))


def main():
    cfg=json.loads(CONFIG.read_text());w,h=cfg['stage'];top=cfg['waveTop']
    points=[cfg['waveStart']]
    for c1,c2,end in cfg['waveCurves']:points.extend(bezier(points[-1],c1,c2,end).tolist())
    points=np.array(points);crest=np.interp(np.arange(w),points[:,0],points[:,1])
    y,x=np.mgrid[:h-top,:w];depth=y+top-crest[None,:]
    generated=[]
    for index,layer in enumerate(cfg['waves']):
        inside=depth-layer['offset']
        alpha=np.clip(inside/3,0,1)*np.clip(1-inside/layer['depth'],0,1)*255*layer['opacity']
        if layer['id']=='foam':
            alpha=np.clip(inside/2,0,1)*np.exp(-np.maximum(inside,0)/16)*220
            # Two delicate crest lines; grain/foam lives in the drifting tile.
            alpha+=np.exp(-((inside-8)/.9)**2)*65+np.exp(-((inside-20)/1.1)**2)*38
        name=f"menu-wave-{layer['id']}-mask.png";rgba(OUT/name,[255,255,255],alpha);generated.append(name)
        tw,th=cfg['tile'];ty,tx=np.mgrid[:th,:tw]
        rng=np.random.default_rng(813+index);field=np.zeros((th,tw))
        # Integer Fourier modes ensure both tile boundaries match exactly.
        for _ in range(38):
            fx=int(rng.integers(1,85));fy=int(rng.integers(1,55));phase=float(rng.uniform(0,np.pi*2))
            field+=np.sin(2*np.pi*(fx*tx/(tw-1)+fy*ty/(th-1))+phase)/np.sqrt(fx+fy)
        field/=max(1,float(np.abs(field).max()))
        if layer['id']=='foam':
            alpha=np.clip((field+.06)*5,0,1)*240
            rgb=np.zeros((th,tw,3))+layer['color']
        else:
            alpha=np.full((th,tw),255)
            rgb=np.zeros((th,tw,3))+layer['color']+field[:,:,None]*18
        name=f"menu-wave-{layer['id']}-tile.png";rgba(OUT/name,rgb,alpha);generated.append(name)

    zones=cfg['safeZones'];core=Image.new('L',(w,h));draw=ImageDraw.Draw(core)
    for name in ['handNotebook','newspaper','centerLeaves']:draw.polygon(zones[name],fill=255)
    # Sweep the existing flower silhouette: padding includes its entire ±1.25° arc.
    flower=Image.open(ROOT/'assets/ui/coastal-replica/v3/exports/foreground-left-v2.png').getchannel('A')
    bx,by,bw,bh=zones['flowerBox'];scale=min(bw/flower.width,bh/flower.height)
    flower=flower.resize((round(flower.width*scale),round(flower.height*scale)),Image.Resampling.LANCZOS)
    flowers=Image.new('L',(w,h));flowers.paste(flower,(round(bx),round(by+bh-flower.height)))
    flower_binary=flowers.point(lambda a:255 if a>2 else 0)
    core=Image.fromarray(np.maximum(np.asarray(core),np.asarray(flower_binary)))
    core=expanded_core(core,zones['padding'])
    # Feather outside the zero-alpha core, never fade into a protected object.
    render_core=expanded_core(core,2)
    outer=expanded_core(render_core,8).filter(ImageFilter.GaussianBlur(zones['feather']))
    forbidden=np.maximum(np.asarray(render_core),np.asarray(outer))
    safe=255-forbidden
    # Independent hard contract, followed by a short outward gradient.
    right=np.arange(w)[None,:]>=cfg['rightLimit']['x']
    guard=np.clip((np.arange(h)[:,None]-cfg['rightLimit']['y'])/4,0,1)
    safe=np.where(right,safe*guard,safe)
    # Transparent outer rows prevent bilinear sampling of the opposite mask edge.
    safe[:2,:]=0;safe[-2:,:]=0
    rgba(OUT/'menu-wave-safe-mask.png',[255,255,255],safe[top:]);generated.append('menu-wave-safe-mask.png')
    core.save(OUT/'menu-wave-forbidden-core.png',optimize=True);generated.append('menu-wave-forbidden-core.png')

    # Upper leaves are baked into the plate. A feathered local patch avoids gaps;
    # it is a restrained fallback until a clean plate / isolated canopy is authored.
    scene=np.asarray(Image.open(OUT/'menu-context-plate.png').convert('RGB'),dtype=float)
    yy,xx=np.mgrid[:h,:w];r,g,b=scene[:,:,0],scene[:,:,1],scene[:,:,2]
    cx,cy,cw,ch=cfg['canopyBox']
    leaves=(xx>cx)&(yy<cy+ch)&(g>r*.78)&(g>b*1.2)&(g>35)
    canopy=Image.fromarray((leaves*255).astype('uint8')).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(3))
    rgba(OUT/'menu-top-leaves-mask.png',[255,255,255],np.asarray(canopy)[cy:cy+ch,cx:cx+cw]);generated.append('menu-top-leaves-mask.png')
    Image.open(OUT/'menu-context-plate.png').crop((cx,cy,cx+cw,cy+ch)).save(OUT/'menu-top-leaves-context.png',optimize=True)
    generated.append('menu-top-leaves-context.png')
    (ROOT/'content/ui/coastal-menu-motion.js').write_text('// Generated by tools/build_menu_motion_assets.py; edit the JSON source.\nexport const menuMotion = '+json.dumps(cfg,indent=2)+';\n',encoding='utf-8')
    manifest={'version':1,'source':str(CONFIG.relative_to(ROOT)),
        'contextSHA256':hashlib.sha256((OUT/'menu-context-plate.png').read_bytes()).hexdigest(),
        'assets':[{'path':n,'size':list(Image.open(OUT/n).size),'sha256':hashlib.sha256((OUT/n).read_bytes()).hexdigest()} for n in generated],
        'notes':'Fixed outer mask reserves the complete foliage sweep and hand/book/newspaper. Upper foliage uses a local plate patch; no scene bytes changed.'}
    (OUT/'menu-motion-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Built seamless wave tiles, fixed safe-zone/core masks and local canopy mask.')


if __name__=='__main__':main()
