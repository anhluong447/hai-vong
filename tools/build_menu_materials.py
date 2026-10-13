"""Deterministic offline PNG materials; no reference/scene pixels are sampled.

Pillow + numpy are authoring dependencies only. Run after build_menu_assets.py.
Original SVGs and scene/thumbnail/flower source images remain available.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/ui/coastal'
W, H = 1672, 941
RNG = np.random.default_rng(241013)


def noise(w, h, cell, rng=RNG):
    grid = rng.integers(0, 256, (max(2, h // cell + 2), max(2, w // cell + 2)), dtype=np.uint8)
    return np.asarray(Image.fromarray(grid).resize((w, h), Image.Resampling.BICUBIC), dtype=float) / 255 - .5


def save(name, rgb, alpha):
    data = np.dstack((np.clip(rgb, 0, 255).astype('uint8'), np.clip(alpha, 0, 255).astype('uint8')))
    Image.fromarray(data).save(OUT / name, optimize=True)


def bezier(start, c1, c2, end, count=100):
    t = np.linspace(0, 1, count)[:, None]
    return (1-t)**3*np.array(start)+3*(1-t)**2*t*np.array(c1)+3*(1-t)*t*t*np.array(c2)+t**3*np.array(end)


def panel():
    rng = np.random.default_rng(241014)
    # Existing perimeter control points: keep the open scene/actor envelope.
    points = [(480, 0)]
    curves = [((496.7,17.3),(550,73.8),(580,104)),((610,134.2),(624,155.7),(660,181)),
              ((696,206.3),(751.3,235.8),(796,256)),((840.7,276.2),(887.3,285.2),(928,302)),
              ((968.7,318.8),(1018.3,342.3),(1040,357)),((1061.7,371.7),(1062.7,368.2),(1058,390)),
              ((1053.3,411.8),(1017,454.3),(1012,488)),((1007,521.7),(1043,557.3),(1028,592)),
              ((1013,626.7),(948.3,667.8),(922,696)),((895.7,724.2),(897,742),(870,761)),
              ((843,780),(794.5,792.8),(760,810)),((725.5,827.2),(679.2,855),(663,864)),
              ((640,878),(480,915),(0,941))]
    for c1, c2, end in curves:
        points.extend(bezier(points[-1], c1, c2, end).tolist())
    points = np.array(points)
    yy, xx = np.mgrid[:H, :W]
    boundary = np.interp(np.arange(H), points[:, 1], points[:, 0])[:, None]
    distance = boundary - xx
    cloud = noise(W, H, 210, rng)
    bloom = noise(W, H, 62, rng)
    granule = noise(W, H, 3, rng)
    fibre = noise(W, H, 1, rng)
    # Feather inward, so a paint edge cannot take more space from the scene.
    edge = np.clip((distance - (bloom + granule*.12)*32) / 22, 0, 1)
    edge = edge*edge*(3-2*edge)
    edge[distance < 0] = 0
    glaze = np.exp(-np.maximum(distance, 0)/80) * (1+cloud*.9)
    pigment = cloud*32 + bloom*14 + fibre*2
    # Broad translucent blooms, with pigment pooling at their irregular margins.
    blooms = np.zeros((H, W))
    pooling = np.zeros((H, W))
    for cx,cy,rx,ry,amount in [(25,72,190,110,1),(55,590,92,190,.75),
        (730,360,255,88,.6),(355,830,270,100,.8),(930,660,180,110,1)]:
        radius=((xx-cx)/rx)**2+((yy-cy)/ry)**2 + bloom*.32
        blooms+=np.exp(-radius*2)*amount
        pooling+=np.exp(-((radius-1)/.18)**2)*amount
    wash = np.exp(-((yy-861+106*np.exp(-((xx-860)/240)**2))/44)**2)
    tip = np.exp(-((xx-1003)/102)**2-((yy-369)/57)**2)
    rgb = np.zeros((H, W, 3)) + [10, 38, 56]
    rgb += pigment[:, :, None]*[.28,.8,1]
    rgb += glaze[:, :, None]*[4,24,27] + wash[:, :, None]*[3,35,39]
    rgb += blooms[:, :, None]*[4,22,28] - pooling[:, :, None]*[3,9,8]
    rgb += tip[:, :, None]*[8,50,49]
    # Mid-scale watery pigment stays at the rim, rather than uniform grain.
    rim=np.clip(np.exp(-xx/85)+glaze*.8+tip*.4,0,1)
    rgb += (bloom*rim)[:, :, None]*[10,32,36]
    # Pigment lifted by dry brushing at the rim and at the left margin.
    worn = np.clip(glaze*.7 + np.exp(-xx/55)*.6 + wash*.25, 0, 1)
    fleck = np.clip((granule*.45+fibre*.45-.3)*4, 0, 1)*worn
    rgb += fleck[:, :, None]*[10,34,34]
    left_wash=np.exp(-xx/25)*np.clip(.15+bloom*.24,0,.3)
    # Left feather stays confined to the decorative rim, clear of live text.
    alpha = edge*255*(1-fleck*.12-left_wash)
    ink = Image.new('RGBA', (W,H))
    draw = ImageDraw.Draw(ink)
    for _ in range(40):
        y = int(rng.integers(210,825)); x = int(boundary[y,0]-rng.integers(-7,35))
        r = float(rng.uniform(.65,2.1))
        draw.ellipse((x-r,y-r,x+r,y+r), fill=(17,72,84,int(rng.integers(75,150))))
    for _ in range(18):
        y=int(rng.integers(25,670));x=int(rng.integers(2,25));r=float(rng.uniform(.7,1.8))
        draw.ellipse((x-r,y-r,x+r,y+r),fill=(35,117,130,110))
    save('menu-ink-wash.png', rgb, alpha)
    base = Image.open(OUT/'menu-ink-wash.png')
    base.alpha_composite(ink)
    base.save(OUT/'menu-ink-wash.png', optimize=True)


def deckle(w, h, seed, inset=1.5, rough=1.5):
    rng = np.random.default_rng(seed)
    image = Image.new('L', (w,h))
    draw = ImageDraw.Draw(image)
    x = np.arange(0,w,4)
    y = np.arange(0,h,4)
    points = [(int(a),float(inset+rng.random()*rough)) for a in x]
    points += [(float(w-1-inset-rng.random()*rough),int(a)) for a in y]
    points += [(int(a),float(h-1-inset-rng.random()*rough)) for a in reversed(x)]
    points += [(float(inset+rng.random()*rough),int(a)) for a in reversed(y)]
    draw.polygon(points, fill=255)
    return np.asarray(image.filter(ImageFilter.GaussianBlur(.35)), dtype=float)


def paper():
    w,h=680,136
    yy,xx=np.mgrid[:h,:w]
    grain=noise(w,h,1)*10+noise(w,h,24)*9
    age=2+6*(xx/w)+4*(yy/h)
    rgb=np.zeros((h,w,3))+[250,244,228]
    rgb+=grain[:,:,None]-age[:,:,None]*[.25,.55,1]
    # Nonrepeating fibre fragments and tiny foxing on the actual paper plate.
    save('menu-case-paper.png',rgb,deckle(w,h,31,0,1.8))
    image=Image.open(OUT/'menu-case-paper.png')
    fibres=Image.new('RGBA',(w,h)); draw=ImageDraw.Draw(fibres)
    for _ in range(750):
        x,y=RNG.integers(3,w-3),RNG.integers(3,h-3)
        draw.line((x,y,x+int(RNG.integers(1,4)),y+1),fill=(154,137,104,int(RNG.integers(10,35))))
    image.alpha_composite(fibres)
    image.save(OUT/'menu-case-paper.png',optimize=True)
    # Mask only: thumbnails remain their existing, unedited source images.
    w,h=490,240
    mask=deckle(w,h,52,2,4)
    yy,xx=np.mgrid[:h,:w]
    mask*=np.clip((xx+noise(w,h,5)*18)/38,0,1)
    save('menu-thumb-edge-mask.png',np.full((h,w,3),255),mask)


def brush():
    rng=np.random.default_rng(241015)
    w,h=335,75
    yy,xx=np.mgrid[:h,:w]
    cloud=noise(w,h,18,rng); grain=noise(w,h,1,rng)
    alpha=deckle(w,h,16,2,3)
    # Brush runs fade with natural, correlated lengths, not dark comb-like cuts.
    tip_length=np.asarray(Image.fromarray(rng.integers(0,256,(32,1),dtype=np.uint8)).resize((1,h),Image.Resampling.BICUBIC),dtype=float)[:,0]
    end=298+tip_length*.12
    alpha*=np.clip((end[:,None]-xx+noise(w,h,4,rng)*7)/23,0,1)
    rgb=np.zeros((h,w,3))+[247,205,98]
    rgb+=cloud[:,:,None]*[14,13,10]+grain[:,:,None]*9
    # Independent brush bristles taper off at different lengths.
    alpha*=1-np.clip((noise(w,h,2,rng)*.7+grain*.3-.17)*3,0,.7)*(xx/w)**6
    image=Image.fromarray(np.dstack((np.clip(rgb,0,255).astype('uint8'),alpha.astype('uint8'))))
    draw=ImageDraw.Draw(image)
    for y in range(10,69,10):
        draw.ellipse((7.5,y-2,11.5,y+2),fill=(35,86,87,160))
    image.save(OUT/'menu-nav-dry-brush.png',optimize=True)


def wave():
    # Authored curves keep the current crest envelopes; the layers are alpha PNGs.
    def contour(start, segments):
        pts=[start]
        for c1,c2,end in segments: pts.extend(bezier(pts[-1],c1,c2,end).tolist())
        pts=np.array(pts)
        return np.interp(np.arange(W),pts[:,0],pts[:,1])
    motion=json.loads((ROOT/'content/ui/coastal-menu-motion.json').read_text())
    crest=contour(motion['waveStart'],motion['waveCurves'])
    yy,xx=np.mgrid[:H,:W]
    d=yy-crest[None,:]
    grain=noise(W,H,1); cloud=noise(W,H,20)
    image=Image.new('RGBA',(W,H))
    for offset,depth,color,opacity in [(0,85,[31,137,149],.7),(12,75,[111,195,191],.52),(24,55,[179,219,204],.48)]:
        inside=d-offset+cloud*7
        alpha=np.clip(inside/4,0,1)*np.clip(1-inside/depth,0,1)*255*opacity
        alpha*=np.clip(.85+grain*.8+cloud*.4,.1,1)
        rgb=np.zeros((H,W,3))+color+grain[:,:,None]*28
        layer=Image.fromarray(np.dstack((np.clip(rgb,0,255).astype('uint8'),alpha.astype('uint8'))))
        image.alpha_composite(layer)
    # Speckled foam, concentrated near crests, plus thin hand-drawn wave lines.
    draw=ImageDraw.Draw(image)
    for _ in range(4500):
        x=int(RNG.integers(0,W)); y=float(crest[x]+RNG.uniform(0,45)); r=float(RNG.uniform(.3,1))
        draw.ellipse((x-r,y-r,x+r,y+r),fill=(242,245,222,int(RNG.integers(25,140))))
    for offset,opacity in [(7,220),(22,145)]:
        pts=[(x,float(crest[x]+offset+np.sin(x/34)*1.3)) for x in range(W)]
        draw.line(pts,fill=(248,248,226,opacity),width=2)
    image.save(OUT/'menu-tidal-wash.png',optimize=True)
    # Keep a small cream paper area behind keyboard hints, softly feathered into
    # the scene/newspaper; do not place an opaque cream band across the screen.
    horizontal=np.clip((xx-1290)/120,0,1)
    vertical=np.clip((yy-crest[None,:]-32)/26,0,1)
    rgb=np.zeros((H,W,3))+[245,239,221]+grain[:,:,None]*8
    # The context plate contains old printed key hints. Opaque paper hides them
    # locally, so only the live controls show, without altering that scene file.
    hint_cover=np.clip((xx-1320)/45,0,1)*np.clip((yy-850)/26,0,1)
    save('menu-hint-paper.png',rgb,np.maximum(horizontal*vertical,hint_cover)*255)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    panel();brush();wave()
    # Accepted paper and thumbnail alpha are immutable bitmap authoring inputs.
    paper_inputs=json.loads((OUT/'masters/paper-inputs.json').read_text())
    for item in paper_inputs['assets']:
        data=(OUT/'masters'/item['name']).read_bytes()
        assert hashlib.sha256(data).hexdigest()==item['sha256']
        (OUT/item['name']).write_bytes(data)
    names=['menu-ink-wash.png','menu-case-paper.png','menu-thumb-edge-mask.png',
           'menu-nav-dry-brush.png','menu-tidal-wash.png','menu-hint-paper.png']
    manifest={'version':2,'seed':241013,'source':'tools/build_menu_materials.py',
              'materialSeeds':{'panel':241014,'brush':241015,'wave':241013},
              'retainedPaperInputs':'assets/ui/coastal/masters/paper-inputs.json',
              'method':'offline procedural pigments/fibres/alpha; provisional hand-painted fidelity',
              'inputs':'Authored perimeter from existing menu; no scene/reference pixel extraction',
              'assets':[{'path':name,'size':list(Image.open(OUT/name).size),
                         'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest()} for name in names]}
    (OUT/'menu-materials.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print('Built six static RGBA menu materials; scene and thumbnail sources unchanged.')


if __name__=='__main__':
    main()
