"""Exercise real browser source saves against disposable copies of authored data.

Run separately from other Chrome checks:
    python tools/review_authoring_source.py
The game modules/assets are served from the project; copied source/generated
files and all authoring writes belong exclusively to a temporary fixture root.
"""
import argparse
from contextlib import contextmanager
from functools import partial
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import uuid

if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.authoring_server import AuthoringHandler, create_server
from tools.authoring_write import AuthoringWriter, GENERATED, RESOURCES
from tools.browser_cdp import DevTools

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PATHS = sorted(set(RESOURCES.values()) | set().union(*GENERATED.values()) | {
    'content/ui/menu-layout-contract.json', 'content/maps/scene-contract.json',
    'content/maps/prefabs.json', 'content/locales/vi.js',
    'content/world/tileset.json', 'assets/pixel/atlas.json', 'assets/pixel/tiles.png',
})


@contextmanager
def source_fixture(repository=ROOT):
    repository = Path(repository).resolve(strict=True)
    parent = repository / 'tmp' / 'source-save-review'
    parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='fixture-', dir=parent) as temporary:
        root = Path(temporary)
        for relative in FIXTURE_PATHS:
            destination = root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(repository / relative, destination)
        yield root


def create_review_server(repository, fixture):
    repository, fixture = Path(repository).resolve(), Path(fixture).resolve()

    class FixtureHandler(AuthoringHandler):
        def translate_path(self, path):
            project_path = Path(super().translate_path(path))
            relative = project_path.relative_to(repository)
            copied = fixture / relative
            return str(copied if copied.is_file() else project_path)

    server = create_server(repository, enabled=True, writer=AuthoringWriter(fixture))
    server.RequestHandlerClass = partial(FixtureHandler, directory=str(repository))
    return server


def hashes(root):
    return {relative: hashlib.sha256((Path(root) / relative).read_bytes()).hexdigest()
            for relative in FIXTURE_PATHS}


BROWSER_PROBE = r'''(async()=>{
 const {SourceSaveClient}=await import('/tools/authoring/SourceSaveClient.js');
 const requests=[];
 const client=new SourceSaveClient({fetch:async(path,options)=>{
  const response=await fetch(path,options);
  requests.push({path,method:options.method||'GET',status:response.status,
   tokenSent:Boolean(options.headers?.['X-Authoring-Token']),credentials:options.credentials});
  return response;
 }});
 const check=(condition,code)=>{if(!condition)throw Error(code);};
 const digest=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const reports=[];
 for(const resourceId of ['menu-layout','scene/home']){
  const original=await client.getResource(resourceId),payload=structuredClone(original.payload);
  if(resourceId==='menu-layout'){payload.regions.resources.x+=1;payload.regions['skills-detail'].width+=20;payload.regions['equipment-slots'].columnGap+=16;}
  else {const object=payload.objects[0];object.overrides.offsetPx={x:object.overrides.offsetPx?.x===.25?0:.25,y:object.overrides.offsetPx?.y||0};payload.tiles[4][4]=payload.tiles[4][4]===2?4:2;}
  const saved=await client.saveResource(resourceId,{schemaVersion:1,baseHash:original.hash,payload});
  check(saved.sourceSaved&&saved.applied&&!saved.buildError,'SOURCE_NOT_APPLIED');
  check(saved.hash!==original.hash,'UNCHANGED_TEST_HASH');
  let conflict=null;
  try{await client.saveResource(resourceId,{schemaVersion:1,baseHash:original.hash,payload});}
  catch(error){conflict={code:error.code,status:error.status};}
  check(conflict?.code==='CONFLICT'&&conflict.status===409,'STALE_HASH_ACCEPTED');
  const invalid=structuredClone(payload);
  if(resourceId==='menu-layout')invalid.regions.resources.width=-1;else invalid.tiles[4][4]=true;
  let rejected=null;
  try{await client.saveResource(resourceId,{schemaVersion:1,baseHash:saved.hash,payload:invalid});}
  catch(error){rejected={code:error.code,status:error.status};}
  check(rejected?.code==='VALIDATION_FAILED'&&rejected.status===422,'INVALID_PAYLOAD_ACCEPTED');
  const after=await client.getResource(resourceId);
  check(after.hash===saved.hash,'REJECTED_REQUEST_CHANGED_SOURCE');
  const sourcePath=resourceId==='menu-layout'?'/content/ui/menu-layout.json':'/content/maps/scenes/home.json';
  const bytes=await (await fetch(sourcePath,{cache:'no-store'})).text();
  check(await digest(bytes)===saved.hash,'HASH_DOES_NOT_MATCH_SOURCE_BYTES');
  const suffix='?source-review='+Date.now();
  if(resourceId==='menu-layout'){
   const generated=await import('/content/ui/menu-layout-data.js'+suffix);
   check(generated.menuLayout.regions.resources.x===payload.regions.resources.x,'MENU_GENERATED_STALE');
   check(generated.menuLayout.regions['skills-detail'].width===payload.regions['skills-detail'].width&&generated.menuLayout.regions['equipment-slots'].columnGap===payload.regions['equipment-slots'].columnGap,'MENU_REGION_GENERATED_STALE');
  }else{
   const generated=await import('/content/maps/scenes-data.js'+suffix);
   check(generated.SCENE_SOURCE_HASHES.home===saved.hash,'WORLD_GENERATED_HASH_STALE');
   check(generated.SCENES.home.objects[0].overrides.offsetPx.x===payload.objects[0].overrides.offsetPx.x,'WORLD_GENERATED_STALE');
   check(generated.SCENES.home.tiles[4][4]===payload.tiles[4][4],'TILE_GENERATED_STALE');
  }
  reports.push({resourceId,beforeHash:original.hash,savedHash:saved.hash,
   sourceSaved:saved.sourceSaved,applied:saved.applied,conflict,rejected,
   rejectedRequestsPreservedSource:true,sourceBytesMatchHash:true,generatedReloadMatches:true});
 }
 check(requests.filter(r=>r.path==='/__authoring/session').length===1,'SESSION_BOOTSTRAP_NOT_REUSED');
 check(requests.filter(r=>r.method==='POST').every(r=>r.tokenSent&&r.credentials==='same-origin'),'TOKEN_OR_CREDENTIALS_MISSING');
 return {origin:location.origin,realFetch:true,resources:reports,requests};
})()'''


