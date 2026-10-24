"""Actual local browser evidence for a staged static artifact."""
import json,platform,threading
from pathlib import Path
from browser_runner import run_browser
from local_environment import require_project_path
from release_host import create_release_server

def verify_export(root,artifact):
    root=require_project_path(root);artifact=require_project_path(artifact);report_root=root/'.cache/reports/release';report_root.mkdir(parents=True,exist_ok=True)
    firefox=run_browser(root,['/tests/compat/platform-smoke.test.js'],engine='firefox',timeout=90)
    (report_root/'firefox.json').write_text(json.dumps(firefox,ensure_ascii=False,indent=2),encoding='utf-8')
    if not firefox['ok']:return {'ok':False,'stage':'firefox','evidence':firefox}
    targets=json.loads((root/'content/pipeline/performance-targets.json').read_bytes());reports=[];server=create_release_server(artifact);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    journey=None
    try:
        journey=run_browser(root,['/tests/release/first3.test.js'],base_url=f'http://127.0.0.1:{server.server_port}',timeout=120)
        (report_root/'first3-journey.json').write_text(json.dumps(journey,ensure_ascii=False,indent=2),encoding='utf-8')
        if not journey['ok']:return {'ok':False,'stage':'first3-journey','evidence':journey}
        for profile in targets['profiles']:
            report=run_browser(root,['/tests/release/export.test.js'],params={'profile':json.dumps(profile),'targets':json.dumps(targets)},base_url=f'http://127.0.0.1:{server.server_port}',timeout=120)
            reports.append({'profile':profile['id'],**report});(report_root/(profile['id']+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
            if not report['ok']:break
    finally:server.shutdown();server.server_close();thread.join(timeout=3)
    result={'ok':firefox['ok'] and journey['ok'] and len(reports)==len(targets['profiles']) and all(report['ok'] for report in reports),'host':{'system':platform.system(),'release':platform.release(),'machine':platform.machine(),'processor':platform.processor()},'interpretation':targets['interpretation'],'firefox':firefox,'first3Journey':journey,'profiles':reports}
    (report_root/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');return result
