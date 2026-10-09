"""Read-only Chrome review: a real RAF loop, live media changes and WebM decoding."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request
from browser_cdp import DevTools

ROOT=Path(__file__).resolve().parent.parent
REVIEW=ROOT/'docs/ui-reviews/coastal-replica-stage4'


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    parser.add_argument('--review-version',type=int,default=3)
    args=parser.parse_args()
    client=None
    with tempfile.TemporaryDirectory(prefix='dialogue-motion-review-',ignore_cleanup_errors=True) as profile:
        with open(Path(profile)/'browser.log','wb') as log:
            process=subprocess.Popen([args.browser,'--headless','--disable-gpu','--no-first-run',
                f'--user-data-dir={profile}','--remote-debugging-port=0','about:blank'],stdout=log,stderr=log,
                env={k.upper():v for k,v in os.environ.items()})
        try:
            port_file=Path(profile)/'DevToolsActivePort';deadline=time.monotonic()+20
            while not port_file.exists():
                if time.monotonic()>deadline:raise RuntimeError('Chrome startup timeout')
                time.sleep(.05)
            port=int(port_file.read_text().splitlines()[0])
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:pages=json.load(response)
            client=DevTools(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
            client.call('Page.enable');client.call('Emulation.setDeviceMetricsOverride',{'width':1672,'height':941,'deviceScaleFactor':1,'mobile':False})
            client.call('Page.navigate',{'url':'http://127.0.0.1:8080/tools/coastal-replica-preview.html?version=4&view=ui-dark'})
            while not client.evaluate('document.documentElement.dataset.previewReady==="true"'):
                if time.monotonic()>deadline:raise RuntimeError('Preview readiness timeout')
                time.sleep(.05)
            realtime=client.evaluate('''(async()=>{
                const m=window.replicaPreview.stage.motion;
                m.setPaused(false);const start=m.snapshot(),wall=performance.now();
                await new Promise(resolve=>setTimeout(resolve,18000));
                return {start,end:m.snapshot(),wallMs:performance.now()-wall};
            })()''',await_promise=True)
            (REVIEW/'realtime-sample.json').write_text(json.dumps(realtime,indent=2)+'\n',encoding='utf-8')
            if realtime['end']['frameCount']-realtime['start']['frameCount']<250:raise RuntimeError('Live RAF loop below software review target; see realtime-sample.json')
            client.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
            reduced=client.evaluate('''(async()=>{await new Promise(resolve=>setTimeout(resolve,100));return window.replicaPreview.stage.motion.snapshot();})()''',await_promise=True)
            if not reduced['reduced'] or reduced['pendingFrame']:raise RuntimeError('Live reduced-motion change failed')
            client.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'no-preference'}]})
            resumed=client.evaluate('''(async()=>{await new Promise(resolve=>setTimeout(resolve,100));const m=window.replicaPreview.stage.motion,s=m.snapshot();m.setPaused(true);return s;})()''',await_promise=True)
            if resumed['reduced'] or not resumed['pendingFrame']:raise RuntimeError('Live media resume failed')
            media=[]
            for name in (f'loop-review-v{args.review_version}',f'interaction-review-v{args.review_version}',f'slow-review-v{args.review_version}'):
                result=client.evaluate('''(async()=>{
                    const video=document.createElement('video');video.muted=true;
                    video.src=SOURCE;await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error('WebM decode failed'));});
                    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
                    const context=canvas.getContext('2d');context.drawImage(video,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
                    let visiblePixels=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>0)visiblePixels++;
                    return {width:video.videoWidth,height:video.videoHeight,readyState:video.readyState,visiblePixels};
                })()'''.replace('SOURCE',json.dumps('/docs/ui-reviews/coastal-replica-stage4/'+name+'.webm')),await_promise=True)
                if [result['width'],result['height']]!=[1672,941] or result['visiblePixels']<100000:raise RuntimeError('Invalid/blank native video')
                media.append({'file':name+'.webm',**result})
            report={'version':1,'browser':client.call('Browser.getVersion'),'realtime':realtime,
                'liveReducedChange':reduced,'liveResume':resumed,'decodedMedia':media,
                'role':'Headless software review only; frame count is not device/GPU certification'}
            (REVIEW/'runtime-review.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
            print(f'Live 18s motion loop: {realtime["end"]["frameCount"]-realtime["start"]["frameCount"]} updates; media changes passed; 3 native WebM clips decoded.')
        finally:
            if client:client.socket.close()
            if process.poll() is None:
                process.terminate()
                try:process.wait(timeout=5)
                except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)


if __name__=='__main__':main()
