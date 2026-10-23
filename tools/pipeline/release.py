"""Deterministic contained static export. Public orchestration supplies real gate receipts."""
import hashlib,json,os,re,shutil,tempfile,zipfile
from pathlib import Path
from local_environment import require_project_path
from project_sources import load_sources
from check_development import check as check_development,STATIC,DYNAMIC
from audit_assets import audit
from browser_runner import run_browser

CODE_ROOT=Path(__file__).resolve().parents[2]

def run_release(root,*,profile):
    from gates import required_receipts
    from release_checks import verify_export
    root=require_project_path(root)
    if profile not in read(root,'content/pipeline/release.json')['profiles']:return failed('release.profile.unknown',profile)
    checked=required_receipts(root)
    if not checked['ok']:return checked
    return assemble(root,profile=profile,output=root/'dist',receipts=checked['value'],verify=lambda staged:verify_export(root,staged))
def failed(code,source='release'):
    return {'ok':False,'errors':[{'code':code,'sourceId':source,'pointer':'/','relatedIds':[]}]}
def encoded(value):return (json.dumps(value,ensure_ascii=False,sort_keys=True,indent=2,allow_nan=False)+'\n').encode('utf-8')
def digest(raw):return hashlib.sha256(raw).hexdigest()
def local(root,name):
    path=(root/name).resolve();path.relative_to(root);return require_project_path(path)
def read(root,name):return json.loads(local(root,name).read_text(encoding='utf-8-sig'))

def input_fingerprint(root):
    root=require_project_path(root);policy=read(root,'content/pipeline/release.json');names=set(policy['inputFiles'])
    for folder in policy['inputRoots']:
        directory=local(root,folder)
        if directory.exists():names.update(path.relative_to(root).as_posix() for path in directory.rglob('*') if path.is_file() and '__pycache__' not in path.parts and path.suffix not in {'.pyc','.pyo'})
    values={name:digest(local(root,name).read_bytes()) if local(root,name).is_file() else None for name in sorted(names)}
    return digest(encoded(values))

def runtime_modules(root,entry):
    found=set()
    def visit(name):
        path=local(root,name);name=path.relative_to(root).as_posix()
        if name in found:return
        found.add(name);text=path.read_text(encoding='utf-8')
        for ref in STATIC.findall(text)+[match[1] for match in DYNAMIC.findall(text)]:
            target=(root/ref.lstrip('/') if ref.startswith('/') else path.parent/ref).resolve();target.relative_to(root);visit(target.relative_to(root).as_posix())
    visit(entry);return found

def audit_recovery(root,spec):
    inventory=read(root,'assets/ASSET-INVENTORY.json');bundle=local(root,inventory['bundlePath']);errors=[]
    if digest(bundle.read_bytes())!=inventory['bundleSha256']:return failed('asset.bundle.hash')
    entries={entry['path']:entry for entry in inventory['files']}
    required={entry['source'] for entry in spec['entries']}|set(spec.get('generationInputs',[]))
    if not required.issubset(entries):return failed('asset.bundle.inventory')
    with zipfile.ZipFile(bundle) as archive:
        if set(archive.namelist())!=set(entries):return failed('asset.bundle.inventory')
        for name,entry in entries.items():
            path=local(root,name);path.relative_to(root/'assets/sources');raw=archive.read(name)
            if len(raw)!=entry['bytes'] or digest(raw)!=entry['sha256'] or path.read_bytes()!=raw:errors.append({'code':'asset.source.stale','sourceId':name,'pointer':'/','relatedIds':[]})
    return {'ok':not errors,'errors':errors}

def audit_licenses(root,profile,manifest,spec):
    inventory=read(root,'content/pipeline/licenses.json');records=inventory['licenses'];ids={inventory['projectLicense'],*[asset['license'] for asset in manifest],*[entry['license'] for entry in spec['entries']]}
    for id in ids:
        record=records.get(id)
        if not record or any(not isinstance(record.get(key),str) or not record[key] for key in ['name','provenance','usage','notice']):return failed('release.license.unknown',id)
        if not record.get('productionApproved') and id not in profile['allowedInternalLicenses']:return failed('release.license.unapproved',id)
    tools=read(root,'content/pipeline/toolchain.json')
    dependencies={entry['name']:entry for entry in inventory['dependencies']}
    portable=read(root,'content/pipeline/portable-tools.json')['tools']
    for tool,name in [('python','CPython'),('chromium','Chrome for Testing'),('firefox','Firefox Nightly')]:
        if dependencies.get(name,{}).get('version')!=portable[tool]['version']:return failed('release.license.tool',name)
    for tool in tools['assetTools']:
        entry=dependencies.get(tool['name'])
        if not entry or entry['version']!=tool['version'] or entry['license']!=tool['license']:return failed('release.license.tool',tool['name'])
    for entry in inventory['dependencies']:
        if any(not isinstance(entry.get(key),str) or not entry[key] for key in ['name','version','license','role','source']):return failed('release.license.tool',entry.get('name',''))
    if any(asset['kind']=='font' for asset in manifest) and inventory['fonts']['policy']=='system-only':return failed('release.license.font')
    notices=['Hoi Am internal web artifact','',*[records[id]['name']+'\n'+records[id]['notice']+'\nProvenance: '+records[id]['provenance']+'\n' for id in sorted(ids)],'Build tools (not included in the browser payload):',*[entry['name']+' '+entry['version']+' — '+entry['license']+'\n'+entry['source'] for entry in inventory['dependencies']],'',inventory['fonts']['notice']]
    for entry in inventory['runtimeLibraries']:
        if not entry.get('noticeFile'):return failed('release.license.notice',entry.get('name',''))
        notices.append(local(root,entry['noticeFile']).read_text(encoding='utf-8'))
    return {'ok':True,'value':'\n'.join(notices)+'\n'}

