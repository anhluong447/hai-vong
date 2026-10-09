"""Capture a ready replica stage through Chrome DevTools, using Python stdlib.

Unlike --window-size alone, device metrics fix the *content* viewport and DPR.
The referenceReview hook validates authoring tooling only; replicaCapture is the
R08 stage readiness contract. No game state is inferred from a screenshot.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import time
import urllib.request
from urllib.parse import urlparse
from browser_cdp import DevTools

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / 'docs/ui-specs/coastal-replica'
REFERENCE = ROOT / 'docs/ui-concepts/coastal-editorial-v1'



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--screen', required=True, choices=['dialogue', 'menu', 'hud', 'dossier'])
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--hook', choices=['replicaCapture', 'referenceReview'], default='replicaCapture')
    parser.add_argument('--variant', default='stage', help='Concrete preview view requested from replicaCapture')
    parser.add_argument('--compare-reference', action='store_true', help='Save native 50/50 overlay and 4x difference diagnostics')
    parser.add_argument('--compare-ui', action='store_true', help='Compare only the versioned UI mask exposed by the Stage 3 preview')
    parser.add_argument('--flat-lighting', action='store_true', help='Disable component lighting for an A/B native capture')
    parser.add_argument('--logo', action='store_true', help='Show the optional dialogue logo')
    parser.add_argument('--motion-time-ms', type=float, help='Sample Stage 4 ambient presentation time; game/fixture clock stays frozen')
    parser.add_argument('--record-motion', choices=['ambient','interaction','slow'], help='Encode native sampled UI frames as a WebM review, not a performance benchmark')
    parser.add_argument('--browser', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    args = parser.parse_args()
    if args.compare_reference and (args.variant != 'stage' or args.hook != 'replicaCapture'):
        parser.error('--compare-reference requires a stage replica capture')
    if args.compare_ui and (args.hook!='replicaCapture' or args.compare_reference):
        parser.error('--compare-ui requires replicaCapture and cannot use full-frame comparison')
    if args.compare_ui and args.variant not in ('stage', 'ui-light', 'ui-dark', 'ui-detail'):
        parser.error('--compare-ui requires a composed UI view')
    if urlparse(args.url).hostname not in ('localhost', '127.0.0.1'):
        raise ValueError('Capture URL must be the local project server')
    output = args.output.resolve()
    if output.suffix.lower() != '.png' or not output.is_relative_to(ROOT) or output.is_relative_to(REFERENCE) or output.is_relative_to(ROOT / '.git'):
        raise ValueError('Output must be a PNG in this workspace, outside locked references and .git')
    fixture = json.loads((SPEC / 'fixtures.json').read_text(encoding='utf-8'))
    supplemental = json.loads((SPEC / 'dialogue-production.json').read_text(encoding='utf-8')) if args.screen == 'dialogue' else {'catalog':{}}
    contract = {'screen': args.screen, 'capture': fixture['capture'], 'fixture': fixture['screens'][args.screen], 'catalog': {**fixture['catalog'],**supplemental['catalog']}, 'variant':args.variant, 'supplementalFixture':supplemental,
                'lighting':not args.flat_lighting,'logo':args.logo,'motionSampleMs':args.motion_time_ms}
    process, client = None, None
    with tempfile.TemporaryDirectory(prefix='coastal-capture-', ignore_cleanup_errors=True) as profile:
        try:
            with open(Path(profile) / 'browser.log', 'wb') as log:
                process = subprocess.Popen([
                    args.browser, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                    f'--user-data-dir={profile}', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
                    '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank',
                ], stdout=log, stderr=log, env={k.upper(): v for k, v in os.environ.items()})
            deadline = time.monotonic() + 15
            port_file = Path(profile) / 'DevToolsActivePort'
            while not port_file.is_file():
                if process.poll() is not None or time.monotonic() >= deadline:
                    raise RuntimeError('Chrome did not start DevTools')
                time.sleep(.05)
            port = int(port_file.read_text().splitlines()[0])
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=5) as response:
                pages = json.load(response)
            client = DevTools(next(page['webSocketDebuggerUrl'] for page in pages if page['type'] == 'page'))
            client.call('Page.enable')
            client.call('Runtime.enable')
            client.call('Emulation.setDeviceMetricsOverride', {'width':1672, 'height':941, 'deviceScaleFactor':1, 'mobile':False})
            client.call('Emulation.setLocaleOverride', {'locale':'vi-VN'})
            client.call('Emulation.setTimezoneOverride', {'timezoneId':'Asia/Bangkok'})
            client.call('Page.navigate', {'url':args.url})
            while not client.evaluate(f'Boolean(window.{args.hook})'):
                if time.monotonic() >= deadline:
                    raise RuntimeError(f'Missing window.{args.hook}; this stage has no capture contract')
                time.sleep(.05)
            expression = '''(async () => {
                const request = REQUEST;
                const api = window.HOOK;
                let state;
                if ('HOOK' === 'referenceReview') {
                    await api.ready;
                    if (document.getElementById('screen').value !== request.screen || !document.body.classList.contains('capture')) throw new Error('authoring capture mode/screen mismatch');
                    state = {screen:request.screen, kind:'reference-tooling-proof'};
                } else {
                    if (typeof api.prepare !== 'function') throw new Error('replicaCapture.prepare is missing');
                    state = await api.prepare(request);
                    if (!state?.ready || state.screen !== request.screen || state.clock !== request.capture.clock || state.motionTimeMs !== request.capture.motionTimeMs || state.randomSeed !== request.capture.randomSeed) throw new Error('production capture state differs from fixture');
                }
                await document.fonts.ready;
                await Promise.all(Array.from(document.images, async image => {
                    if (!image.complete) await new Promise((resolve,reject) => {image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});
                    if (!image.naturalWidth) throw new Error('image failed');
                    await image.decode();
                }));
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                return {state, viewport:[innerWidth,innerHeight], deviceScaleFactor:devicePixelRatio, scroll:[scrollX,scrollY], fonts:document.fonts.status};
            })()'''.replace('REQUEST', json.dumps(contract, ensure_ascii=True)).replace('HOOK', args.hook)
            ready = client.evaluate(expression, await_promise=True)
            if ready['viewport'] != [1672,941] or ready['deviceScaleFactor'] != 1 or ready['scroll'] != [0,0] or ready['fonts'] != 'loaded':
                raise RuntimeError(f'Capture environment differs from contract: {ready}')
            png = base64.b64decode(client.call('Page.captureScreenshot', {'format':'png', 'fromSurface':True,
                    'captureBeyondViewport':False, 'clip':{'x':0,'y':0,'width':1672,'height':941,'scale':1}})['data'])
            if struct.unpack('>II', png[16:24]) != (1672,941):
                raise RuntimeError('Screenshot dimensions differ from the native stage')
            browser = client.call('Browser.getVersion')
            report = {'version':1, 'url':args.url, 'screen':args.screen, 'hook':args.hook, 'environment':ready,
                      'browser':browser, 'renderer':'Chrome headless software; GPU/motion quality requires later real-browser review',
                      'captureSHA256':hashlib.sha256(png).hexdigest().upper(),
                      'fixtureSemanticSHA256':hashlib.sha256(json.dumps(fixture,ensure_ascii=False,separators=(',',':')).encode('utf-8')).hexdigest().upper(),
                      'gate':'capture evidence only; G2 requires visual review', 'contract':contract}
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(png)
            output.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            if args.compare_ui:
                diagnostics=client.evaluate('''(async()=>{
                    const {compareMasked,decode,digest}=await import('/tools/reference-comparison.js');
                    const api=window.replicaPreview.stage;
                    if (!api.scene.uiOnly || !api.manifest.comparisonMask) throw new Error('Missing Stage 3 UI comparison mask');
                    const mask=api.manifest.comparisonMask;
                    const sources=['/'+api.manifest.sourceReference,CANDIDATE,'/'+mask.file];
                    const blobs=await Promise.all(sources.map(async url=>{
                        const response=await fetch(url,{cache:'no-store'});
                        if(!response.ok)throw new Error('UI comparison resource failed');return response.blob();
                    }));
                    const hashes=await Promise.all(blobs.map(digest));
                    if(hashes[0]!==api.manifest.sourceReferenceSHA256 || hashes[2]!==mask.sha256) throw new Error('UI reference/mask hash changed');
                    const images=await Promise.all(blobs.map(decode));
                    const result=compareMasked(...images,1672,941);
                    return {report:{...result.report,sourcePaths:sources,sourceSHA256:hashes,maskUncertainty:mask.uncertainty},
                        overlay:result.overlay.toDataURL('image/png').split(',')[1],
                        difference:result.difference.toDataURL('image/png').split(',')[1]};
                })()'''.replace('CANDIDATE',json.dumps('/'+output.relative_to(ROOT).as_posix())),await_promise=True)
                for kind in ('overlay','difference'):
                    output.with_name(output.stem+'-ui-'+kind+'.png').write_bytes(base64.b64decode(diagnostics[kind]))
                output.with_name(output.stem+'-ui-comparison.json').write_text(json.dumps(diagnostics['report'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                print('Scoped UI comparison saved; context excluded outside conservative reference masks.')
            if args.compare_reference:
                diagnostics = client.evaluate('''(async () => {
                    const {compare,decode,digest} = await import('/tools/reference-comparison.js');
                    const layout = await (await fetch('/docs/ui-specs/coastal-replica/layouts.json')).json();
                    const screen = layout.screens.find(item => item.id === SCREEN);
                    const sources = ['/docs/ui-concepts/coastal-editorial-v1/'+screen.reference,CANDIDATE];
                    const blobs = await Promise.all(sources.map(async url => {
                        const response = await fetch(url,{cache:'no-store'});
                        if (!response.ok) throw new Error('Comparison resource failed');
                        return response.blob();
                    }));
                    const images = await Promise.all(blobs.map(decode));
                    const result = compare(...images,1672,941,screen.layers);
                    return {report:{...result.report,sourcePaths:sources,
                        sourceSHA256:await Promise.all(blobs.map(digest))},
                        overlay:result.overlay.toDataURL('image/png').split(',')[1],
                        difference:result.difference.toDataURL('image/png').split(',')[1]};
                })()'''.replace('SCREEN',json.dumps(args.screen)).replace('CANDIDATE',json.dumps('/'+output.relative_to(ROOT).as_posix())),await_promise=True)
                for kind in ('overlay','difference'):
                    evidence_path = output.with_name(output.stem+'-'+kind+'.png')
                    evidence_path.write_bytes(base64.b64decode(diagnostics[kind]))
                output.with_name(output.stem+'-comparison.json').write_text(json.dumps(diagnostics['report'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                print('Native overlay/difference saved; diagnostic only, G2 remains subject to visual review.')
            if args.record_motion:
                if ready['state'].get('kind')!='stage4-ui-motion':
                    raise ValueError('--record-motion requires the Stage 4 preview')
                fps=12
                duration=16000 if args.record_motion=='ambient' else 6000
                client.evaluate('''(() => {
                    const surface=document.createElement('canvas');surface.width=1672;surface.height=941;
                    const stream=surface.captureStream(0);
                    const type=['video/webm;codecs=vp9','video/webm;codecs=vp8'].find(MediaRecorder.isTypeSupported);
                    if(!type)throw new Error('WebM encoding unsupported');
                    const recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:10000000});
                    const chunks=[];recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
                    window.motionRecording={surface,stream,recorder,chunks,type};recorder.start();
                    const stage=window.replicaPreview.stage;stage.captureLocked=false;stage.motion.setPaused(true);
                })()''')
                started=time.monotonic()
                count=int(duration/1000*fps)
                samples=[]
                for index in range(count+1):
                    sample_ms=index*1000/fps
                    if args.record_motion=='interaction':
                        expression='''(() => {
                            const s=window.replicaPreview.stage,m=s.motion,i=INDEX;
                            if(i===0){m.setEnabled(true);m.setVisible(true,{replay:true});}
                            else m.advance(1000/12);
                            if(i===12)s.svg.querySelector('[data-choice-id="draft"]').dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
                            if(i===18)s.choose('draft');
                            if(i===24){s.svg.querySelector('[data-choice-id="draft"]').dispatchEvent(new PointerEvent('pointerout',{bubbles:true}));m.setVisible(false);}
                            if(i===25)m.setVisible(true);
                            if(i===36)m.setVisible(false);
                            if(i===42)m.setVisible(true,{replay:true});
                            return m.snapshot();
                        })()'''.replace('INDEX',str(index))
                    else:
                        presentation=sample_ms*(.25 if args.record_motion=='slow' else 1)
                        expression=f'window.replicaPreview.stage.motion.freeze({presentation}); window.replicaPreview.stage.motion.snapshot()'
                    state=client.evaluate(expression)
                    frame=client.call('Page.captureScreenshot',{'format':'jpeg','quality':95,'fromSurface':True,'captureBeyondViewport':False})['data']
                    client.evaluate('''(async()=>{
                        const r=window.motionRecording,image=new Image();image.src='data:image/jpeg;base64,'+FRAME;
                        await image.decode();r.surface.getContext('2d').drawImage(image,0,0);r.stream.getVideoTracks()[0].requestFrame();
                    })()'''.replace('FRAME',json.dumps(frame)),await_promise=True)
                    samples.append({'frame':index,'presentation':state})
                    delay=started+(index+1)/fps-time.monotonic()
                    if delay>0:time.sleep(delay)
                video=client.evaluate('''(async()=>{
                    const r=window.motionRecording;await new Promise(resolve=>{r.recorder.onstop=resolve;r.recorder.stop();});
                    const blob=new Blob(r.chunks,{type:r.type});r.stream.getTracks().forEach(track=>track.stop());
                    const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});
                    return {mimeType:r.type,bytes:blob.size,data:data.split(',')[1]};
                })()''',await_promise=True)
                video_bytes=base64.b64decode(video['data'])
                output.with_suffix('.webm').write_bytes(video_bytes)
                output.with_name(output.stem+'-motion.json').write_text(json.dumps({
                    'version':1,'sequence':args.record_motion,'width':1672,'height':941,'fpsRequested':fps,
                    'sampleDurationMs':duration,'wallDurationSeconds':time.monotonic()-started,
                    'frameCount':len(samples),'mimeType':video['mimeType'],'sha256':hashlib.sha256(video_bytes).hexdigest().upper(),
                    'renderer':'Native CDP frames; JPEG quality 95; browser Canvas/WebM encoding; no art asset edits',
                    'role':'sampled visual review; browser encoder timing is not realtime UI/device performance certification',
                    'sourceCapture':output.name,'samples':samples},indent=2)+'\n',encoding='utf-8')
                print(f'Motion review saved: {output.with_suffix(".webm").relative_to(ROOT)}; {len(samples)} native frames.')
            print(f'Native capture: {output.relative_to(ROOT)}; viewport 1672x941 @ DPR 1; {ready["state"]["kind"] if "kind" in ready["state"] else "replica fixture"}')
        finally:
            if client:
                client.socket.close()
            if process and process.poll() is None:
                process.terminate()
                process.wait(timeout=10)


if __name__ == '__main__':
    main()
