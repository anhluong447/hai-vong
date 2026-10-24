"""Current-source gate receipts. Detailed proof is local, never part of a ZIP."""
import json,os,subprocess,sys
from pathlib import Path
from local_environment import require_project_path
from release import input_fingerprint,read,encoded,digest

def proof_directory(root,report_root=None):
    return require_project_path(report_root or root/'.cache/reports/gates')/input_fingerprint(root)

def store_receipt(root,name,result,fingerprint,report_root=None):
    root=require_project_path(root);directory=proof_directory(root,report_root);directory.mkdir(parents=True,exist_ok=True)
    if input_fingerprint(root)!=fingerprint:return {'ok':False,'suite':name,'errors':[{'code':'gate.source.changed','sourceId':name,'pointer':'/','relatedIds':[]}]}
    raw=encoded(result);report=directory/(name+'.report.json');report.write_bytes(raw)
    receipt={'suite':name,'ok':result.get('ok') is True,'fingerprint':fingerprint,'contentVersion':read(root,'content/project.json')['contentVersion'],'report':str(report),'reportSha256':digest(raw),'command':[str(Path(sys.executable).resolve()),'-B','-X','utf8','tools/check.py',name]}
    destination=directory/(name+'.receipt.json');temporary=destination.with_suffix('.tmp');temporary.write_bytes(encoded(receipt));os.replace(temporary,destination)
    return receipt

def read_receipt(root,name,report_root=None):
    try:
        root=require_project_path(root);directory=proof_directory(root,report_root);receipt=json.loads((directory/(name+'.receipt.json')).read_bytes());report=require_project_path(receipt['report']);report.relative_to(directory)
        raw=report.read_bytes();result=json.loads(raw)
        if receipt['suite']!=name or receipt['ok'] is not True or result.get('ok') is not True or result.get('suite')!=name or receipt['fingerprint']!=input_fingerprint(root) or receipt['contentVersion']!=read(root,'content/project.json')['contentVersion'] or digest(raw)!=receipt['reportSha256']:return None
        return receipt
    except (ValueError,OSError,KeyError,TypeError):return None

def execute_gate(root,name,report_root=None):
    root=require_project_path(root);fingerprint=input_fingerprint(root)
    run=subprocess.run([sys.executable,'-B','-X','utf8','tools/check.py',name],cwd=root,capture_output=True,text=True,encoding='utf-8')
    try:
        parsed=json.loads(run.stdout);result=parsed['reports'][0]
        result={**result,'ok':run.returncode==0 and parsed.get('ok') is True and result.get('ok') is True}
    except (ValueError,KeyError,IndexError,TypeError):result={'suite':name,'ok':False,'stdout':run.stdout,'stderr':run.stderr}
    return store_receipt(root,name,result,fingerprint,report_root)

def required_receipts(root):
    receipts=[]
    for name in read(root,'content/pipeline/release.json')['requiredSuites']:
        receipt=read_receipt(root,name) or execute_gate(root,name)
        if receipt.get('ok') is not True:return {'ok':False,'errors':[{'code':'release.gate.failed','sourceId':name,'pointer':'/','relatedIds':[]}],'gate':receipt}
        receipts.append(receipt)
    return {'ok':True,'value':receipts}
