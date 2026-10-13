"""Capture coastal menu preview screenshot using Chrome CDP stdlib."""
import base64
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request
from browser_cdp import DevTools

ROOT = Path(__file__).resolve().parent.parent
BROWSER = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
URL = 'http://127.0.0.1:8080/tools/coastal-menu-preview.html'
OUT = ROOT / 'tools/coastal-menu-captured.png'

def main():
    with tempfile.TemporaryDirectory(prefix='menu-cdp-') as profile:
        cmd = [
            BROWSER, '--headless', '--disable-gpu', '--no-first-run',
            f'--user-data-dir={profile}', '--remote-debugging-port=0',
            '--hide-scrollbars', '--force-device-scale-factor=1',
            'about:blank'
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            deadline = time.monotonic() + 15
            port_file = Path(profile) / 'DevToolsActivePort'
            while not port_file.is_file():
                if proc.poll() is not None or time.monotonic() >= deadline:
                    raise RuntimeError('Chrome failed to start')
                time.sleep(0.05)
            port = int(port_file.read_text().splitlines()[0])
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as resp:
                pages = json.load(resp)
            ws_url = next(p['webSocketDebuggerUrl'] for p in pages if p['type'] == 'page')
            client = DevTools(ws_url)
            client.call('Page.enable')
            client.call('Runtime.enable')
            client.call('Emulation.setDeviceMetricsOverride', {
                'width': 1672, 'height': 1060, 'deviceScaleFactor': 1, 'mobile': False
            })
            client.call('Page.navigate', {'url': URL})
            time.sleep(2.5) # allow fonts and images to render
            shot = client.call('Page.captureScreenshot', {'format': 'png'})
            data = base64.b64decode(shot['data'])
            OUT.write_bytes(data)
            print(f'Captured screenshot saved to {OUT} ({len(data)} bytes)')
            client.socket.close()
        finally:
            if proc.poll() is None:
                proc.terminate()
                proc.wait(timeout=5)

if __name__ == '__main__':
    main()