MENU_SAVE_PROBE = r'''(async()=>{
 const {t}=await import('/src/shared/text.js');
 const editor=window.menuEditor;
 editor.document.set('resources','x',editor.document.value.regions.resources.x+1);
 await editor.saveSource();
 const remote=await editor.sourceClient.getResource('menu-layout');
 if(editor.status.textContent!==t('authoring.sourceApplied')||remote.hash!==editor.serverHash||
    remote.payload.regions.resources.x!==editor.document.value.regions.resources.x)throw Error('MENU_SAVE_RELOAD_REGRESSION');
 return {hash:remote.hash,x:remote.payload.regions.resources.x,sourceApplied:true};
})()'''

WORLD_TILE_SAVE_PROBE = r'''(async()=>{
 const e=window.worldEditor;e.setEditLayer('tiles');
 const tile=e.document.draft.tiles[4][4]===2?4:2;
 e.document.applyTileEdits([{x:4,y:4,tile}]);await e.action('sourceSave');
 const remote=await e.sourceClient.getResource('scene/home');
 if(remote.hash!==e.document.sourceHash||remote.payload.tiles[4][4]!==tile||e.document.dirty)throw Error('TILE_SAVE_RELOAD_REGRESSION');
 return {hash:remote.hash,tile,sourceApplied:true};
})()'''


