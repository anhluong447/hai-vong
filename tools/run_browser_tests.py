"""Run browser tests without a Node installation. Server must already be running."""
import argparse
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
import json
from browser_cdp import DevTools


def run_real_time(arguments, url, profile, environment):
    """Wait on actual completion for Canvas encoders/crypto worker tasks.

    Headless virtual time can expire while those workers are still computing.
    This optional mode shares the same DOM result contract as the normal suite.
    """
    deadline = time.monotonic() + 40
    with open(Path(profile) / 'real-time-browser.log', 'w', encoding='utf-8') as log:
        process = subprocess.Popen(arguments + ['--remote-debugging-port=0', 'about:blank'],
                                   stdout=log, stderr=log, env=environment)
    client = None
    try:
        port_file = Path(profile) / 'DevToolsActivePort'
        while not port_file.is_file():
            if process.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError('Chrome did not start DevTools')
            time.sleep(.05)
        port = int(port_file.read_text().splitlines()[0])
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=5) as response:
            pages = json.load(response)
        client = DevTools(next(page['webSocketDebuggerUrl'] for page in pages if page['type'] == 'page'))
        client.call('Page.enable')
        client.call('Page.navigate', {'url':url})
        while True:
            result = client.evaluate('document.documentElement.outerHTML') or ''
            if re.search(r'<p class="(?:ok|bad)">\d+/\d+ passed</p>', result):
                return subprocess.CompletedProcess(arguments, 0, result, '')
            if time.monotonic() >= deadline:
                return subprocess.CompletedProcess(arguments, 1, result, 'Real-time tests did not finish within 40 seconds')
            time.sleep(.1)
    finally:
        if client:
            client.socket.close()
        if process.poll() is None:
            process.terminate()
            process.wait(timeout=10)


def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:8080/tests/index.html')
    parser.add_argument('--browser', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
    parser.add_argument('--capture', action='store_true', help='Capture the supplied URL instead of testing it')
    parser.add_argument('--output-prefix', choices=['test', 'playtest'], default='test')
    parser.add_argument('--virtual-time-budget', type=int, default=120000)
    parser.add_argument('--screenshot-path', type=Path, help='Output path for capture mode; preserves historical previews')
    parser.add_argument('--width', type=int, default=1440)
    parser.add_argument('--height', type=int, default=1100)
    parser.add_argument('--reduced-motion', action='store_true')
    parser.add_argument('--require-capture-ready', action='store_true',
                        help='Capture only succeeds when the page publishes data-capture-ready="true"')
    parser.add_argument('--real-time', action='store_true', help='Wait for test completion in wall time using DevTools')
    args = parser.parse_args()
    if args.real_time and args.capture:
        parser.error('--real-time is for tests; use capture_replica.py for deterministic capture')
    root = Path(__file__).resolve().parent
    with urllib.request.urlopen(args.url, timeout=5) as response:
        if response.status != 200:
            raise RuntimeError('Test server is unavailable')
    # Windows may expose duplicate Path/PATH entries to PowerShell Start-Process.
    environment = {key.upper(): value for key, value in os.environ.items()}
    # Chrome subprocesses can briefly retain cache handles after the main process
    # exits on Windows. Cleanup must not discard the completed test result.
    with tempfile.TemporaryDirectory(prefix='press-club-test-', ignore_cleanup_errors=True) as profile:
        arguments = [
            args.browser, '--headless', '--disable-gpu', '--no-first-run',
            '--no-default-browser-check', f'--user-data-dir={profile}',
            f'--window-size={args.width},{args.height}', f'--virtual-time-budget={args.virtual_time_budget}', '--dump-dom',
            '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
        ]
        if args.reduced_motion:
            arguments.append('--force-prefers-reduced-motion')
        screenshot = (args.screenshot_path or root.parent / 'archive/development/reviews/sandbox-preview.png').resolve()
        if args.capture:
            screenshot.parent.mkdir(parents=True, exist_ok=True)
            arguments.extend(['--force-device-scale-factor=1', '--hide-scrollbars'])
            arguments.append(f'--screenshot={screenshot}')
        if args.real_time:
            arguments = [argument for argument in arguments if argument != '--dump-dom' and not argument.startswith('--virtual-time-budget=')]
            result = run_real_time(arguments, args.url, profile, environment)
        else:
            arguments.append(args.url)
            result = subprocess.run(arguments, capture_output=True, text=True, encoding='utf-8', errors='replace',
                env=environment, timeout=45)
    (root / ('preview_dom.log' if args.capture else f'{args.output_prefix}_results.log')).write_text(result.stdout, encoding='utf-8')
    (root / ('preview_browser.log' if args.capture else f'{args.output_prefix}_browser.log')).write_text(result.stderr, encoding='utf-8')
    if args.capture:
        if result.returncode != 0 or not screenshot.exists():
            print('Screenshot failed. See tools/test_browser.log.')
            return 1
        if args.require_capture_ready and not re.search(r'<html\b[^>]*\bdata-capture-ready="true"', result.stdout):
            print('Capture page was not ready. Screenshot is diagnostic only; see tools/preview_dom.log.')
            return 1
        print(f'Screenshot: {screenshot}')
        return 0
    summary = re.search(r'<p class="(?:ok|bad)">(\d+)/(\d+) passed</p>', result.stdout)
    if not summary:
        print('Tests did not finish. See tools/test_results.log and tools/test_browser.log.')
        return 1
    print(f'{summary[1]}/{summary[2]} passed')
    if summary[1] != summary[2]:
        for failure in re.findall(r'<pre class="bad">(.*?)</pre>', result.stdout, re.S):
            print(failure)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
