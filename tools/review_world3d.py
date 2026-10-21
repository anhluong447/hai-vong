"""Verify the 3D prototype with native CDP keys/pointers and local-only resources."""
import argparse
import base64
import json
import math
import os
from pathlib import Path
import statistics
import subprocess
import time
import urllib.request
import uuid
from browser_cdp import DevTools

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8096')
    parser.add_argument('--output', type=Path, default=ROOT / 'docs/ui-reviews/world3d-foundation')
    args = parser.parse_args()
    if not args.base_url.startswith(('http://127.0.0.1:', 'http://localhost:')):
        parser.error('loopback URL required')
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / 'docs/ui-reviews'):
        parser.error('output must be under docs/ui-reviews')
    output.mkdir(parents=True, exist_ok=True)
    profile = ROOT / 'tmp' / ('world3d-review-' + uuid.uuid4().hex)
    profile.mkdir(parents=True)
    client = process = None
    try:
        with (profile / 'browser.log').open('wb') as log:
            process = subprocess.Popen([
                r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless',
                '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                f'--user-data-dir={profile}', '--remote-debugging-port=0', 'about:blank',
            ], stdout=log, stderr=log, env={k.upper(): v for k, v in os.environ.items()})
        deadline = time.monotonic() + 25
        while True:
            try:
                port = int((profile / 'DevToolsActivePort').read_text().splitlines()[0])
                break
            except (FileNotFoundError, PermissionError, ValueError, IndexError):
                if process.poll() is not None or time.monotonic() > deadline:
                    raise RuntimeError('Chrome startup failed')
                time.sleep(.05)
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:
            pages = json.load(response)
        client = DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type'] == 'page'))
        client.call('Page.enable')
        client.call('Network.enable')
        client.call('Network.setBlockedURLs', {'urls': ['https://*']})

        def wait(expression):
            until = time.monotonic() + 25
            while not client.evaluate(expression):
                if time.monotonic() > until:
                    raise RuntimeError('Page state timed out: ' + expression)
                time.sleep(.05)

        def settle(milliseconds=0):
            client.evaluate(f'new Promise(r=>setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(r)),{milliseconds}))', await_promise=True)

        def capture(name):
            (output / (name + '.png')).write_bytes(base64.b64decode(client.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})['data']))

        def key(kind, name):
            client.call('Input.dispatchKeyEvent', dict(type=kind, key=name, code='Key'+name.upper() if len(name) == 1 else name,
                                                       windowsVirtualKeyCode={'Escape':27,'Enter':13,'Tab':9}.get(name, ord(name.upper()) if len(name) == 1 else 0)))

        def hold(names, milliseconds=150):
            for name in names:
                key('keyDown', name)
            settle(milliseconds)
            for name in names:
                key('keyUp', name)
            settle()

        def click_at(x, y):
            for kind in ['mousePressed', 'mouseReleased']:
                client.call('Input.dispatchMouseEvent', dict(type=kind, x=x, y=y, button='left', buttons=1 if kind=='mousePressed' else 0, clickCount=1))
            settle()

        def click(selector):
            point = client.evaluate("(()=>{const r=document.querySelector(SELECTOR).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()".replace('SELECTOR', json.dumps(selector)))
            click_at(point['x'], point['y'])

        def snapshot():
            return client.evaluate('world3dPreview.snapshot()')

        def move_to(x, z, record=False):
            trace = []
            for index in range(60):
                actor = snapshot()['actor']
                dx, dz = x-actor['x'], z-actor['z']
                if math.hypot(dx, dz) < .28:
                    return trace
                fx, fz = -11/math.sqrt(290), -13/math.sqrt(290)
                forward, right = dx*fx+dz*fz, dx*(-fz)+dz*fx
                threshold = math.hypot(dx, dz)*.3
                names = []
                if abs(forward) > threshold:
                    names.append('w' if forward > 0 else 's')
                if abs(right) > threshold:
                    names.append('d' if right > 0 else 'a')
                hold(names, 85 if math.hypot(dx, dz) < .6 else 145)
                trace.append(snapshot()['actor'])
                if record and index < 12:
                    capture(f'movement-frame-{index:02}')
            raise AssertionError({'goal':[x,z], 'actor':snapshot()['actor']})

        reports = []
        for width, height in [(1280,720), (390,844)]:
            client.call('Emulation.setDeviceMetricsOverride', dict(width=width,height=height,deviceScaleFactor=1,mobile=False))
            client.call('Page.navigate', {'url':args.base_url+'/world3d.html'})
            wait('Boolean(window.world3dPreview?.snapshot()?.ready)')
            client.call('Emulation.setFocusEmulationEnabled', {'enabled':True})
            settle()
            baseline = client.evaluate('JSON.stringify(world3dPreview.sessionSnapshot())')
            actor_before = snapshot()['actor']
            capture(f'room-{width}')
            gpu = client.evaluate("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:e?gl.getParameter(e.UNMASKED_VENDOR_WEBGL):null,renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()")
            npc = client.evaluate('world3dPreview.screenPosition("van")')
            assert npc['visible']
            click_at(npc['x'], npc['y'])
            assert not snapshot()['paused'] and snapshot()['actor']==actor_before, 'Out-of-range click must not teleport or open dialogue'
            client.evaluate('document.querySelector("canvas").focus()')
            key('keyDown','w');key('keyDown','Tab');key('keyUp','Tab');settle();focus_stopped=snapshot()['actor'];settle(120);key('keyUp','w')
            assert snapshot()['actor']==focus_stopped, 'Tab to UI must clear held movement'
            client.evaluate('document.querySelector("canvas").focus()')
            trace = move_to(.4,.15,record=width==1280)
            key('keyDown','e');key('keyUp','e');settle()
            assert snapshot()['paused'] and client.evaluate('!document.querySelector("[role=dialog]").hidden')
            capture(f'interaction-{width}')
            key('keyDown','Escape');key('keyUp','Escape');settle()
            click('[data-world3d-action=pause]')
            paused = snapshot()['actor'];hold(['w'])
            assert snapshot()['actor']==paused
            click('[data-world3d-action=resume]')
            assert client.evaluate('document.activeElement.tagName')=='CANVAS'
            hold(['s'],100)
            assert math.hypot(snapshot()['actor']['x']-paused['x'],snapshot()['actor']['z']-paused['z'])>.01
            move_to(5.6,1.5)
            hold(['s','d'],500)
            actor = snapshot()['actor']
            assert 5.4<=actor['x']<=5.78001 and actor['z']<=4.78001, actor
            key('keyDown','w');client.evaluate('window.dispatchEvent(new Event("blur"))');settle();stopped=snapshot()['actor'];settle(120);key('keyUp','w')
            assert snapshot()['actor']==stopped
            capture(f'wall-{width}')
            diagnostics=client.evaluate('world3dPreview.diagnostics()')
            resources=client.evaluate('performance.getEntriesByType("resource").map(r=>r.name)')
            assert all(url.startswith(args.base_url+'/') for url in resources), resources
            actual_loss=client.evaluate("(()=>{const ext=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;})()")
            assert actual_loss, 'Real context-loss extension required for this review'
            wait('world3dPreview.snapshot().disposed===true')
            capture(f'gpu-recovery-{width}')
            click('[data-world3d-action=retry]')
            wait('world3dPreview.snapshot().ready===true')
            assert client.evaluate('document.querySelectorAll("canvas").length')==1
            assert client.evaluate('JSON.stringify(world3dPreview.sessionSnapshot())')==baseline
            assert client.evaluate('localStorage.length')==0
            # A real history round trip catches blank-page restoration, whether
            # Chrome chooses BFCache or a full reload on this platform.
            previous=client.call('Page.getNavigationHistory')
            entry=previous['entries'][previous['currentIndex']]['id']
            client.evaluate('window.reviewPersisted=false;window.addEventListener("pageshow",e=>{window.reviewPersisted=e.persisted;})')
            click('a[href="pixel.html"]')
            wait('location.pathname.endsWith("/pixel.html")&&document.readyState==="complete"')
            client.call('Page.navigateToHistoryEntry', {'entryId':entry})
            wait('Boolean(window.world3dPreview?.snapshot()?.ready)')
            persisted=client.evaluate('window.reviewPersisted===true')
            assert client.evaluate('document.querySelectorAll("canvas").length')==1
            if snapshot()['paused']:
                click('[data-world3d-action=resume]')
            capture(f'history-return-{width}')
            times=sorted(diagnostics.pop('frameTimes'))
            reports.append({'viewport':[width,height],'nativeKeyboardAndPointer':True,'outOfRangeClickDoesNotTeleport':True,'movementTrace':trace,
                'pauseResumeAndFocus':True,'wallCollision':actor,'blurClearsHeldInput':True,'actualContextLossAndRetry':True,'oneCanvasAfterRetry':True,
                'sessionUnchanged':True,'storageEmpty':True,'localResourcesOnly':True,'httpsBlocked':True,'tabClearsHeldMovement':True,'historyRoundTrip':True,'persistedHistoryReturn':persisted,'gpu':gpu,'diagnostics':diagnostics,
                'frameTimeMs':{'sampleCount':len(times),'median':statistics.median(times) if times else None,'p95':times[min(len(times)-1,int(len(times)*.95))] if times else None,'hardwarePerformanceCertified':False}})
        report={'browser':client.call('Browser.getVersion'),'runs':reports,'artStatus':'Procedural room and prototype mannequins; final character art is M2','hardwarePerformanceCertified':False}
        (output/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print('World3D native review passed: 1280x720 and 390x844; movement, collision, interaction, pause, real GPU loss/retry, offline dependencies and session isolation.')
    except Exception:
        if client:
            try:
                capture('failure')
                print('Review failure state:',client.evaluate('window.world3dPreview?.snapshot()'))
            except (OSError,RuntimeError):
                pass
        raise
    finally:
        if client:
            try:client.call('Browser.close')
            except (OSError,RuntimeError):pass
            client.socket.close()
        if process and process.poll() is None:
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:process.terminate();process.wait(timeout=5)


if __name__=='__main__':
    main()
