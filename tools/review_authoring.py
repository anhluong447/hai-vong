"""Compare locked menu geometry and capture authoring tools with real CDP input."""
import argparse
import base64
from contextlib import contextmanager
from functools import partial
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import threading
import time
import urllib.request
import uuid
from browser_cdp import DevTools
from serve import DevelopmentHandler
from http.server import ThreadingHTTPServer
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]


@contextmanager
def original_preview():
    """Reconstruct tracked pre-refactor code; share only unchanged local assets."""
    fixture = ROOT / 'tmp' / ('original-menu-' + uuid.uuid4().hex)
    fixture.mkdir(parents=True)
    archive = subprocess.run(['git', 'archive', '19fe9c3', 'content', 'src', 'styles', 'tools'], cwd=ROOT, check=True, capture_output=True).stdout
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        for member in source:
            if not member.isfile(): continue
            target = (fixture / member.name).resolve()
            if not target.is_relative_to(fixture): raise ValueError('Invalid fixture path')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.extractfile(member).read())

    class OriginalHandler(DevelopmentHandler):
        def translate_path(self, path):
            target = Path(super().translate_path(path))
            relative = target.relative_to(fixture)
            return str(ROOT / relative if relative.parts and relative.parts[0] == 'assets' else target)

        def log_message(self, *_args): pass

    with ThreadingHTTPServer(('127.0.0.1', 0), partial(OriginalHandler, directory=str(fixture))) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_port}'
        finally:
            server.shutdown()
            thread.join(timeout=3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8096')
    parser.add_argument('--dialogue-only', action='store_true', help='Review the corrected SVG dialogue editor against the original Stage 4')
    parser.add_argument('--workbenches-only', action='store_true', help='Review current editor chrome and native input without reconstructing historical fixtures')
    parser.add_argument('--output', type=Path, default=ROOT / 'docs/ui-reviews/data-authoring/after')
    args = parser.parse_args()
    assert args.base_url.startswith(('http://127.0.0.1:', 'http://localhost:'))
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / 'docs/ui-reviews'):
        parser.error('output must be below docs/ui-reviews')
    output.mkdir(parents=True, exist_ok=True)
    profile = ROOT / 'tmp' / ('authoring-review-' + uuid.uuid4().hex)
    profile.mkdir(parents=True)
    process = client = None
    try:
        with (profile / 'browser.log').open('wb') as log:
            process = subprocess.Popen([
                r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless',
                '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                f'--user-data-dir={profile}', '--remote-debugging-port=0', 'about:blank',
            ], stdout=log, stderr=log, env={k.upper(): v for k, v in os.environ.items()})
        deadline = time.monotonic() + 25
        port = None
        while port is None:
            try:
                port = int((profile / 'DevToolsActivePort').read_text().splitlines()[0])
                break
            except (FileNotFoundError, PermissionError, ValueError, IndexError):
                pass
            if process.poll() is not None or time.monotonic() > deadline:
                raise RuntimeError('Chrome startup failed')
            time.sleep(.05)
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:
            pages = json.load(response)
        client = DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type'] == 'page'))
        client.call('Page.enable')

        def viewport(width, height):
            client.call('Emulation.setDeviceMetricsOverride', dict(width=width, height=height, deviceScaleFactor=1, mobile=False))

        def open_page(path, ready, origin=None):
            client.call('Page.navigate', {'url': (origin or args.base_url) + path})
            until = time.monotonic() + 40
            while not client.evaluate(ready):
                if time.monotonic() > until:
                    raise RuntimeError(f'Page not ready: {path}')
                time.sleep(.1)
            settle()

        def settle():
            client.evaluate('(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()', await_promise=True)

        def capture(name):
            settle()
            (output / (name + '.png')).write_bytes(base64.b64decode(client.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})['data']))

        mouse_down = False

        def mouse(kind, x, y):
            nonlocal mouse_down
            if kind == 'mousePressed': mouse_down = True
            if kind == 'mouseReleased': mouse_down = False
            client.call('Input.dispatchMouseEvent', dict(type=kind, x=x, y=y, button='left' if mouse_down or kind == 'mouseReleased' else 'none', buttons=1 if mouse_down else 0, clickCount=1))
            client.evaluate('new Promise(r=>requestAnimationFrame(r))', await_promise=True)

        def click(selector):
            client.evaluate('document.querySelector(SELECTOR).scrollIntoView({block:"nearest"})'.replace('SELECTOR', json.dumps(selector)))
            settle()  # Commit page/panel scrolling to Chrome's input hit-test tree.
            point = client.evaluate("(()=>{const n=document.querySelector(SELECTOR),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()".replace('SELECTOR', json.dumps(selector)))
            hit = client.evaluate("(()=>{const n=document.querySelector(SELECTOR),h=document.elementFromPoint(POINT_X,POINT_Y);return {ok:n===h||n.contains(h),target:h?.outerHTML.slice(0,350),scrollY,viewport:innerHeight,rect:n.getBoundingClientRect().toJSON()};})()".replace('SELECTOR', json.dumps(selector)).replace('POINT_X', str(point['x'])).replace('POINT_Y', str(point['y'])))
            if not hit['ok']:
                capture('failed-native-click')
                raise AssertionError({'selector':selector,'point':point,'hit':hit})
            mouse('mousePressed', point['x'], point['y'])
            mouse('mouseReleased', point['x'], point['y'])

        def key(name, code, number, modifiers=0):
            for kind in ['keyDown', 'keyUp']:
                client.call('Input.dispatchKeyEvent', dict(type=kind, key=name, code=code, windowsVirtualKeyCode=number, modifiers=modifiers))

        if args.workbenches_only:
            reports = []
            for width, height in [(1400, 900), (390, 600)]:
                viewport(width, height)
                open_page('/tools/coastal-menu-v2-preview.html?edit=1', 'Boolean(window.menuEditor?.sharedCss.sheet)')
                before = client.evaluate('JSON.stringify(menuV2Preview.session.state)')
                click('#menu-object-browser input')
                client.call('Input.insertText', {'text': 'resources'})
                assert client.evaluate('menuEditor.browser.buttons.size===1')
                click('#menu-object-browser [data-object-id=resources]')
                key('ArrowDown', 'ArrowDown', 40)
                assert client.evaluate('menuEditor.document.history.length===0'), 'Object navigation must not move the document'
                client.evaluate('menuEditor.draw()')
                settle()
                start = client.evaluate("(()=>{const e=menuEditor,n=e.gizmo.querySelector('[data-region=resources]'),r=n.getBoundingClientRect();for(const fy of [.5,.25,.75])for(const fx of [.25,.5,.75]){const x=r.x+r.width*fx,y=r.y+r.height*fy;if(document.elementFromPoint(x,y)===n)return {x,y,scale:e.stage.node.getBoundingClientRect().width/1672};}throw new Error('No draggable surface');})()")
                mouse('mousePressed', start['x'], start['y'])
                mouse('mouseMoved', start['x']+24*start['scale'], start['y'])
                mouse('mouseReleased', start['x']+24*start['scale'], start['y'])
                assert client.evaluate('menuEditor.document.value.regions.resources.x===69&&menuEditor.document.history.length===1')
                key('z', 'KeyZ', 90, 2)
                assert client.evaluate('menuEditor.document.value.regions.resources.x===45')
                key('y', 'KeyY', 89, 2)
                assert client.evaluate('menuEditor.document.value.regions.resources.x===69')
                key('z', 'KeyZ', 90, 2)
                assert client.evaluate('JSON.stringify(menuV2Preview.session.state)') == before
                # Shared chrome roots need their own panel styling and scrolling.
                assert client.evaluate("getComputedStyle(menuEditor.panel).overflowY==='auto'&&getComputedStyle(menuEditor.header).display==='flex'")
                capture(f'workbench-menu-{width}')
                if width == 390:
                    click('.authoring-panel details summary')
                    client.evaluate('menuEditor.panel.scrollTop=menuEditor.panel.scrollHeight')
                    assert client.evaluate('menuEditor.panel.scrollTop>0')
                    capture('workbench-menu-390-properties')
                reports.append(dict(editor='menu', viewport=[width,height], nativeSearch=True, keyboardSelection=True, nativeDrag=24, undoRedo=True, sessionUnchanged=True, independentPanelScroll=True))
                for screen, region in [('hud','hud-resources'), ('dialogue','dialogue-flowers')]:
                    open_page('/tools/ui-layout-editor.html?screen='+screen, 'Boolean(window.uiPackEditor)')
                    click('#ui-object-browser input')
                    client.call('Input.insertText', {'text': region})
                    click('#ui-object-browser [data-object-id='+region+']')
                    assert client.evaluate('uiPackEditor.document.history.length===0')
                    key('ArrowRight', 'ArrowRight', 39)
                    values = 'regions' if screen == 'hud' else 'layout'
                    expression = f'uiPackEditor.document.draft.{values}[{json.dumps(region)}].x'
                    assert client.evaluate(expression) == 1, {'screen':screen,'width':width,'actual':client.evaluate(expression),'focus':client.evaluate('document.activeElement.tagName'),'selection':client.evaluate("document.querySelector('#ui-selection-id').textContent"),'history':client.evaluate('uiPackEditor.document.history.length')}
                    key('z', 'KeyZ', 90, 2)
                    assert client.evaluate(expression) == 0
                    key('y', 'KeyY', 89, 2)
                    assert client.evaluate(expression) == 1
                    key('z', 'KeyZ', 90, 2)
                    click('#ui-object-browser input')
                    key('Escape', 'Escape', 27)
                    assert client.evaluate("document.querySelector('#ui-object-browser input').value===''"), 'Escape should clear search'
                    client.evaluate("document.activeElement.blur();window.scrollTo(0,0)")
                    capture(f'workbench-{screen}-{width}')
                    reports.append(dict(editor=screen, viewport=[width,height], nativeSearch=True, keyboardNudge=True, undoRedo=True, escapeClearsSearch=True))
            report = {'browser':client.call('Browser.getVersion'), 'workbenches':reports}
            (output/'workbenches.json').write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2))
            return

        def compare_dialogue_editor():
            # Load at native scale from the first frame. Resizing already painted
            # SVG turbulence filters can retain a differently sampled raster.
            viewport(2166,1063)
            open_page('/tools/ui-layout-editor.html?screen=dialogue','Boolean(window.uiPackEditor)')
            start=client.evaluate("(()=>{const n=document.querySelector('[data-region=dialogue-panel]'),r=n.getBoundingClientRect();const x=r.left+r.width*.6,y=r.bottom-1;window.dialoguePointerEvents=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])window.addEventListener(name,e=>dialoguePointerEvents.push({type:e.type,target:e.target.className?.baseVal??e.target.className,region:e.target.dataset?.region,x:e.clientX,y:e.clientY}),true);return {x,y,scale:document.querySelector('#plane').getBoundingClientRect().width/1672,box:{x:r.x,y:r.y,w:r.width,h:r.height},hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,250)};})()")
            mouse('mouseMoved',start['x'],start['y'])
            mouse('mousePressed',start['x'],start['y'])
            mouse('mouseMoved',start['x']+20*start['scale'],start['y'])
            mouse('mouseReleased',start['x']+20*start['scale'],start['y'])
            assert client.evaluate('uiPackEditor.dialogueDocument.draft.layout["dialogue-panel"].x===20&&uiPackEditor.dialogueDocument.history.length===1'),{'start':start,'result':client.evaluate('({layout:uiPackEditor.document.draft.layout,history:uiPackEditor.document.history.length,events:dialoguePointerEvents,plane:document.querySelector("#plane").getBoundingClientRect().toJSON(),targets:uiPackEditor.dialogue.layoutTargets.get("dialogue-panel").map(n=>({child:n.firstChild.outerHTML.slice(0,180),bounds:n.getBoundingClientRect().toJSON()}))})')}
            client.evaluate('uiPackEditor.dialogueDocument.undo()')
            assert client.evaluate('uiPackEditor.dialogueDocument.draft.layout["dialogue-panel"].x===0')
            mouse('mousePressed',start['x'],start['y'])
            mouse('mouseMoved',start['x']+20*start['scale'],start['y'])
            for kind in ['keyDown','keyUp']:
                client.call('Input.dispatchKeyEvent',dict(type=kind,key='Escape',code='Escape',windowsVirtualKeyCode=27))
            mouse('mouseReleased',start['x']+20*start['scale'],start['y'])
            assert client.evaluate('uiPackEditor.dialogueDocument.draft.layout["dialogue-panel"].x===0&&uiPackEditor.dialogueDocument.pending===null')
            flower=client.evaluate("(()=>{const r=uiPackEditor.dialogue.svg.querySelector('[data-region=foreground-left]').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.5};})()")
            mouse('mouseMoved',flower['x'],flower['y'])
            mouse('mousePressed',flower['x'],flower['y'])
            mouse('mouseMoved',flower['x']+20*start['scale'],flower['y'])
            mouse('mouseReleased',flower['x']+20*start['scale'],flower['y'])
            assert client.evaluate('uiPackEditor.dialogueDocument.draft.layout["dialogue-flowers"].x===20&&uiPackEditor.dialogueDocument.draft.layout["dialogue-panel"].x===0')
            capture('dialogue-objects-flowers')
            (output/'dialogue-objects-example.json').write_text(client.evaluate('uiPackEditor.dialogueDocument.export()'),encoding='utf-8')
            client.evaluate('uiPackEditor.dialogueDocument.undo();uiPackEditor.select("dialogue-brand")')
            capture('dialogue-objects-logo')
            client.evaluate('uiPackEditor.dialogue.setPresentation({logo:false});uiPackEditor.select("dialogue-panel")')
            settle();capture('dialogue-editor-native-workspace')
            client.evaluate("document.querySelector('.ui-pack-gizmo').hidden=true;uiPackEditor.dialogue.motion.freeze()")
            # Isolate the existing component node for a native visual gate;
            # the editor's scaled/clipped canvas has a different raster surface.
            client.evaluate("const host=uiPackEditor.dialogue.host;host.lang='vi';host.style.cssText='position:fixed;left:0;top:0;width:1672px;height:941px;z-index:2000;overflow:hidden';document.body.append(host)")
            settle()
            snapshot=client.evaluate("(()=>{const svg=uiPackEditor.dialogue.svg;return {svg:svg.outerHTML,styles:[...svg.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n);return {tag:n.tagName,region:n.dataset.region,asset:n.dataset.assetId,filter:s.filter,opacity:s.opacity,fill:s.fill,colorScheme:s.colorScheme,colorInterpolation:s.colorInterpolation,colorInterpolationFilters:s.colorInterpolationFilters,transform:s.transform};})};})()")
            (output/'dialogue-editor-structure.json').write_text(json.dumps(snapshot,indent=2)+'\n')
            clip=client.evaluate("(()=>{const b=uiPackEditor.dialogue.svg.getBoundingClientRect();return {x:b.x,y:b.y,width:1672,height:941,scale:1};})()")
            native=output/'dialogue-editor-native.png'
            native.write_bytes(base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False,'clip':clip})['data']))
            with Image.open(output/'dialogue-original-native.png') as before, Image.open(native) as after:
                delta=ImageChops.difference(before.convert('RGB'),after.convert('RGB'))
                maximum=max(hi for _lo,hi in delta.getextrema())
                mask=ImageChops.lighter(delta.getchannel('R'),ImageChops.lighter(delta.getchannel('G'),delta.getchannel('B')))
                changed=1672*941-mask.histogram()[0]
            comparison={'originalRevision':'19fe9c3','renderer':'Stage 4 SVG','objectCount':client.evaluate('Object.keys(uiPackEditor.dialogueDocument.draft.layout).length'),'componentIsolation':True,'maxChannelDifference':maximum,'changedPixels':changed,'differenceBounds':delta.getbbox(),'pointer':{'dragDesignPx':20,'oneHistoryEntry':True,'undo':True,'escapeCancel':True,'directFlowerSelectionAndDrag':True}}
            (output/'dialogue-replica-comparison.json').write_text(json.dumps(comparison,indent=2)+'\n')
            assert maximum<=2 and changed<=64,comparison
            return comparison

        if args.dialogue_only:
            viewport(1672,941)
            with original_preview() as original_origin:
                open_page('/tools/coastal-replica-preview.html?version=4&view=stage','document.documentElement.dataset.previewReady==="true"',original_origin)
                client.evaluate("document.body.classList.add('replica-capture');replicaPreview.stage.captureLocked=true;replicaPreview.stage.motion.freeze();replicaPreview.stage.setView('stage')")
                capture('dialogue-original-native')
            open_page('/tools/coastal-replica-preview.html?version=4&view=stage','document.documentElement.dataset.previewReady==="true"')
            client.evaluate("document.body.classList.add('replica-capture');replicaPreview.stage.captureLocked=true;replicaPreview.stage.motion.freeze();replicaPreview.stage.setView('stage')")
            capture('dialogue-current-native')
            snapshot=client.evaluate("(()=>{const svg=replicaPreview.stage.svg;return {svg:svg.outerHTML,styles:[...svg.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n);return {tag:n.tagName,region:n.dataset.region,asset:n.dataset.assetId,filter:s.filter,opacity:s.opacity,fill:s.fill,colorScheme:s.colorScheme,colorInterpolation:s.colorInterpolation,colorInterpolationFilters:s.colorInterpolationFilters,transform:s.transform};})};})()")
            (output/'dialogue-current-structure.json').write_text(json.dumps(snapshot,indent=2)+'\n')
            viewport(1280,900)
            open_page('/tools/ui-layout-editor.html?screen=dialogue','Boolean(window.uiPackEditor)')
            capture('dialogue-editor')
            comparison=compare_dialogue_editor()
            report={'browser':client.call('Browser.getVersion'),'dialogueReplica':comparison}
            (output/'dialogue-correction-report.json').write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2));return

        viewport(1672, 941)
        open_page('/tools/coastal-menu-v2-preview.html', 'Boolean(window.menuV2Preview)')
        original = json.loads((ROOT / 'docs/ui-specs/authoring/menu-geometry.json').read_text())
        geometry = client.evaluate("""(async()=>{const {menuLayoutRegions}=await import('/content/ui/menu-layout-regions.js');const v=menuV2Preview.menu,result={};v.effects.setReduced(true);v.effects.freeze(0);for(const tab of ['cases','skills','equipment','team','map','settings']){v.selectTab(tab);await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));result[tab]={};for(const region of menuLayoutRegions){const n=v.node.querySelector(region.selector);if(n){const b=n.getBoundingClientRect();result[tab][region.id]={x:b.x,y:b.y,width:b.width,height:b.height};}}}return result;})()""", await_promise=True)
        differences = [{'tab': tab, 'region': region, 'field': field, 'before': value, 'after': geometry[tab][region][field], 'delta': abs(geometry[tab][region][field] - value)} for tab, regions in original.items() for region, bounds in regions.items() for field, value in bounds.items()]
        max_error = max(d['delta'] for d in differences)
        (output / 'geometry.json').write_text(json.dumps({'maxErrorPx': max_error, 'geometry': geometry, 'differences': differences}, indent=2) + '\n')
        assert max_error <= .5, [d for d in differences if d['delta'] > .5]
        for tab in original:
            client.evaluate(f'menuV2Preview.menu.selectTab({json.dumps(tab)})')
            capture('menu-' + tab)
        # Edge-state pixels can be reconstructed from the locked revision even
        # though the first M0 capture set contained normal tabs and the picker.
        variants = ['long-title','many-history','empty-history','long-list','energy-zero','energy-full','no-photo','skills-locked','team-empty','picker-empty']

        def capture_variants(origin, prefix):
            for variant in variants:
                fixture = variant not in ['skills-locked','team-empty','picker-empty']
                path = '/tools/coastal-menu-v2-preview.html' + ('?fixture=dossier&variant=' + variant if fixture else '')
                open_page(path, 'Boolean(window.menuV2Preview)', origin)
                script = "const v=menuV2Preview.menu;v.effects.setReduced(true);v.effects.freeze(0);"
                if variant == 'skills-locked': script += "v.model.points=0;for(const n of v.model.skills)n.disabled=true;v.selectTab('skills');"
                if variant == 'team-empty': script += "v.model.people=[];v.selectTab('team');"
                if variant == 'picker-empty': script += "v.model.items=[];v.selected.slot='head';v.selectTab('equipment');v.openPicker();"
                client.evaluate('(()=>{' + script + 'document.activeElement?.blur();})()')
                capture(prefix + '-' + variant)

        with original_preview() as original_origin:
            capture_variants(original_origin, 'original')
            open_page('/tools/coastal-replica-preview.html?version=4&view=stage', 'document.documentElement.dataset.previewReady==="true"', original_origin)
            client.evaluate("document.body.classList.add('replica-capture');replicaPreview.stage.captureLocked=true;replicaPreview.stage.motion.freeze();replicaPreview.stage.setView('stage')")
            capture('dialogue-original-native')
        capture_variants(args.base_url, 'current')
        variant_reports = []
        for variant in variants:
            before_path, after_path = output / ('original-' + variant + '.png'), output / ('current-' + variant + '.png')
            with Image.open(before_path) as before, Image.open(after_path) as after:
                delta = ImageChops.difference(before.convert('RGB'), after.convert('RGB'))
                difference = delta.getbbox()
                maximum = max(hi for _lo, hi in delta.getextrema())
                mask = ImageChops.lighter(delta.getchannel('R'), ImageChops.lighter(delta.getchannel('G'), delta.getchannel('B')))
                changed = before.width * before.height - mask.histogram()[0]
            variant_reports.append({'variant': variant, 'differenceBounds': difference, 'maxChannelDifference': maximum, 'changedPixels': changed, 'originalSha256': hashlib.sha256(before_path.read_bytes()).hexdigest(), 'currentSha256': hashlib.sha256(after_path.read_bytes()).hexdigest()})
        (output / 'variants.json').write_text(json.dumps({'originalRevision': '19fe9c3', 'reconstructed': True, 'variants': variant_reports}, indent=2) + '\n')
        # Permit sparse 2/255 channel rounding across Chrome compositor layers;
        # any larger paint difference fails rather than replacing the reference.
        assert all(item['maxChannelDifference'] <= 2 and item['changedPixels'] <= 64 for item in variant_reports), variant_reports
        input_reports = []
        for width, height in [(1672, 941), (1280, 720), (390, 844)]:
            viewport(width, height)
            open_page('/tools/coastal-menu-v2-preview.html?edit=1', 'Boolean(window.menuEditor?.css.sheet)')
            client.evaluate("menuEditor.select('resources');menuEditor.draw()")
            settle()  # Let Chrome commit the new outline into its input hit-test tree.
            start = client.evaluate("""(()=>{const e=menuEditor,n=e.gizmo.querySelector('[data-region="resources"]'),r=n.getBoundingClientRect();let p;for(const fy of [.5,.25,.75])for(const fx of [.25,.5,.75]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(!p&&document.elementFromPoint(x,y)===n)p={x,y};}if(!p)throw new Error('Selected outline has no draggable surface: '+JSON.stringify({x:r.x,y:r.y,width:r.width,height:r.height}));window.pointerReview=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture','blur'])window.addEventListener(name,event=>pointerReview.push({type:event.type,target:event.target.className,region:event.target.dataset?.region,buttons:event.buttons,pointer:event.pointerId,x:event.clientX,y:event.clientY,connected:event.target.isConnected}),true);return {...p,scale:e.stage.node.getBoundingClientRect().width/1672,state:JSON.stringify(menuV2Preview.session.state),history:e.document.history.length};})()""")
            mouse('mouseMoved', start['x'], start['y'])
            mouse('mousePressed', start['x'], start['y'])
            mouse('mouseMoved', start['x'] + 24 * start['scale'], start['y'])
            mouse('mouseReleased', start['x'] + 24 * start['scale'], start['y'])
            after = client.evaluate('({x:menuEditor.document.value.regions.resources.x,history:menuEditor.document.history.length,state:JSON.stringify(menuV2Preview.session.state),drag:menuEditor.drag})')
            assert after['x'] == 69 and after['history'] == start['history'] + 1 and after['state'] == start['state'] and after['drag'] is None, {'viewport': width, 'x': after['x'], 'history': after['history'], 'drag': after['drag'], 'events': client.evaluate('pointerReview')}
            client.evaluate('menuEditor.document.undo()')
            assert client.evaluate('menuEditor.document.value.regions.resources.x') == 45
            settle()
            # Real Escape cancels an in-flight drag, including pointer capture.
            mouse('mousePressed', start['x'], start['y'])
            mouse('mouseMoved', start['x'] + 24 * start['scale'], start['y'])
            for kind in ['keyDown', 'keyUp']:
                client.call('Input.dispatchKeyEvent', dict(type=kind, key='Escape', code='Escape', windowsVirtualKeyCode=27))
            mouse('mouseReleased', start['x'] + 24 * start['scale'], start['y'])
            assert client.evaluate('menuEditor.document.value.regions.resources.x===45&&menuEditor.drag===null')
            settle()
            handle = client.evaluate("(()=>{const r=menuEditor.gizmo.querySelector('[data-region=resources] .authoring-resize').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()")
            mouse('mousePressed', handle['x'], handle['y'])
            mouse('mouseMoved', handle['x'] + 24 * start['scale'], handle['y'])
            mouse('mouseReleased', handle['x'] + 24 * start['scale'], handle['y'])
            assert client.evaluate('menuEditor.document.value.regions.resources.width') == 268
            client.evaluate('menuEditor.document.undo()')
            assert client.evaluate('menuEditor.document.value.regions.resources.width') == 244
            capture(f'menu-editor-{width}')
            input_reports.append({'viewport': [width, height], 'scale': start['scale'], 'dragDesignPx': 24, 'resizeDesignPx':24, 'oneHistoryEntry': True, 'undo': True, 'escapeCancel': True, 'sessionUnchanged': True})
            if width == 1672:
                client.evaluate("menuEditor.document.set('resources','x',69)")
                capture('menu-authored-resources')
                client.evaluate("menuV2Preview.menu.selectTab('skills');menuEditor.refreshRegions();menuEditor.document.set('skills-detail','width',385)")
                capture('menu-authored-skills')
                client.evaluate("menuV2Preview.menu.selectTab('equipment');menuEditor.refreshRegions();menuEditor.document.set('equipment-slots','columnGap',80)")
                capture('menu-authored-equipment')
                (output / 'menu-example.json').write_text(client.evaluate('menuEditor.document.export()'), encoding='utf-8')
        viewport(420, 820)
        open_page('/tools/coastal-menu-v2-preview.html', 'Boolean(window.menuV2Preview)')
        client.evaluate('menuV2Preview.menu.effects.freeze(0)')
        capture('menu-mobile-420')
        viewport(1280, 900)
        open_page('/tools/world-editor.html', 'Boolean(window.worldEditor?.world?.ready)')
        client.evaluate("worldEditor.select('home-desk');worldEditor.world.draw(0)")
        settle()
        point = client.evaluate("""(()=>{const e=worldEditor,w=e.world,r=w.canvas.getBoundingClientRect(),o=e.document.draft.objects.find(o=>o.id==='home-desk'),p=w.screenPosition(o.x,o.y);return {x:r.left+p.x,y:r.top+p.y,step:16*r.width/w.canvas.width,state:JSON.stringify(e.session.snapshot())};})()""")
        mouse('mousePressed', point['x'], point['y'])
        mouse('mouseMoved', point['x'] + point['step'], point['y'])
        mouse('mouseReleased', point['x'] + point['step'], point['y'])
        assert client.evaluate("worldEditor.document.draft.objects.find(o=>o.id==='home-desk').x") == 6
        assert client.evaluate('worldEditor.document.undoStack.length') == 1
        assert client.evaluate('JSON.stringify(worldEditor.session.snapshot())') == point['state']
        capture('world-authored-desk')
        client.evaluate('worldEditor.document.undo()')
        assert client.evaluate("worldEditor.document.draft.objects.find(o=>o.id==='home-desk').x") == 5
        capture('world-editor-home')
        for map_id in ['yard', 'newsroom', 'street', 'interaction']:
            client.evaluate(f'worldEditor.switchMap({json.dumps(map_id)});worldEditor.world.draw(0)')
            capture('world-editor-' + map_id)
        open_page('/tools/ui-layout-editor.html', 'Boolean(window.uiPackEditor)')
        capture('hud-dialogue-editor')
        client.evaluate("uiPackEditor.setScreen('dialogue')")
        capture('dialogue-editor')
        dialogue_comparison=compare_dialogue_editor()
        report = {'browser': client.call('Browser.getVersion'), 'dialogueReplica':dialogue_comparison, 'maxMenuGeometryErrorPx': max_error, 'edgeVariantsCompared': len(variant_reports), 'edgeVariantMaxChannelDifference': max(item['maxChannelDifference'] for item in variant_reports), 'edgeVariantMaxChangedPixels': max(item['changedPixels'] for item in variant_reports), 'menuPointer': input_reports, 'worldPointer': {'dragTiles': 1, 'oneHistoryEntry': True, 'undo': True, 'sessionUnchanged': True}, 'mapsCaptured': ['home','yard','newsroom','street','interaction'], 'menuAuthoringExamples': ['resources.x:45->69','skills-detail.width:365->385','equipment-slots.columnGap:64->80']}
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, indent=2))
    finally:
        if client:
            try:
                client.call('Browser.close')
            except OSError:
                pass
            client.socket.close()
        if process:
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.terminate()


if __name__ == '__main__':
    main()