WORLD_FOUNDATION_PROBE = r'''(async()=>{
 const e=worldEditor,{prepareTilesetImport}=await import('/tools/authoring/TilesetImport.js');e.setEditLayer('tiles');
 const before=JSON.stringify(e.session.snapshot()),canvas=document.createElement('canvas');canvas.width=64;canvas.height=16;
 const ctx=canvas.getContext('2d');['#31833b','#f5b1c1','#5b321f','#307d50'].forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(i*16,0,16,16)});
 const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));
 const prepared=await prepareTilesetImport(new File([bytes],'foundation-fixture.png',{type:'image/png'}),{tilePixels:16,margin:0,spacing:0},e.tileCatalog);
 await e.importTileset(prepared);if(e.tilesetDocument.dirty)throw Error('IMPORT_NOT_SAVED: '+e.tilesetEditor.status.textContent);
 const ids=e.tileCatalog.tiles.filter(t=>t.atlasId===prepared.atlasId).map(t=>t.id),[grass,flowers,trunk,canopy]=ids;
 e.tilesetDocument.updateTiles([trunk],{collision:'solid'});e.tilesetDocument.updateTiles([canopy],{drawPriority:'above'});await e.saveTileset();
 if(e.tilesetDocument.dirty)throw Error('PROPERTIES_NOT_SAVED');
 e.document.applyLayerEdits('layer-1',[{x:4,y:4,tile:grass},{x:5,y:4,tile:grass},{x:6,y:4,tile:grass},{x:7,y:4,tile:5}]);
 e.document.applyLayerEdits('layer-2',[{x:4,y:4,tile:flowers},{x:5,y:4,tile:trunk}]);
 e.document.applyLayerEdits('layer-4',[{x:5,y:4,tile:canopy},{x:6,y:4,tile:canopy},{x:7,y:4,tile:canopy}]);
 const authored=e.document.exportJSON();e.document.undo();e.document.redo();if(e.document.exportJSON()!==authored)throw Error('LAYER_UNDO_REDO');
 await e.action('sourceSave');const remote=await e.sourceClient.getResource('scene/home');
 if(e.document.dirty||remote.payload.layers[3].tiles[4][7]!==canopy)throw Error('LAYER_SOURCE_SAVE: '+e.status.textContent);
 const {walkable}=await import('/src/pixel/maps.js');
 if(!walkable(e.world.map,6,4,[],e.tileCatalog)||walkable(e.world.map,7,4,[],e.tileCatalog)||walkable(e.world.map,5,4,[],e.tileCatalog))throw Error('LAYER_COLLISION');
 e.setMode('play');e.world.player={x:4,y:4,direction:'right'};e.world.step('right');if(e.world.walk)throw Error('WALKED_THROUGH_TRUNK');e.world.step('down');if(!e.world.walk)throw Error('WALKABLE_GROUND_BLOCKED');e.world.walk=null;e.world.clearInput();e.setMode('edit');
 if(JSON.stringify(e.session.snapshot())!==before)throw Error('SESSION_MUTATED');
 return{atlasId:prepared.atlasId,imagePath:prepared.payload.atlases.at(-1).imagePath,ids,sceneHash:remote.hash,sourceApplied:true,layerRoundTrip:true,collisionAndMovement:true};
})()'''

WORLD_FOUNDATION_RELOAD_PROBE = r'''(()=>{
 const e=worldEditor,catalog=e.tileCatalog,atlas=catalog.atlases.find(a=>a.sourceName==='foundation-fixture.png');
 if(!atlas||e.document.draft.schemaVersion!==2)throw Error('CATALOG_LAYER_RELOAD');
 const ids=catalog.tiles.filter(t=>t.atlasId===atlas.id).map(t=>t.id);
 if(e.document.draft.layers[1].tiles[4][4]!==ids[1]||e.document.draft.layers[3].tiles[4][7]!==ids[3])throw Error('PLACEMENTS_CHANGED');
 if(catalog.tiles.find(t=>t.id===ids[2]).collision!=='solid'||catalog.tiles.find(t=>t.id===ids[3]).drawPriority!=='above')throw Error('PROPERTIES_CHANGED');
 e.setMode('play');return{catalogReload:true,layerReload:true,propertiesReload:true,playtestReady:e.world.ready};
})()'''


