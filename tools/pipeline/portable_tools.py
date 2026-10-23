"""Verified ZIP tools, contained in this checkout. No installer is executed."""
import hashlib,json,os,re,shutil,stat,tempfile,zipfile
from pathlib import Path,PurePosixPath,PureWindowsPath
from urllib.request import urlopen
from local_environment import require_project_path

def failed(code):return {'ok':False,'errors':[{'code':code,'sourceId':'portable-tool','pointer':'/','relatedIds':[]}]}
def digest(raw):return hashlib.sha256(raw).hexdigest()
def extract_verified(root,archive,destination,expected_hash,executable):
    root=require_project_path(root);stage=None
    try:
        archive=require_project_path(archive);destination=require_project_path(destination);archive.relative_to(root);destination.relative_to(root)
        (destination/executable).resolve().relative_to(destination)
        if not re.fullmatch('[a-f0-9]{64}',expected_hash) or digest(archive.read_bytes())!=expected_hash:return failed('tool.archive.hash')
        if destination.exists():
            manifest=json.loads((destination/'.portable-manifest.json').read_bytes())
            if manifest['archiveSha256']!=expected_hash or manifest['executable']!=executable:return failed('tool.destination.conflict')
            for name,hash in manifest['files'].items():
                path=(destination/name).resolve();path.relative_to(destination)
                if not path.is_file() or digest(path.read_bytes())!=hash:return failed('tool.installed.modified')
            return {'ok':True,'value':{'executable':str((destination/executable).resolve()),'reused':True}}
        with zipfile.ZipFile(archive) as zipped:
            names=[]
            for entry in zipped.infolist():
                name=entry.filename;parts=PurePosixPath(name).parts
                if not parts or PurePosixPath(name).is_absolute() or PureWindowsPath(name).drive or '\\' in name or any(part in ('.','..') or re.fullmatch(r'(?i)(con|prn|aux|nul|com[1-9]|lpt[1-9])',part.split('.')[0].rstrip(' .')) for part in parts) or stat.S_ISLNK(entry.external_attr>>16):return failed('tool.archive.path')
                if not entry.is_dir():names.append(name)
            if len(names)!=len({name.casefold() for name in names}) or executable not in names:return failed('tool.archive.executable')
            destination.parent.mkdir(parents=True,exist_ok=True);stage=Path(tempfile.mkdtemp(prefix='.portable-stage-',dir=destination.parent)).resolve();stage.relative_to(destination.parent);hashes={}
            for name in names:
                path=(stage/name).resolve();path.relative_to(stage);path.parent.mkdir(parents=True,exist_ok=True);raw=zipped.read(name);path.write_bytes(raw);hashes[name]=digest(raw)
            (stage/'.portable-manifest.json').write_text(json.dumps({'archiveSha256':expected_hash,'executable':executable,'files':hashes},sort_keys=True,indent=2),encoding='utf-8');os.replace(stage,destination);stage=None
        return {'ok':True,'value':{'executable':str((destination/executable).resolve()),'reused':False}}
    except (ValueError,OSError,KeyError,TypeError,zipfile.BadZipFile):return failed('tool.extract.failed')
    finally:
        if stage and stage.exists():
            path=require_project_path(stage);path.relative_to(root);assert path.name.startswith('.portable-stage-');shutil.rmtree(path)

def provision(root,spec):
    root=require_project_path(root);cache=(root/spec['archive']).resolve();cache.relative_to(root);require_project_path(cache)
    try:
        if not cache.is_file() or digest(cache.read_bytes())!=spec['sha256']:
            if not spec['url'].startswith('https://'):return failed('tool.download.url')
            cache.parent.mkdir(parents=True,exist_ok=True);fd,name=tempfile.mkstemp(prefix='.download-',dir=cache.parent);os.close(fd);temporary=Path(name)
            try:
                with urlopen(spec['url'],timeout=60) as response,temporary.open('wb') as stream:
                    while chunk:=response.read(1024*1024):stream.write(chunk)
                if digest(temporary.read_bytes())!=spec['sha256']:return failed('tool.download.hash')
                os.replace(temporary,cache)
            finally:
                if temporary.exists():temporary.unlink()
        return extract_verified(root,cache,root/spec['destination'],spec['sha256'],spec['executable'])
    except (ValueError,OSError,KeyError):return failed('tool.download.failed')

def configure_firefox(root,destination,executable,policy):
    try:
        root=require_project_path(root);destination=require_project_path(destination);destination.relative_to(root)
        manifest_path=destination/'.portable-manifest.json';manifest=json.loads(manifest_path.read_bytes())
        path=require_project_path((destination/executable).parent/'distribution/policies.json');path.relative_to(destination)
        name=path.relative_to(destination).as_posix();raw=(json.dumps(policy,sort_keys=True,indent=2)+'\n').encode('utf-8')
        if path.exists() and digest(path.read_bytes())!=manifest['files'].get(name):return failed('tool.installed.modified')
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw);manifest['files'][name]=digest(raw)
        manifest_path.write_text(json.dumps(manifest,sort_keys=True,indent=2),encoding='utf-8')
        return {'ok':True}
    except (ValueError,OSError,KeyError,TypeError):return failed('tool.policy.failed')

def provision_all(root):
    import platform,sys
    root=require_project_path(root);configuration=json.loads((root/'content/pipeline/portable-tools.json').read_bytes())
    if sys.platform!=configuration['platform'] or platform.machine().upper()!=configuration['architecture']:return failed('tool.platform.unsupported')
    results={}
    for name,spec in configuration['tools'].items():
        result=provision(root,spec)
        if not result['ok']:return result
        results[name]=result['value']['executable']
        if name=='firefox':
            configured=configure_firefox(root,root/spec['destination'],spec['executable'],json.loads((root/'content/pipeline/firefox-policies.json').read_bytes()))
            if not configured['ok']:return configured
        if name=='chromium' and sys.platform=='win32':
            import subprocess
            target=require_project_path(root/spec['destination']);target.relative_to(root/'.tools')
            # Standard Windows sandbox identities need RX, never write access.
            # Only this project tool tree is changed; the browser sandbox stays on.
            granted=subprocess.run(['icacls',str(target),'/grant','*S-1-5-32-545:(OI)(CI)(RX)','*S-1-15-2-1:(OI)(CI)(RX)','*S-1-15-2-2:(OI)(CI)(RX)','/T','/Q'],capture_output=True,text=True)
            if granted.returncode:return failed('tool.browser.sandbox.permissions')
    return {'ok':True,'value':results}
