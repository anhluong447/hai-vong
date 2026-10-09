"""Extract the existing world methods without changing movement/render behavior."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(root/'tools'))
from js_source import brace_end

path=root/'src/pixel/PixelWorld.js'
source=path.read_text(encoding='utf-8')
methods={}
for name in ['step','update','draw','resize']:
    match=re.search(r'^ '+name+r'\([^\n]*?\)\{',source,re.M)
    start=match.start()+1
    opening=match.end()-1
    end=brace_end(source,opening+1)+1
    methods[name]=(start,end,source[start:end])

draw=methods['draw'][2]
start=draw.index('const signs=')
end=draw.index(';',start)+1
signs=draw[start:end].replace('const signs=','export const MAP_SIGNS=')
signs_path=root/'content/maps/signs.js'
signs_path.write_text("import {t} from '../../src/shared/text.js';\n"+signs+'\n',encoding='utf-8')
draw=draw[:start]+draw[end:]
draw=draw.replace('signs[this.mapId]','MAP_SIGNS[this.mapId]')

for filename,names,imports in [
    ('WorldRenderer.js',['resize','draw'],"import {t} from '../shared/text.js';\nimport {clipFrame} from '../pixel/animation.js';\nimport {MAP_SIGNS} from '../../content/maps/signs.js';\n"),
    ('MovementSystem.js',['step','update'],"import {walkable} from '../pixel/maps.js';\nconst TILE=16,DIRECTIONS={down:[0,1],left:[-1,0],right:[1,0],up:[0,-1]};\n"),
]:
    code=imports+'\nexport class '+filename[:-3]+' {\n constructor(world) { this.world=world; }\n'
    for name in names:
        value=draw if name=='draw' else methods[name][2]
        opening=value.index('{')
        value=value[:opening+1]+'\n const world=this.world;\n'+value[opening+1:].replace('this.','world.')
        code+=value+'\n'
    code+='}\n'
    (root/'src/world'/filename).write_text(code,encoding='utf-8')

for name in sorted(methods,key=lambda name:methods[name][0],reverse=True):
    start,end,_=methods[name]
    argument='direction' if name=='step' else 'dt' if name=='update' else 'time' if name=='draw' else ''
    owner='movement' if name in ['step','update'] else 'renderer'
    source=source[:start]+f'{name}({argument}){{this.{owner}.{name}({argument});}}'+source[end:]
source=source.replace(",KEYS={w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'}",'')
start=source.index('  this.keydown=')
end=source.index('this.observer=new ResizeObserver',start)
source=source[:start]+'  this.movement=new MovementSystem(this);this.renderer=new WorldRenderer(this);this.input=new PixelInput(this);\n  '+source[end:]
start=source.index("window.removeEventListener('keydown'",source.index(' dispose()'))
source=source[:start]+'this.input.dispose();'+source[source.index(';}',start)+1:]
source="import {PixelInput} from '../world/PixelInput.js';\nimport {MovementSystem} from '../world/MovementSystem.js';\nimport {WorldRenderer} from '../world/WorldRenderer.js';\n"+source
path.write_text(source,encoding='utf-8')
print('Extracted input, movement and rendering from PixelWorld')