def wait_for(client, expression, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if client.evaluate(expression):
            return
        time.sleep(.1)
    raise RuntimeError('BROWSER_READINESS_TIMEOUT')


def review(client, origin, timeout=40, menu_editor=True):
    # Use an existing inert JSON document so no game or editor boots during the
    # transport probe, while native same-origin fetch and module imports work.
    url = origin + '/content/ui/menu-layout.json'
    client.call('Page.navigate', {'url': url})
    wait_for(client, f'location.href==={json.dumps(url)}&&document.readyState==="complete"', timeout)
    report = client.evaluate(BROWSER_PROBE, await_promise=True)
    if menu_editor:
        cycles = []
        for cycle in range(2):
            url = origin + '/tools/coastal-menu-v2-preview.html?edit=1&source-review=' + str(cycle)
            client.call('Page.navigate', {'url': url})
            wait_for(client, f'location.href==={json.dumps(url)}&&document.readyState==="complete"&&Boolean(window.menuEditor)', timeout)
            cycles.append(client.evaluate(MENU_SAVE_PROBE, await_promise=True))
        report['menuEditor'] = {'saveReloadSecondSave': True, 'cycles': cycles}
        cycles=[]
        for cycle in range(2):
            url=origin+'/tools/world-editor.html?map=home&tile-save-review='+str(cycle)
            client.call('Page.navigate',{'url':url})
            wait_for(client, f'location.href==={json.dumps(url)}&&Boolean(window.worldEditor?.world.ready)',timeout)
            cycles.append(client.evaluate(WORLD_TILE_SAVE_PROBE,await_promise=True))
        report['tileEditor']={'saveReloadSecondSave':True,'cycles':cycles}
    url=origin+'/tools/world-editor.html?map=home&foundation=1'
    client.call('Page.navigate',{'url':url});wait_for(client,'Boolean(window.worldEditor?.world.ready)',timeout)
    report['foundation']=client.evaluate(WORLD_FOUNDATION_PROBE,await_promise=True)
    client.call('Page.reload',{'ignoreCache':True});wait_for(client,'Boolean(window.worldEditor?.world.ready)',timeout)
    report['foundation']['reload']=client.evaluate(WORLD_FOUNDATION_RELOAD_PROBE)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', type=Path, default=Path(r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    parser.add_argument('--output', type=Path, default=ROOT / 'docs/ui-reviews/data-authoring/source-save.json')
    parser.add_argument('--timeout', type=float, default=40)
    parser.add_argument('--skip-menu-editor', action='store_true', help='Run actual client transport without the menu reload regression.')
    args = parser.parse_args(argv)
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / 'docs/ui-reviews') or output.suffix != '.json':
        parser.error('output must be a JSON file below docs/ui-reviews')
    if not args.browser.is_file():
        parser.error('browser executable not found')
    output.parent.mkdir(parents=True, exist_ok=True)
    original_hashes = hashes(ROOT)
    report = {'status': 'running', 'fixtureOnlyWrites': True}
    client = process = None
    profile = ROOT / 'tmp' / ('source-save-browser-' + uuid.uuid4().hex)
    profile.mkdir(parents=True)
    try:
        with source_fixture(ROOT) as fixture:
            server = create_review_server(ROOT, fixture)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with (profile / 'browser.log').open('wb') as log:
                    process = subprocess.Popen([str(args.browser), '--headless', '--disable-gpu', '--no-first-run',
                        '--no-default-browser-check', f'--user-data-dir={profile}', '--remote-debugging-port=0',
                        'about:blank'], stdout=log, stderr=log, env={k.upper(): v for k, v in os.environ.items()})
                deadline = time.monotonic() + args.timeout
                port_file = profile / 'DevToolsActivePort'
                while not port_file.is_file():
                    if process.poll() is not None or time.monotonic() >= deadline:
                        raise RuntimeError('CHROME_STARTUP_FAILED')
                    time.sleep(.05)
                port = int(port_file.read_text().splitlines()[0])
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=5) as response:
                    pages = json.load(response)
                client = DevTools(next(page['webSocketDebuggerUrl'] for page in pages if page['type'] == 'page'))
                client.socket.settimeout(args.timeout)
                client.call('Page.enable')
                client.call('Runtime.enable')
                client.call('Emulation.setDeviceMetricsOverride', {'width': 1672, 'height': 1080, 'deviceScaleFactor': 1, 'mobile': False})
                report.update(review(client, f'http://127.0.0.1:{server.server_port}', args.timeout, not args.skip_menu_editor))
                image=fixture/report['foundation']['imagePath'];image_bytes=image.read_bytes()
                if hashlib.sha256(image_bytes).hexdigest()!=report['foundation']['atlasId']:raise RuntimeError('IMPORTED_IMAGE_HASH')
                image.write_bytes(b'corrupt fixture')
                client.call('Page.reload',{'ignoreCache':True});wait_for(client,'Boolean(window.worldEditor?.world.error)',args.timeout)
                report['foundation']['corruptImageRejected']=True
                image.write_bytes(image_bytes);client.call('Page.reload',{'ignoreCache':True});wait_for(client,'Boolean(window.worldEditor?.world.ready)',args.timeout)
                report['browser'] = client.call('Browser.getVersion')
                report['fixtureHashes'] = hashes(fixture)
                report['realSourcesUnchanged'] = hashes(ROOT) == original_hashes
                if not report['realSourcesUnchanged']:
                    raise RuntimeError('PROJECT_SOURCES_CHANGED_DURING_REVIEW')
                report['status'] = 'passed'
            finally:
                if client:
                    try:
                        client.call('Browser.close')
                    except (OSError, RuntimeError):
                        pass
                    client.socket.close()
                    client = None
                if process and process.poll() is None:
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
                server.shutdown()
                server.server_close()
                thread.join(timeout=3)
    except Exception as error:
        report.update(status='failed', error=str(error), realSourcesUnchanged=hashes(ROOT) == original_hashes)
        raise
    finally:
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{report["status"]}: {output}', flush=True)


if __name__ == '__main__':
    main()
