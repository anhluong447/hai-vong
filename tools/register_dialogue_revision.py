"""Register inspected dialogue art; keeps previous generated assets and prompts."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'assets/dialogue'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

revision = read(ART / 'v2/revision-prompts.json')
manifest = read(ART / 'manifest.json')
khue = manifest['characters']['khue']
khue['expressions'] = {
    'neutral': 'v2/khue-standing-neutral.png',
    'happy': 'v2/khue-standing-happy.png',
    'serious': 'v2/khue-standing-listening.png',
    'investigate': 'v2/khue-neutral.png',
    'lead_found': 'v2/khue-happy.png',
    'questioning': 'v2/khue-serious.png',
}
khue['expressionLabels'] = {
    'neutral': 'Đứng bình thường', 'happy': 'Cười nhẹ', 'serious': 'Chăm chú lắng nghe',
    'investigate': 'Điều tra · tập trung', 'lead_found': 'Điều tra · tìm ra manh mối',
    'questioning': 'Điều tra · chất vấn',
}
khue['expressionMasters'] = {
    key: ('investigate' if key in ('investigate', 'lead_found', 'questioning') else 'neutral')
    for key in khue['expressions']
}
for who in ('ngoc', 'long'):
    manifest['characters'][who]['expressions']['happy'] = f'v2/{who}-happy-v2.png'
for character in manifest['characters'].values():
    for file in character['expressions'].values():
        if not (ART / file).is_file():
            raise FileNotFoundError(file)
write(ART / 'manifest.json', manifest)

for who in ('ngoc', 'long', 'khue'):
    path = ART / f'v2/{who}-prompt.json'
    prompt = read(path)
    prompt['accessoryConstraints'] = 'Bare face: NO eyeglasses. Only Nhi and An wear glasses among the six club members.'
    prompt['expressionReferencePolicy'] = 'Use this character\'s own pose master only for expression edits. Do not reference the full multi-character sheet for facial edits.'
    prompt['revisionPrompts'] = [r for r in revision['records'] if r['key'].startswith(who + '-')]
    if who == 'khue':
        prompt['activeExpressions'] = khue['expressions']
        prompt['expressionMasters'] = khue['expressionMasters']
        prompt['everydayPose'] = 'Relaxed upright stance, empty hands by sides, ordinary neutral / gentle smile / attentive listening. Default for everyday conversation.'
    else:
        prompt['historicalPromptWarning'] = 'Original expressionPrompts mistakenly required glasses. Retained verbatim as generation history; do NOT reuse that eyewear instruction. Use revisionPrompts and accessoryConstraints.'
    write(path, prompt)

prompts = read(ART / 'v2/prompts.json')
prompts['revisions'] = [revision]
write(ART / 'v2/prompts.json', prompts)
print('Registered 24 active portraits; previous images and original prompts preserved.')
