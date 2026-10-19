"""Capture six native menu tabs and check motion/lifecycle in a local browser."""
import argparse
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import uuid
from browser_cdp import DevTools

ROOT=Path(__file__).resolve().parent.parent
BROWSER=r'C:\Program Files\Google\Chrome\Application\chrome.exe'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url',default='http://127.0.0.1:8088')
    parser.add_argument('--skip-captures',action='store_true')
    args=parser.parse_args()
    assert args.base_url.startswith(('http://127.0.0.1:','http://localhost:'))
    output=ROOT/'drafts/menu-v2';output.mkdir(parents=True,exist_ok=True)
    url=args.base_url+'/tools/coastal-menu-v2-preview.html'
    if not args.skip_captures:
        for i,tab in enumerate(['cases','skills','equipment','team','map','settings'],1):
            subprocess.run([sys.executable,str(ROOT/'tools/capture_replica.py'),'--url',url+'?tab='+tab,'--screen','menu','--output',str(output/f'{i:02}-{tab}.png')],check=True)
    profile=ROOT/'drafts/browser-profiles'/('menu-v2-'+uuid.uuid4().hex)
    profile.mkdir(parents=True)
    client=None;process=None
    try:
        with (profile/'browser.log').open('wb') as log:
            process=subprocess.Popen([BROWSER,'--headless','--disable-gpu','--no-first-run','--no-default-browser-check',f'--user-data-dir={profile}','--remote-debugging-port=0','about:blank'],stdout=log,stderr=log,env={k.upper():v for k,v in os.environ.items()})
        deadline=time.monotonic()+30
        while not (profile/'DevToolsActivePort').is_file():
            if process.poll() is not None or time.monotonic()>deadline:raise RuntimeError('Chrome startup failed')
            time.sleep(.05)
        port=int((profile/'DevToolsActivePort').read_text().splitlines()[0])
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list',timeout=5) as response:pages=json.load(response)
        client=DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
        client.call('Page.enable')
        client.call('Emulation.setDeviceMetricsOverride',dict(width=1672,height=941,deviceScaleFactor=1,mobile=False))
        client.call('Page.navigate',{'url':url})
        while not client.evaluate('Boolean(window.menuV2Preview)'):
            if time.monotonic()>deadline:raise RuntimeError('Preview startup failed')
            time.sleep(.05)
        client.evaluate('document.fonts.ready',await_promise=True)
        phases=[]
        for ms in [0,3000,6000,9000]:
            result=client.evaluate('''(async()=>{
              const m=window.menuV2Preview.menu;m.selectTab('cases');m.effects.freeze(TIME);
              await Promise.all([...document.images].map(i=>i.decode()));
              await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
              const rect=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
              return {time:TIME,heading:rect(m.content.querySelector('h1')),paper:rect(m.content.querySelector('.mv-paper')),paths:[...m.node.querySelectorAll('[data-wave]')].map(n=>n.getAttribute('d'))};
            })()'''.replace('TIME',str(ms)),await_promise=True)
            phases.append(result)
            (output/f'motion-{ms:05}.png').write_bytes(base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data']))
        assert all(p['heading']==phases[0]['heading'] and p['paper']==phases[0]['paper'] for p in phases),'Text surfaces moved with waves'
        assert phases[0]['paths']!=phases[1]['paths'],'Wave contours did not change'
        lifecycle=client.evaluate('''(async()=>{
          const m=window.menuV2Preview.menu,stage=m.node.parentElement;
          const notify=visible=>m.node.dispatchEvent(new CustomEvent('coastal-visibility',{detail:{visible}}));
          for(let i=0;i<100;i++){m.selectTab(['cases','skills','equipment','team','map','settings'][i%6]);notify(false);m.node.remove();stage.append(m.node);notify(true);}
          m.open();m.effects.resume();await new Promise(r=>setTimeout(r,100));
          const before=m.effects.snapshot();notify(false);m.node.remove();await new Promise(r=>setTimeout(r,100));
          const hidden=m.effects.snapshot();stage.append(m.node);notify(true);await new Promise(r=>setTimeout(r,100));
          return {before,hidden,resumed:m.effects.snapshot(),roots:document.querySelectorAll('.menu-v2').length};
        })()''',await_promise=True)
        assert lifecycle['hidden']['running'] is False and lifecycle['roots']==1,lifecycle
        timing=client.evaluate('''(async()=>{
          const e=window.menuV2Preview.menu.effects;e.frameTimes=[];e.paintTimes=[];
          await new Promise(r=>setTimeout(r,12000));const result=e.performanceSummary();e.setReduced(true);
          return {timing:result,reduced:e.snapshot(),particles:[...e.root.querySelectorAll('.mv-particle')].map(n=>n.style.opacity)};
        })()''',await_promise=True)
        assert not timing['reduced']['running'] and all(p=='0' for p in timing['particles'])
        report=dict(browser=client.call('Browser.getVersion'),viewport=[1672,941],phases=phases,lifecycle=lifecycle,performance=timing,limit='Headless software-rendered timing and lifecycle evidence only; physical GPU/visual acceptance remains open.')
        (output/'motion-review.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print('Six-tab review: stationary UI, moving contours, 100 transitions, hidden pause, reduced motion verified')
        print(json.dumps(timing['timing']))
    finally:
        if client:
            try:client.call('Browser.close')
            except (OSError,RuntimeError):pass
            client.socket.close()
        if process and process.poll() is None:
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill();process.wait(timeout=5)

if __name__=='__main__':main()
