"""Capture current diagnostics without PowerShell encoding transformations."""
import json,subprocess,sys
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent/'pipeline'))
from local_environment import ROOT,configure,local_path
configure()
if __name__=='__main__':
    report=local_path('.cache/reports/ci.json');report.parent.mkdir(parents=True,exist_ok=True)
    with report.open('wb') as output:
        run=subprocess.run([sys.executable,'-B','-X','utf8','tools/check.py','all','--profile','foundation-demo'],cwd=ROOT,stdout=output)
    result=json.loads(report.read_bytes());print(json.dumps({'ok':result['ok'],'reports':[{'suite':r['suite'],'ok':r['ok']} for r in result['reports']],'diagnostics':str(report)},indent=2));raise SystemExit(run.returncode)
