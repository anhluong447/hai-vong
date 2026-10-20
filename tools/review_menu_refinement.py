"""Capture all refined menu tabs and interaction states at native resolution."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import uuid
from browser_cdp import DevTools

ROOT=Path(__file__).resolve().parent.parent


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url',default='http://127.0.0.1:8096')
    parser.add_argument('--output',type=Path,default=ROOT/'docs/ui-reviews/menu-refinement/native-v1')
    args=parser.parse_args()
    assert args.base_url.startswith(('http://127.0.0.1:','http://localhost:'))
    output=args.output.resolve()
    assert output.is_relative_to(ROOT) and not output.is_relative_to(ROOT/'.git')
    output.mkdir(parents=True,exist_ok=True)
    profile=ROOT/'tmp'/('menu-review-'+uuid.uuid4().hex);profile.mkdir(parents=True)
    process=None;client=None
    try:
        with (profile/'browser.log').open('wb') as log:
            process=subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe','--headless','--disable-gpu','--no-first-run','--no-default-browser-check',f'--user-data-dir={profile}','--remote-debugging-port=0','about:blank'],stdout=log,stderr=log,env={k.upper():v for k,v in os.environ.items()})
        deadline=time.monotonic()+25
        while not (profile/'DevToolsActivePort').is_file():
            if process.poll() is not None or time.monotonic()>deadline:raise RuntimeError('Chrome startup failed')
            time.sleep(.05)
        port=int((profile/'DevToolsActivePort').read_text().splitlines()[0])
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list',timeout=5) as response:pages=json.load(response)
        client=DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
        client.call('Page.enable')
        client.call('Emulation.setDeviceMetricsOverride',dict(width=1672,height=941,deviceScaleFactor=1,mobile=False))
        client.call('Page.navigate',{'url':args.base_url+'/tools/coastal-menu-v2-preview.html'})
        while not client.evaluate('Boolean(window.menuV2Preview)&&document.readyState==="complete"'):
            if time.monotonic()>deadline:raise RuntimeError('Preview startup failed')
            time.sleep(.1)
        reports=[]
        variants=[('01-cases','cases'),('02-skills','skills'),('03-equipment','equipment'),('04-team','team'),('05-map','map'),('06-settings','settings'),('07-picker','equipment')]
        for name,tab in variants:
            report=client.evaluate('''(async()=>{
              const v=window.menuV2Preview.menu;v.selectTab(TAB);v.effects.setReduced(true);v.effects.freeze(0);
              if(PICKER){v.selected.slot='accessory1';v.render();v.openPicker();}
              await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));
              document.activeElement?.blur();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
              const rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
              return {tab:TAB,picker:PICKER,viewport:[innerWidth,innerHeight],stage:rect(v.node),money:rect(v.node.querySelector('.mv-money')),papers:[...v.content.querySelectorAll('.mv-paper')].map(n=>({bounds:rect(n),scrollWidth:n.scrollWidth,clientWidth:n.clientWidth})),effects:v.effects.snapshot()};
            })()'''.replace('TAB',json.dumps(tab)).replace('PICKER',str(name=='07-picker').lower()),await_promise=True)
            if tab=='map':
                pin=client.evaluate("(()=>{const p=document.querySelector('[data-place=library]');p.focus();const b=p.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()")
                client.call('Input.dispatchMouseEvent',{'type':'mouseMoved',**pin})
                report['hover']=client.evaluate("(()=>{const p=document.querySelector('[data-place=library]');return {hovered:p.matches(':hover'),focused:p.matches(':focus'),selected:p.className,fill:getComputedStyle(p).backgroundColor,opacity:getComputedStyle(p).opacity,rules:[...document.styleSheets].flatMap(function scan(s){try{return [...s.cssRules].flatMap(r=>r.styleSheet?scan(r.styleSheet):r.selectorText&&p.matches(r.selectorText)?[{selector:r.selectorText,fill:r.style?.background}]:[]);}catch{return [];}})};})()")
            data=base64.b64decode(client.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})['data'])
            (output/(name+'.png')).write_bytes(data)
            report.update(sha256=hashlib.sha256(data).hexdigest(),browser=client.call('Browser.getVersion'))
            (output/(name+'.json')).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
            reports.append(report);print(name,flush=True)
        (output/'report.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')
        client.call('Page.navigate',{'url':args.base_url+'/pixel.html'})
        deadline=time.monotonic()+30
        while not client.evaluate('Boolean(window.pressPixel?.ready)'):
            if time.monotonic()>deadline:raise RuntimeError('Pixel runtime startup failed')
            time.sleep(.1)
        def key(value):
            codes={'Escape':27,'Tab':9,'Enter':13,'ArrowDown':40,'ArrowRight':39}
            for kind in ['keyDown','keyUp']:
                client.call('Input.dispatchKeyEvent',dict(type=kind,key=value,code=value,windowsVirtualKeyCode=codes[value]))
        client.evaluate('document.querySelector("canvas").focus()')
        key('Escape');key('ArrowDown');key('Tab');key('ArrowRight')
        assert client.evaluate('document.activeElement.dataset.skill')=='investigation-1'
        points=client.evaluate('window.pressGameplay.state.coastal.skillPoints')
        key('Enter');key('Enter')
        assert client.evaluate('window.pressGameplay.state.coastal.learned.includes("investigation-1")')
        assert client.evaluate('window.pressGameplay.state.coastal.skillPoints')==points-1
        key('Escape');assert client.evaluate('document.activeElement.dataset.skill')=='investigation-1'
        key('Escape');key('Escape');key('ArrowDown');key('ArrowDown');key('Tab');key('Enter');key('Enter')
        assert client.evaluate('window.pressGameplay.state.coastal.equipment.head')=='cap'
        assert client.evaluate('document.activeElement.dataset.slot')=='head'
        smoke=dict(realKeyboard=True,skill='investigation-1',pointsSpent=1,equippedSlot='head',item='cap',focusRestored=True)
        (output/'runtime-keyboard.json').write_text(json.dumps(smoke,indent=2)+'\n',encoding='utf-8')
        print('Runtime keyboard: learn, return, equip and focus restoration verified',flush=True)
    finally:
        if client:
            try:client.call('Browser.close')
            except (OSError,RuntimeError):pass
            client.socket.close()
        if process and process.poll() is None:
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)


if __name__=='__main__':main()
