"""Extract deterministic gameplay metrics from the browser test run."""
import html
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'tools/test_results.log').read_text(encoding='utf-8')
match = re.search(r'<pre id="gameplay-benchmarks">(.*?)</pre>', source, re.S)
summary = re.search(r'<p class="(?:ok|bad)">(\d+)/(\d+) passed</p>', source)
if not match or not summary or summary[1] != summary[2]:
    raise SystemExit('A passing browser run is required.')
rows = json.loads(html.unescape(match[1]))
report = {
    'scope': 'Mock engine regression; not final gameplay balance or narrative ending validation.',
    'browser_tests_passed': int(summary[1]),
    'policies': rows,
}
target = root / 'docs/testing/baselines/gameplay-baseline.json'
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for row in rows:
    print(f"{row['policy']}: K={row['K']:.1f}, T={row['T']:.1f}, total={row['total']:.1f}, gate={row['good']}, articles={row['khueArticles']}/{row['teamArticles']}")
print(f'Report: {target}')
