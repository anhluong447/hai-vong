"""Read-only whole-project traversal in an isolated real browser; reports stay local."""
import argparse,hashlib,json,sys
from pathlib import Path
from local_environment import configure,require_project_path
from project_sources import load_sources
from browser_runner import run_browser

def run_bot(root,pack=None):
    root=require_project_path(root)
    try:
        sources=load_sources(root);declared={Path(path).stem for path in sources['project']['packs']}
        if pack is not None and pack not in declared:return {'ok':False,'errors':[{'code':'bot.pack.unknown','sourceId':str(pack),'pointer':'/','relatedIds':[]}]}
        settings=json.loads((root/'content/pipeline/bot.json').read_text(encoding='utf-8'))
        if settings.get('schemaVersion')!=1 or any(not isinstance(settings.get(key),int) or isinstance(settings[key],bool) or settings[key]<1 for key in ['maxStates','maxSteps','timeoutSeconds']):raise ValueError('limits')
        fingerprint=hashlib.sha256(json.dumps(sources,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')).hexdigest()
        report=run_browser(root,modules=[],page='/tools/workspace/bot.html',payload={'sources':sources,'limits':{'maxStates':settings['maxStates'],'maxSteps':settings['maxSteps']}},timeout=settings['timeoutSeconds'])
        report.update(fingerprint=fingerprint,scope='project',selectedPack=pack)
        directory=require_project_path(root/'.cache/reports/bot');directory.mkdir(parents=True,exist_ok=True);path=directory/(fingerprint+'.json');report['artifact']=path.relative_to(root).as_posix();path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');return report
    except (ValueError,OSError,KeyError,TypeError):return {'ok':False,'errors':[{'code':'bot.inputs.invalid','sourceId':'bot','pointer':'/','relatedIds':[]}]}

def main():
    configure();parser=argparse.ArgumentParser();parser.add_argument('--pack');args=parser.parse_args();report=run_bot(Path(__file__).resolve().parents[2],args.pack);print(json.dumps(report,ensure_ascii=False,indent=2));return 0 if report['ok'] else 1
if __name__=='__main__':raise SystemExit(main())
