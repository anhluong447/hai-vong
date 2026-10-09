"""Run browser tests without a Node installation. Server must already be running."""
import argparse
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.request


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
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    with urllib.request.urlopen(args.url, timeout=5) as response:
        if response.status != 200:
            raise RuntimeError('Test server is unavailable')
    # Windows may expose duplicate Path/PATH entries to PowerShell Start-Process.
    environment = {key.upper(): value for key, value in os.environ.items()}
    with tempfile.TemporaryDirectory(prefix='press-club-test-') as profile:
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
            arguments.append(f'--screenshot={screenshot}')
        arguments.append(args.url)
        result = subprocess.run(arguments, capture_output=True, text=True, encoding='utf-8', errors='replace',
            env=environment, timeout=45)
    (root / ('preview_dom.log' if args.capture else f'{args.output_prefix}_results.log')).write_text(result.stdout, encoding='utf-8')
    (root / ('preview_browser.log' if args.capture else f'{args.output_prefix}_browser.log')).write_text(result.stderr, encoding='utf-8')
    if args.capture:
        if result.returncode != 0 or not screenshot.exists():
            print('Screenshot failed. See tools/test_browser.log.')
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
