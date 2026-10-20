"""Capture real pointer authoring at native and compact sizes, without source writes."""
import argparse
import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import uuid
from browser_cdp import DevTools

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8096')
    parser.add_argument('--output', type=Path, default=ROOT / 'tmp/world-authoring-review')
    args = parser.parse_args()
    if not args.base_url.startswith(('http://127.0.0.1:', 'http://localhost:')): parser.error('loopback base URL required')
    output = args.output.resolve()
    if not output.is_relative_to(ROOT) or output.is_relative_to(ROOT / '.git'): parser.error('output must be in the workspace')
    output.mkdir(parents=True, exist_ok=True)
    profile = ROOT / 'tmp' / ('world-review-' + uuid.uuid4().hex)
    profile.mkdir(parents=True)
    process = client = None
    try:
        with (profile / 'browser.log').open('wb') as log:
            process = subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={profile}', '--remote-debugging-port=0', 'about:blank'], stdout=log, stderr=log, env={key.upper(): value for key, value in os.environ.items()})
        deadline = time.monotonic() + 30
        while not (profile / 'DevToolsActivePort').exists():
            if process.poll() is not None or time.monotonic() > deadline: raise RuntimeError('Chrome startup failed')
            time.sleep(.05)
        port = int((profile / 'DevToolsActivePort').read_text().splitlines()[0])
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=5) as response: pages = json.load(response)
        client = DevTools(next(page['webSocketDebuggerUrl'] for page in pages if page['type'] == 'page'))
        client.call('Page.enable')
        client.call('Emulation.setDeviceMetricsOverride', {'width': 1400, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
        client.call('Page.navigate', {'url': args.base_url + '/tools/world-editor.html'})
        def wait(expression):
            limit = time.monotonic() + 20
            while not client.evaluate(expression):
                if time.monotonic() > limit: raise RuntimeError('World review timed out: ' + expression)
                time.sleep(.03)
        wait('Boolean(window.worldEditor?.world.ready)')
        before = client.evaluate('JSON.stringify(worldEditor.session.snapshot())')
        def capture(name):
            (output / (name + '.png')).write_bytes(base64.b64decode(client.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})['data']))
        def tile_pointer(width, height, name):
            client.call('Emulation.setDeviceMetricsOverride', dict(width=width,height=height,deviceScaleFactor=1,mobile=False))
            client.evaluate("worldEditor.document.reset();worldEditor.setMode('edit');worldEditor.setEditLayer('tiles');worldEditor.world.setEditorCamera({x:0,y:0});worldEditor.tileEditor.setPrimaryTile(2);worldEditor.tileEditor.setTool('brush')")
            time.sleep(.15)
            capture(name+'-palette')
            client.evaluate("document.querySelector('#world-stage').scrollIntoView({block:'center'});worldEditor.overlay.focus()")
            time.sleep(.1)
            point=client.evaluate("(()=>{const e=worldEditor,w=e.world,r=w.canvas.getBoundingClientRect(),scale=r.width/w.canvas.width,x=Math.max(1,Math.floor(w.camera.x/16)+2),y=Math.max(3,Math.floor(w.camera.y/16)+2);return {x:r.left+((x+.5)*16-w.camera.x)*scale,y:r.top+((y+.5)*16-w.camera.y)*scale,step:16*scale,gx:x,gy:y,history:e.document.undoStack.length,before:e.document.exportJSON()};})()")
            def mouse(kind,x,y):
                down=kind!='mouseReleased'
                client.call('Input.dispatchMouseEvent',dict(type=kind,x=x,y=y,button='left',buttons=1 if down else 0,clickCount=1))
                client.evaluate('new Promise(r=>requestAnimationFrame(r))',await_promise=True)
            mouse('mousePressed',point['x'],point['y'])
            mouse('mouseMoved',point['x']+2*point['step'],point['y'])
            assert client.evaluate('worldEditor.document.exportJSON()')==point['before']
            mouse('mouseReleased',point['x']+2*point['step'],point['y'])
            assert client.evaluate('worldEditor.document.undoStack.length')==point['history']+1
            assert client.evaluate(f'worldEditor.document.draft.tiles[{point["gy"]}].slice({point["gx"]},{point["gx"]+3}).every(t=>t===2)')
            capture(name+'-painted')
            client.evaluate('worldEditor.document.undo()')
            assert client.evaluate('worldEditor.document.exportJSON()')==point['before']
            mouse('mousePressed',point['x'],point['y'])
            mouse('mouseMoved',point['x']+point['step'],point['y'])
            for kind in ['keyDown','keyUp']:client.call('Input.dispatchKeyEvent',dict(type=kind,key='Escape',code='Escape',windowsVirtualKeyCode=27))
            mouse('mouseReleased',point['x']+point['step'],point['y'])
            assert client.evaluate('worldEditor.document.exportJSON()')==point['before']
            client.call('Input.dispatchKeyEvent',dict(type='keyDown',key=' ',code='Space',windowsVirtualKeyCode=32))
            mouse('mousePressed',point['x'],point['y'])
            mouse('mouseMoved',point['x']-point['step'],point['y']-point['step'])
            mouse('mouseReleased',point['x']-point['step'],point['y']-point['step'])
            client.call('Input.dispatchKeyEvent',dict(type='keyUp',key=' ',code='Space',windowsVirtualKeyCode=32))
            assert client.evaluate('Boolean(worldEditor.world.editorCamera)')
            assert client.evaluate('worldEditor.document.exportJSON()')==point['before']
            assert client.evaluate('JSON.stringify(worldEditor.session.snapshot())')==before
            return dict(viewport=[width,height],paintedCells=3,previewOnlyUntilRelease=True,oneUndo=True,escapeCancel=True,panWithoutDocumentChange=True)
        def drag(entity_id, dx):
            point = client.evaluate("""(()=>{const e=worldEditor; e.select(ID);const o=e.entity(),r=e.world.canvas.getBoundingClientRect(),p=e.world.screenPosition(o.x,o.y);return{x:r.left+p.x,y:r.top+p.y,delta:DELTA*e.world.scale*r.width/(e.world.canvas.width*e.world.scale),oldX:o.x};})()""".replace('ID', json.dumps(entity_id)).replace('DELTA', str(dx * 16)))
            client.call('Input.dispatchMouseEvent', {'type': 'mouseMoved', 'x': point['x'], 'y': point['y']})
            client.call('Input.dispatchMouseEvent', {'type': 'mousePressed', 'button': 'left', 'clickCount': 1, 'x': point['x'], 'y': point['y']})
            client.call('Input.dispatchMouseEvent', {'type': 'mouseMoved', 'buttons': 1, 'x': point['x'] + point['delta'], 'y': point['y']})
            client.call('Input.dispatchMouseEvent', {'type': 'mouseReleased', 'button': 'left', 'clickCount': 1, 'x': point['x'] + point['delta'], 'y': point['y']})
            actual = client.evaluate('worldEditor.entity().x')
            if actual != point['oldX'] + dx: raise AssertionError(f'Pointer drag: expected {point["oldX"] + dx}, got {actual}')
            return {'entity': entity_id, 'fromX': point['oldX'], 'toX': actual, 'clientDelta': point['delta']}
        capture('01-home-before')
        native = drag('bed', -1)
        assert client.evaluate('worldEditor.document.undoStack.length') == 1
        capture('02-home-dragged')
        client.evaluate("worldEditor.document.undo();worldEditor.document.redo();worldEditor.document.importJSON(worldEditor.document.exportJSON())")
        assert client.evaluate("worldEditor.document.draft.objects.find(o=>o.id==='bed').x") == 14
        client.evaluate("worldEditor.switchMap('street')")
        assert client.evaluate('worldEditor.document.draft.npcs.length') == 6
        assert client.evaluate("worldEditor.document.exportJSON().includes('leisure')")
        capture('03-street-authored-npcs')
        client.evaluate("worldEditor.switchMap('home');worldEditor.document.reset()")
        client.call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': False})
        # The compact camera crops the desk when centered on the original bed
        # spawn. Stand nearby before exercising a visible canvas target.
        client.evaluate("worldEditor.world.restore({mapId:'home',x:7,y:8,direction:'down'});worldEditor.world.draw(0)")
        client.evaluate("document.querySelector('#world-stage').scrollIntoView({block:'center'})")
        time.sleep(.15)
        compact = drag('home-desk', 1)
        capture('04-compact-dragged')
        assert client.evaluate('JSON.stringify(worldEditor.session.snapshot())') == before
        tile_reports=[tile_pointer(1400,900,'05-tiles-native'),tile_pointer(390,844,'06-tiles-compact')]
        report = {'tiles':tile_reports,'native': native, 'compact': compact, 'historyOneEntry': True, 'undoRedoRoundTrip': True, 'allAuthoredStreetNPCs': 6, 'hiddenSchedulePreserved': True, 'sessionUnchanged': True, 'browser': client.call('Browser.getVersion')}
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print('World editor: real pointer drag at 1400 and 390 px, undo/redo/export round trip, hidden schedules and session isolation verified')
    finally:
        if client:
            try: client.call('Browser.close')
            except (RuntimeError, OSError): pass
            client.socket.close()
        if process and process.poll() is None:
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired: process.kill(); process.wait(timeout=5)


if __name__ == '__main__': main()
