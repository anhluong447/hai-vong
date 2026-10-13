"""Native menu phase captures, actual compositor safe-zone checks and frame timing."""
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request
import uuid

import numpy as np
from PIL import Image

from browser_cdp import DevTools

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'drafts/ui-reviews/menu-motion'
BROWSER=r'C:\Program Files\Google\Chrome\Application\chrome.exe'


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    config=json.loads((ROOT/'content/ui/coastal-menu-motion.json').read_text())
    folder=ROOT/'assets/ui/coastal'
    manifest=json.loads((folder/'menu-motion-manifest.json').read_text())
    for item in manifest['assets']:
        assert hashlib.sha256((folder/item['path']).read_bytes()).hexdigest()==item['sha256']
    seams={}
    for layer in config['waves']:
        pixels=np.asarray(Image.open(folder/f"menu-wave-{layer['id']}-tile.png"),dtype=int)
        error=max(int(np.abs(pixels[:,0]-pixels[:,-1]).max()),int(np.abs(pixels[0]-pixels[-1]).max()))
        assert error<=1,(layer['id'],error)
        seams[layer['id']]=error
    parent=ROOT/'drafts/browser-profiles';parent.mkdir(exist_ok=True)
    profile=(parent/('menu-motion-'+uuid.uuid4().hex)).resolve();assert profile.is_relative_to(parent.resolve())
    profile.mkdir();process=None;client=None
    try:
        with open(profile/'browser.log','wb') as log:
            process=subprocess.Popen([BROWSER,'--headless','--disable-gpu','--no-first-run',
                '--no-default-browser-check',f'--user-data-dir={profile}','--remote-debugging-port=0',
                '--hide-scrollbars','--force-device-scale-factor=1','about:blank'],stdout=log,stderr=log,
                env={k.upper():v for k,v in os.environ.items()})
        deadline=time.monotonic()+25
        while not (profile/'DevToolsActivePort').exists():
            if process.poll() is not None or time.monotonic()>deadline:raise RuntimeError('Chrome startup failed')
            time.sleep(.05)
        port=int((profile/'DevToolsActivePort').read_text().splitlines()[0])
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:pages=json.load(response)
        client=DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
        client.call('Page.enable');client.call('Emulation.setDeviceMetricsOverride',{'width':1672,'height':941,'deviceScaleFactor':1,'mobile':False})
        client.call('Page.navigate',{'url':'http://127.0.0.1:8080/tools/coastal-menu-preview.html?capture=1'})
        while not client.evaluate('Boolean(window.replicaCapture)'):
            if time.monotonic()>deadline:raise RuntimeError('Menu capture not ready')
            time.sleep(.05)
        captures=[]
        forbidden=np.asarray(Image.open(folder/'menu-wave-forbidden-core.png'))>0
        for percent in [0,25,50,75]:
            ms=config['longestPeriodMs']*percent/100
            for isolated in [False,True]:
                request={'screen':'menu','capture':{'clock':0,'motionTimeMs':0,'randomSeed':813},
                    'motionSampleMs':ms,'variant':'menu-wave-isolation' if isolated else 'stage'}
                state=client.evaluate('''(async()=>{
                    const state=await window.replicaCapture.prepare(REQUEST);
                    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
                    return state;
                })()'''.replace('REQUEST',json.dumps(request)),await_promise=True)
                png=base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
                name=f"{'wave-only' if isolated else 'motion'}-{percent:03}.png";(OUT/name).write_bytes(png)
                overlap=0;right=0
                if isolated:
                    pixels=np.asarray(Image.open(OUT/name).convert('RGB'))
                    # Compare with the same compositor without waves, so a fixed
                    # viewport fringe is not mistaken for painted wave pixels.
                    client.evaluate("window.menuPreview.menu.effects.waveRoot.style.setProperty('opacity','0','important')")
                    client.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))',await_promise=True)
                    blank=base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
                    blank_name=f'wave-background-{percent:03}.png';(OUT/blank_name).write_bytes(blank)
                    background=np.asarray(Image.open(OUT/blank_name).convert('RGB'))
                    changed=np.any(pixels!=background,axis=2)
                    client.evaluate("window.menuPreview.menu.effects.waveRoot.style.removeProperty('opacity')")
                    overlap=int(changed[forbidden].sum())
                    right=int(changed[:config['rightLimit']['y']+1,config['rightLimit']['x']:].sum())
                    assert overlap==0 and right==0,(name,overlap,right)
                captures.append({'file':name,'timeMs':ms,'percent':percent,'isolated':isolated,
                    'forbiddenPaintedPixels':overlap,'aboveRightLimitPixels':right,'state':state})
        performance=client.evaluate('''(async()=>{
            const menu=window.menuPreview.menu,e=menu.effects;
            menu.node.dataset.waveIsolation='false';menu.node.dataset.motion='full';e.resume();e.frames=[];
            await new Promise(resolve=>setTimeout(resolve,12000));
            const result=e.performanceSummary();e.freeze(0);return result;
        })()''',await_promise=True)
        reduced=client.evaluate('''(async()=>{
            const menu=window.menuPreview.menu,e=menu.effects;e.freeze(0,{reduced:true});
            await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            return e.snapshot();
        })()''',await_promise=True)
        png=base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
        (OUT/'reduced-motion.png').write_bytes(png)
        report={'browser':client.call('Browser.getVersion'),'viewport':[1672,941],'longestIdlePeriodMs':config['longestPeriodMs'],
            'captures':captures,'tileSeamMaxChannelError':seams,'performance':performance,'reduced':reduced,
            'safeZoneProof':'Fixed outer alpha mask outside all translating/bobbing children; swept flowers include 14px margin. Actual isolated browser pixels were checked.',
            'performanceLimit':'Chrome headless software (--disable-gpu), not certification for physical GPUs/mobile.'}
        (OUT/'motion-review.json').write_text(json.dumps(report,indent=2)+'\n')
        print(f"Four native phases + four actual wave-only captures: zero protected/right-limit painted pixels; pool {reduced['spriteCount']} sprites.")
        print('Frame timing: '+json.dumps(performance))
    finally:
        if client:client.socket.close()
        if process and process.poll() is None:process.terminate();process.wait(timeout=10)
        if profile.exists() and profile.is_relative_to(parent.resolve()):shutil.rmtree(profile,ignore_errors=True)


if __name__=='__main__':main()
