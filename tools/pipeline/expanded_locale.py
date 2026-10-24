"""Reproducible en-XA stress catalog; parameters/rich text retain the shared contract."""
import json
from pathlib import Path

def generate(root):
    path=Path(root)/'content/locales'
    source=json.loads((path/'vi.json').read_text(encoding='utf-8'))
    for entry in source.values():
        if isinstance(entry.get('value'),str):
            entry['value']='[ '+entry['value']+' ~~~~~~~~~~~~~~~~ ]'
        else:
            entry['runs']=[{'kind':'text','value':'[ '},*entry['runs'],{'kind':'text','value':' ~~~~~~~~~~~~~~~~ ]'}]
    (path/'test-expanded.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':
    from local_environment import configure
    configure()
    generate(Path(__file__).resolve().parents[2])
