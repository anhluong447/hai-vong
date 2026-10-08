"""Save the five UI route traces as a reviewable playtest artifact."""
import html
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'tools/playtest_results.log').read_text(encoding='utf-8')
match = re.search(r'<pre id="gameplay-playtest-report">(.*?)</pre>', source, re.S)
if not match:
    raise SystemExit('No gameplay UI route report found.')
report = json.loads(html.unescape(match[1]))
if not all(row['ok'] for row in report['results']):
    raise SystemExit('Some UI routes failed; inspect playtest_results.log.')
target = root / 'docs/gameplay-route-playtest-2026-10-05.json'
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for row in report['results']:
    print(json.dumps({key: row[key] for key in ['id','clicks','K','T','total','good','money','khueArticles','teamArticles','romances','betrayal','reputation','averageIssueScore','metrics']}, ensure_ascii=False))
    print('Issues:', json.dumps(row['reports'], ensure_ascii=False))
    print('Changed course:', json.dumps([d for d in row['decisions'] if d['kind'] in ['rescue','short','romance']], ensure_ascii=False))
    print('Max end-of-day fatigue:', max(day['khueFatigue'] for day in row['days']))
    if row['id'] == 'balanced':
        issue = row['reports'][1]
        articles = [a for a in row['articles'] if a['id'] in issue['ids']]
        without_photo = [a for a in articles if a['id'] != 'W2-photo']
        print('Week 2 articles:', json.dumps([{k: a[k] for k in ['id','score','quality']} for a in articles]))
        print('Hypothetical week-2 score without photo:', round(sum(a['score'] for a in without_photo) / len(without_photo)))
print(f'Report: {target}')
