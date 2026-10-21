"""Compare the latest browser results with both committed gameplay baselines."""
import html
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent.parent

def compare(expected,actual,path):
    if isinstance(expected,dict):
        if set(expected)!=set(actual):raise ValueError(f'{path}: different fields')
        for key in expected:compare(expected[key],actual[key],f'{path}.{key}')
    elif isinstance(expected,list):
        if len(expected)!=len(actual):raise ValueError(f'{path}: different lengths')
        for index,(left,right) in enumerate(zip(expected,actual)):compare(left,right,f'{path}[{index}]')
    elif isinstance(expected,(int,float)) and not isinstance(expected,bool):
        if abs(expected-actual)>1e-8:raise ValueError(f'{path}: {expected} != {actual}')
    elif expected!=actual:raise ValueError(f'{path}: {expected!r} != {actual!r}')

def main():
    source=(ROOT/'tools/test_results.log').read_text(encoding='utf-8')
    summary=re.search(r'<p class="(?:ok|bad)">(\d+)/(\d+) passed</p>',source)
    if not summary or summary[1]!=summary[2]:raise ValueError('A passing browser run is required')
    for filename,element,field in [('sandbox-baseline.json','benchmarks',None),('gameplay-baseline.json','gameplay-benchmarks','policies')]:
        match=re.search(r'<pre id="'+element+r'">(.*?)</pre>',source,re.S)
        if not match:raise ValueError(f'Missing browser benchmark: {element}')
        actual=json.loads(html.unescape(match[1]))
        expected=json.loads((ROOT/'docs/testing/baselines'/filename).read_text(encoding='utf-8-sig'))
        if field:expected=expected[field]
        compare(expected,actual,filename)
        print(f'{filename}: all {len(expected)} policies match')

if __name__=='__main__':main()
