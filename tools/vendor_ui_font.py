"""Vendor the original CLB Hoi font; gameplay must work without Google Fonts."""
from pathlib import Path
import re
import urllib.request

root = Path(__file__).resolve().parents[1]
dest = root / 'assets' / 'fonts'
dest.mkdir(parents=True, exist_ok=True)
url = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap'
request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
css = urllib.request.urlopen(request, timeout=30).read().decode()
sources = list(dict.fromkeys(re.findall(r'https://[^)]+', css)))
for index, source in enumerate(sources):
    extension = source.rsplit('.', 1)[-1]
    name = f'be-vietnam-pro-{index}.{extension}'
    (dest / name).write_bytes(urllib.request.urlopen(source, timeout=30).read())
    css = css.replace(source, '../assets/fonts/' + name)
(root / 'styles' / 'fonts.css').write_text(css, encoding='utf-8')
license_url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/OFL.txt'
(dest / 'OFL.txt').write_bytes(urllib.request.urlopen(license_url, timeout=30).read())
print(f'Vendored {len(sources)} font files and OFL license.')
