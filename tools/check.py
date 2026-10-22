"""One honest entry point: a requested missing suite fails rather than skips."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode = True
from pipeline.local_environment import configure
configure()
from urllib.request import urlopen
from urllib.parse import urlsplit
from pipeline.check_architecture import check
from pipeline.browser_runner import run_browser

ROOT=Path(__file__).resolve().parents[1]
SUITES=('architecture','content','unit','browser','authoring','bot','release')

def suite(name,args):
    if name=='architecture':
        errors=check(ROOT)
        return {'suite':name,'ok':not errors,'errors':errors}
    if name=='unit':
        run=subprocess.run([sys.executable,'-X','utf8','-m','unittest','discover','-s','tests/python'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
        modules=['/'+p.relative_to(ROOT).as_posix() for p in (ROOT/'tests/unit').glob('*.test.js')]
        result=run_browser(ROOT,modules) if modules else {'ok':True,'passed':0,'failed':0}
        return {'suite':name,**result,'ok':result['ok'] and run.returncode==0,'python':{'exitCode':run.returncode,'output':run.stdout+run.stderr}}
    folder={'content':'content','browser':'browser','authoring':'authoring','bot':'bot'}.get(name)
    if folder:
        modules=['/'+p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'tests'/folder).glob('*.test.js'))]
        if modules:
            if args.base_url:
                try:
                    parsed=urlsplit(args.base_url)
                    if parsed.scheme!='http' or parsed.hostname not in {'localhost','127.0.0.1'}:raise ValueError('loopback required')
                    with urlopen(args.base_url.rstrip('/')+'/content/project.json',timeout=3) as response:
                        if response.status!=200:raise ValueError('not ready')
                except (OSError,ValueError):return {'suite':name,'ok':False,'errors':[{'code':'test.server.unreachable','sourceId':args.base_url,'pointer':'','relatedIds':[]}]}
            return {'suite':name,**run_browser(ROOT,modules,base_url=args.base_url)}
    return {'suite':name,'ok':False,'errors':[{'code':'not-implemented','sourceId':name,'pointer':'','relatedIds':[]}]}

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('suite'); parser.add_argument('--base-url'); parser.add_argument('--profile'); parser.add_argument('--pack'); args=parser.parse_args()
    reports=[suite(name,args) for name in (SUITES if args.suite=='all' else [args.suite])]
    print(json.dumps({'ok':all(r['ok'] for r in reports),'reports':reports},ensure_ascii=False,indent=2))
    return 0 if all(r['ok'] for r in reports) else 1
if __name__=='__main__': raise SystemExit(main())
