"""Detect explicit local capabilities; never install or silently skip a tool."""
import os
from pathlib import Path
import shutil

def detect_browser(explicit=None):
    candidates=[explicit] if explicit else [os.environ.get('HOIAM_BROWSER'),shutil.which('chromium'),shutil.which('google-chrome'),shutil.which('chrome')]
    if not explicit:
        for env in ['PROGRAMFILES','PROGRAMFILES(X86)','LOCALAPPDATA']:
            base=Path(os.environ.get(env,''))
            candidates.extend(str(base/name) for name in ['Google/Chrome/Application/chrome.exe','Microsoft/Edge/Application/msedge.exe'])
    for item in candidates:
        if item and Path(item).is_file(): return {'ok':True,'value':str(Path(item).resolve())}
    return {'ok':False,'errors':[{'code':'tool.browser.missing','sourceId':str(explicit or 'HOIAM_BROWSER'),'pointer':'','relatedIds':[]}]}
