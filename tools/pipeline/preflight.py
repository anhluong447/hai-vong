"""Detect explicit local capabilities; never install or silently skip a tool."""
import os
from pathlib import Path
import shutil
import json
from local_environment import ROOT,require_project_path

def detect_browser(explicit=None,project_root=None):
    root=require_project_path(project_root or ROOT);portable=None
    try:
        tool=json.loads((root/'content/pipeline/portable-tools.json').read_bytes())['tools']['chromium']
        portable=require_project_path(root/tool['destination']/tool['executable']);portable.relative_to(root)
    except (OSError,ValueError,KeyError,TypeError):pass
    candidates=[explicit] if explicit else [os.environ.get('HOIAM_BROWSER'),portable,shutil.which('chromium'),shutil.which('google-chrome'),shutil.which('chrome')]
    if not explicit:
        for env in ['PROGRAMFILES','PROGRAMFILES(X86)','LOCALAPPDATA']:
            base=Path(os.environ.get(env,''))
            candidates.extend(str(base/name) for name in ['Google/Chrome/Application/chrome.exe','Microsoft/Edge/Application/msedge.exe'])
    for item in candidates:
        if item and Path(item).is_file(): return {'ok':True,'value':str(Path(item).resolve())}
    return {'ok':False,'errors':[{'code':'tool.browser.missing','sourceId':str(explicit or 'HOIAM_BROWSER'),'pointer':'','relatedIds':[]}]}