def assemble(root,*,profile,output,receipts,verify=None):
    root=require_project_path(root);stage=None
    try:
        policy=read(root,'content/pipeline/release.json');configuration=policy['profiles'].get(profile)
        if not configuration:return failed('release.profile.unknown',profile)
        output=require_project_path(output);output.relative_to(root);project=read(root,'content/project.json');fingerprint=input_fingerprint(root)
        supplied={item['suite']:item for item in receipts}
        if len(supplied)!=len(receipts):return failed('release.gate.invalid')
        for suite in policy['requiredSuites']:
            receipt=supplied.get(suite)
            if not receipt:return failed('release.gate.missing',suite)
            if receipt.get('ok') is not True:return failed('release.gate.failed',suite)
            if receipt.get('fingerprint')!=fingerprint:return failed('release.gate.stale',suite)
            if receipt.get('contentVersion')!=project['contentVersion']:return failed('release.content.incompatible',suite)
        version=re.search(r'RUN_SCHEMA_VERSION\s*=\s*(\d+)',local(root,'src/contracts/RunSnapshot.js').read_text(encoding='utf-8'))
        if project['schemaVersion']!=policy['projectSchemaVersion'] or not version or int(version[1])!=policy['saveSchemaVersion']:return failed('release.content.incompatible')
        boundary=check_development(root)
        if boundary:return {'ok':False,'errors':boundary}
        spec=read(root,'content/assets/imports.json');manifest=read(root,'content/assets/manifest.json');recovery=audit_recovery(root,spec)
        if not recovery['ok']:return recovery
        checked=audit(root,manifest)
        if not checked['ok']:return checked
        licenses=audit_licenses(root,configuration,manifest,spec)
        if not licenses['ok']:return licenses
        sources=load_sources(root);payload={};documents=[]
        def add(name,raw):
            local(root,name)
            if name.startswith(('tools/','tests/','archive/','.cache/','assets/sources/')):raise ValueError('forbidden export')
            if name in payload and payload[name]!=raw:raise ValueError('conflicting output')
            payload[name]=raw
        for name in runtime_modules(root,policy['playerEntry']):add(name,local(root,name).read_bytes())
        for name in policy['staticFiles']:add(name,local(root,name).read_bytes())
        for path in local(root,policy['styleRoot']).rglob('*.css'):add(path.relative_to(root).as_posix(),path.read_bytes())
        for ref in project['packs']:
            pack_path=(root/'content'/ref).resolve();pack_path.relative_to(root);pack=json.loads(pack_path.read_bytes())
            if pack.get('version')!=project['contentVersion']:return failed('release.content.incompatible',ref)
            if pack.get('kind')=='development' and pack['id'] not in configuration['allowedDevelopmentPacks']:return failed('release.development-content',ref)
            keep=[]
            for entry in pack['documents']:
                if entry.get('authoringOnly'):continue
                path=(pack_path.parent/entry['path']).resolve();path.relative_to(root);name=path.relative_to(root).as_posix()
                if name.startswith('content/dev/') and not any(name.startswith(prefix) for prefix in configuration['allowedDevelopmentRoots']):return failed('release.development-content',name)
                data=json.loads(path.read_bytes())
                if entry['kind']=='config' and isinstance(data,dict) and data.get('kind') in ['authoring-ui','debug-ui','asset-imports']:return failed('release.development-content',name)
                if entry['kind']=='assets':data=[{key:value for key,value in asset.items() if key not in ['source','sourceHash']} for asset in data]
                keep.append(entry);documents.append({'kind':entry['kind'],'name':name,'data':data,'locale':entry.get('locale')})
            add(pack_path.relative_to(root).as_posix(),encoded({**pack,'documents':keep}))
        locales=[doc for doc in documents if doc['kind']=='locale'];keys=set().union(*(doc['data'].keys() for doc in locales));used=set()
        def strings(value):
            if isinstance(value,str) and value in keys:used.add(value)
            elif isinstance(value,dict):
                for item in value.values():strings(item)
            elif isinstance(value,list):
                for item in value:strings(item)
        for doc in documents:
            if doc['kind']!='locale':strings(doc['data'])
        for name,raw in payload.items():
            if name.endswith(('.js','.html')):
                for value in re.findall(r'''["']([^"'\n]+)["']''',raw.decode('utf-8')):strings(value)
        for doc in documents:add(doc['name'],encoded({key:value for key,value in doc['data'].items() if key in used} if doc['kind']=='locale' else doc['data']))
        runtime_project={**project,'schemas':{key:path for key,path in project['schemas'].items() if key not in policy['authoringSchemaKeys']}}
        add('content/project.json',encoded(runtime_project))
        for ref in runtime_project['schemas'].values():
            path=(root/'content'/ref).resolve();path.relative_to(root);add(path.relative_to(root).as_posix(),path.read_bytes())
        for asset in manifest:
            name=asset['path'].lstrip('/');path=local(root,name);path.relative_to(root/policy['assetRoot']);add(name,path.read_bytes())
        add('THIRD-PARTY-NOTICES.txt',licenses['value'].encode('utf-8'))
        add('CACHE-POLICY.json',encoded({'revalidate':['html','js','css','json'],'immutableAssetRoot':policy['assetRoot'],'maxAgeSeconds':policy['immutableMaxAgeSeconds'],'fingerprint':fingerprint}))
        add('_headers',('/*\n  Cache-Control: no-cache\n/'+policy['assetRoot'].strip('/')+'/*\n  Cache-Control: public, max-age='+str(policy['immutableMaxAgeSeconds'])+', immutable\n').encode('utf-8'))
        build={'schemaVersion':1,'profile':profile,'development':configuration['development'],'fingerprint':fingerprint,'contentVersion':project['contentVersion'],'saveSchemaVersion':policy['saveSchemaVersion'],'gates':policy['requiredSuites'],'files':{name:{'sha256':digest(raw),'bytes':len(raw)} for name,raw in sorted(payload.items())}}
        add('release-manifest.json',encoded(build));output.mkdir(parents=True,exist_ok=True);stage=Path(tempfile.mkdtemp(prefix='.release-stage-',dir=output)).resolve();stage.relative_to(output)
        for name,raw in payload.items():path=local(stage,name);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        validated=run_browser(CODE_ROOT,modules=[],page='/tools/workspace/validate.html',payload=load_sources(stage))
        if not validated['ok']:return validated
        evidence=verify(stage) if verify else None
        if evidence and not evidence['ok']:return {'ok':False,'errors':[{'code':'release.browser.failed','sourceId':'release','pointer':'/','relatedIds':[]}],'evidence':evidence}
        destination=local(output,profile+'/'+fingerprint[:20]);destination.parent.mkdir(parents=True,exist_ok=True)
        if destination.exists():
            existing={path.relative_to(destination).as_posix() for path in destination.rglob('*') if path.is_file()}
            if existing!=set(payload) or any(not local(destination,name).is_file() or local(destination,name).read_bytes()!=raw for name,raw in payload.items()):return failed('release.output.conflict')
        else:os.replace(stage,destination);stage=None
        archive=destination.with_suffix('.zip');fd,temporary=tempfile.mkstemp(prefix='.release-zip-',suffix='.zip',dir=archive.parent);os.close(fd)
        try:
            with zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as zipped:
                for name,raw in sorted(payload.items()):info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.create_system=3;info.external_attr=0o100644<<16;zipped.writestr(info,raw)
            os.replace(temporary,archive)
        finally:
            if Path(temporary).exists():Path(temporary).unlink()
        latest={'fingerprint':fingerprint,'directory':destination.name,'archive':archive.name,'archiveSha256':digest(archive.read_bytes()),'contentVersion':project['contentVersion']};pointer=destination.parent/'latest.json';temporary=pointer.with_name('.latest.tmp');temporary.write_bytes(encoded(latest));os.replace(temporary,pointer)
        return {'ok':True,'value':{'fingerprint':fingerprint,'directory':str(destination),'archive':str(archive),'manifest':build},**({'evidence':evidence} if evidence else {})}
    except (ValueError,OSError,KeyError,TypeError,zipfile.BadZipFile):return failed('release.inputs.invalid')
    finally:
        if stage and stage.exists():
            checked=require_project_path(stage);checked.relative_to(root);assert checked.name.startswith('.release-stage-');shutil.rmtree(checked)
