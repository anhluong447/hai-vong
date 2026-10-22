"""Guardrails, not a proof of architectural correctness; behavioral suites complement this scan."""
from pathlib import Path
import re

LAYERS={'contracts':set(),'domain':{'contracts','domain'},'application':{'contracts','domain','application'},'presentation':{'contracts','application','presentation'},'infrastructure':{'contracts','infrastructure'},'bootstrap':{'contracts','domain','application','presentation','infrastructure','bootstrap'}}
IMPORT=re.compile(r"(?:import|export)\s+(?:[^;]*?\s+from\s+)?['\"]([^'\"]+)['\"]")

def check(root):
    root=Path(root).resolve(); graph={}; errors=[]
    def add(code,file): errors.append({'code':code,'sourceId':file.relative_to(root).as_posix(),'pointer':'','relatedIds':[]})
    for file in (root/'src').rglob('*.js'):
        text=file.read_text(encoding='utf-8'); layer=file.relative_to(root/'src').parts[0]
        graph[file]=[]
        for ref in IMPORT.findall(text):
            if not ref.startswith('.'): add('architecture.import',file); continue
            target=(file.parent/ref).resolve(); graph[file].append(target)
            try:
                parts=target.relative_to(root).parts
                other=parts[1] if parts[0]=='src' else parts[0]
                if parts[0]!='src' or other not in LAYERS.get(layer,set()): add('architecture.import',file)
            except ValueError: add('architecture.import',file)
        if layer in {'domain','application','contracts'} and re.search(r'\b(window|document|localStorage|indexedDB|fetch|requestAnimationFrame|AudioContext|Date|performance)\b',re.sub(r'/\*.*?\*/|//[^\n]*','',text,flags=re.S)):
            add('architecture.browser-api',file)
        if re.search(r"(?:textContent|innerHTML|ariaLabel)\s*=\s*['\"][^'\"]+|['\"](?:/?assets/|https?://)[^'\"]+",text): add('architecture.authored-data',file)
        if layer=='presentation' and re.search(r'\bstate\.(?:gameplay\.)?(?:energy|flags|quests|evidence|day|week)\s*(?:=|\+\+|--|\+=|-=)',text): add('architecture.mutation',file)
    visited=set(); active=set()
    def visit(node):
        if node in active: add('architecture.cycle',node); return
        if node in visited: return
        active.add(node)
        for nxt in graph.get(node,[]): visit(nxt)
        active.remove(node); visited.add(node)
    for node in graph: visit(node)
    return errors
