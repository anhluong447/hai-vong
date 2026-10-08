"""Original hand-authored pixel prototypes. Standard library only; no external art."""
import json
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parent.parent / 'assets/pixel'
ROOT.mkdir(parents=True, exist_ok=True)


class Image:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.data = bytearray(width * height * 4)

    def rect(self, x, y, w, h, color):
        color = bytes.fromhex(color.lstrip('#'))
        rgba = color + b'\xff' if len(color) == 3 else color
        for py in range(max(0, y), min(self.height, y + h)):
            for px in range(max(0, x), min(self.width, x + w)):
                start = (py * self.width + px) * 4
                self.data[start:start + 4] = rgba

    def save(self, name):
        def chunk(kind, data):
            return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
        raw = b''.join(b'\0' + self.data[y * self.width * 4:(y + 1) * self.width * 4] for y in range(self.height))
        png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', self.width, self.height, 8, 6, 0, 0, 0))
        (ROOT / name).write_bytes(png + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))


tiles = Image(128, 32)
colors = ['718c58', '718c58', 'c5bda3', 'a67550', 'e0d6b4', '477d89', 'd2b482', '9e5044', 'c7bd9c', 'ac855c', '6d7773', 'd8c695', '425f43', 'c7bd9c', '526956', 'a88f6d']
for i, color in enumerate(colors):
    x, y = (i % 8) * 16, (i // 8) * 16
    def r(dx, dy, w, h, c):
        tiles.rect(x + dx, y + dy, w, h, c)
    r(0, 0, 16, 16, color)
    if i in [0, 1]:
        for px, py in [(3, 4), (11, 10), (6, 13)]:
            r(px, py, 2, 1, '8da467'); r(px, py - 1, 1, 1, '576f46')
        if i == 1:
            r(7, 7, 3, 2, 'ebcf81'); r(8, 6, 1, 4, 'f0e4bb')
    elif i in [2, 10]:
        r(0, 7, 16, 1, 'a6a58f' if i == 2 else '56645f'); r(7, 0, 1, 7, 'a6a58f' if i == 2 else '56645f'); r(3, 8, 1, 8, 'a6a58f' if i == 2 else '56645f')
    elif i == 3:
        r(0, 0, 16, 1, '744e36'); r(0, 8, 16, 1, '744e36'); r(6, 1, 1, 7, '936340'); r(11, 9, 1, 7, '936340')
    elif i == 4:
        r(0, 0, 8, 8, 'd2c6a5'); r(8, 8, 8, 8, 'd2c6a5'); r(0, 0, 16, 1, 'eee2c5')
    elif i == 5:
        r(1, 4, 8, 1, '70a2a3'); r(8, 11, 7, 1, '629498'); r(2, 12, 3, 1, '629498')
    elif i in [6, 8, 15]:
        r(0, 15, 16, 1, '8f8065'); r(0, 1, 16, 2, 'e0cda5'); r(1, 8, 4, 1, 'baa47d')
    elif i == 7:
        r(0, 0, 16, 2, 'c27857'); r(0, 7, 16, 2, '713d38'); r(0, 15, 16, 1, '713d38'); r(7, 1, 1, 6, 'b1634b')
    elif i == 9:
        r(0, 0, 16, 3, 'e0cda5'); r(2, 3, 12, 12, '634d3c'); r(3, 4, 10, 10, '947750')
    elif i == 12:
        r(2, 1, 12, 13, '557348'); r(5, 2, 4, 2, '74945a'); r(1, 14, 14, 2, '304c37')
    elif i == 13:
        r(2, 3, 12, 11, '76624b'); r(3, 4, 10, 9, '729fa0'); r(7, 4, 1, 9, 'e9d8b0'); r(3, 8, 10, 1, 'e9d8b0'); r(4, 5, 2, 2, 'b1c7b5')
    elif i == 14:
        r(1, 1, 14, 14, '667b64'); r(2, 2, 12, 12, '99a080'); r(4, 7, 8, 2, '536750')
tiles.save('tiles.png')

# Three walking frames in each of down/left/right/up, one 48px block per character.
characters = [('khue', '292d39', 'e8dfc5', '365568'), ('van', '303a31', 'ddd6bd', '587268'), ('long', '745037', 'c99257', '526b78'), ('nhi', '3c4c64', 'bec8c5', '596c90'), ('ngoc', '58433f', 'c26a59', '536653'), ('an', '473b33', 'a7a789', '67534b'), ('source', '706459', 'c2a075', '757854')]
sprites = Image(len(characters) * 48, 96)
for ci, (name, hair, shirt, pants) in enumerate(characters):
    for direction in range(4):
        for frame in range(3):
            x, y = ci * 48 + frame * 16, direction * 24
            def r(dx, dy, w, h, c):
                sprites.rect(x + dx, y + dy, w, h, c)
            # Transparent silhouette, exactly integral pixel edges.
            r(5, 2, 7, 2, hair); r(3, 4, 10, 7, hair)
            r(4, 5, 8, 7, 'ddb58d'); r(5, 11, 6, 2, 'ddb58d')
            if direction == 3:
                r(3, 4, 10, 8, hair); r(5, 2, 7, 3, hair)
            elif direction == 0:
                r(3, 4, 10, 2, hair); r(3, 6, 2, 2, hair); r(6, 8, 1, 1, '34343b'); r(10, 8, 1, 1, '34343b')
                if name == 'nhi':
                    r(5, 7, 3, 1, '718d91'); r(9, 7, 3, 1, '718d91'); r(8, 8, 1, 1, '718d91')
            else:
                left = direction == 1
                r(6 if left else 3, 4, 7, 4, hair); r(4 if left else 11, 8, 1, 1, '34343b')
            r(4, 13, 8, 6, shirt); r(3, 14, 1, 4, shirt); r(12, 14, 1, 4, shirt)
            r(3, 18 - (frame == 1), 1, 2, 'ddb58d'); r(12, 18 - (frame == 2), 1, 2, 'ddb58d')
            r(5, 19, 3, 3 - (frame == 1), pants); r(9, 19, 3, 3 - (frame == 2), pants)
            r(4, 22 - (frame == 1), 4, 1, '333d3b'); r(9, 22 - (frame == 2), 4, 1, '333d3b')
            if name in ['van', 'ngoc'] and direction in [0, 3]:
                r(3, 8, 2, 6, hair); r(11, 8, 2, 6, hair)
            if name == 'khue':
                r(8, 13, 1, 5, '587775'); r(11, 16, 2, 4, '896d46')
            if name == 'source':
                r(5, 15, 6, 5, 'ddd4b7')
sprites.save('characters.png')

objects = Image(128, 144)
names = ['tree', 'desk', 'bookcase', 'bed', 'planter', 'board', 'printer', 'bench', 'shop', 'lamp', 'camera', 'clock']
for index, name in enumerate(names):
    x, y = (index % 4) * 32, (index // 4) * 48
    def r(dx, dy, w, h, c):
        objects.rect(x + dx, y + dy, w, h, c)
    if name == 'tree':
        r(14, 29, 5, 17, '785839'); r(7, 11, 20, 24, '355840'); r(3, 18, 27, 13, '426647'); r(10, 6, 15, 26, '577748'); r(12, 10, 10, 4, '739355'); r(7, 22, 6, 4, '66884d')
    elif name == 'desk':
        r(3, 30, 26, 12, '9e704a'); r(2, 28, 28, 10, 'c39964'); r(4, 39, 3, 8, '684c3a'); r(26, 39, 3, 8, '684c3a'); r(5, 30, 10, 6, 'efe1bf'); r(21, 30, 5, 6, '557b71'); r(7, 32, 6, 1, '9f9b81')
    elif name == 'bookcase':
        r(3, 12, 26, 34, '846342'); r(5, 14, 22, 29, '4a4738')
        for row in [15, 26, 36]:
            for column, color in [(6, 'a16e56'), (10, '748b71'), (15, 'c3af72'), (19, '6b8b92'), (23, '9b7370')]:
                r(column, row, 3, 8, color)
            r(4, row + 8, 24, 2, 'ba8d59')
    elif name == 'bed':
        r(6, 10, 20, 37, '77583c'); r(7, 12, 18, 32, 'e5d6b6'); r(9, 14, 14, 7, 'f0e6d0'); r(7, 23, 18, 20, '7c9290'); r(7, 23, 18, 3, 'afc1b1'); r(7, 33, 18, 1, '687f7c')
    elif name == 'planter':
        r(10, 35, 13, 11, 'b47750'); r(8, 33, 17, 4, 'd79d69'); r(15, 20, 2, 14, '42684c'); r(7, 19, 11, 9, '658659'); r(17, 15, 9, 13, '789256'); r(12, 12, 8, 10, '527653')
    elif name == 'board':
        r(2, 17, 28, 25, '7e5b3e'); r(4, 19, 24, 21, 'bc9c6d'); r(6, 21, 9, 10, 'ebe1c3'); r(18, 24, 8, 12, 'd7dbb6'); r(9, 22, 2, 2, 'b65d4c'); r(21, 25, 2, 2, '5c7981'); r(5, 43, 2, 5, '725139'); r(25, 43, 2, 5, '725139')
    elif name == 'printer':
        r(5, 29, 23, 17, '526366'); r(7, 25, 19, 11, 'a5b1a4'); r(10, 18, 13, 13, 'efdfbd'); r(9, 38, 16, 3, '303f42'); r(10, 40, 13, 5, 'e5d4b2'); r(24, 30, 2, 2, 'ac7355')
    elif name == 'bench':
        r(2, 29, 28, 3, 'b48954'); r(2, 34, 28, 3, 'b48954'); r(2, 38, 28, 5, '9c7348'); r(5, 41, 3, 6, '655743'); r(24, 41, 3, 6, '655743')
    elif name == 'shop':
        r(3, 21, 26, 26, 'b38555'); r(2, 19, 28, 9, 'bb6656'); r(4, 20, 5, 7, 'e7d5ab'); r(14, 20, 5, 7, 'e7d5ab'); r(24, 20, 4, 7, 'e7d5ab'); r(6, 31, 20, 11, '6c5841'); r(8, 32, 6, 5, '657d79'); r(18, 34, 6, 4, 'e7d9b8')
    elif name == 'lamp':
        r(15, 13, 3, 34, '4a5755'); r(10, 12, 12, 4, '6d7770'); r(12, 4, 8, 9, 'd4b376'); r(14, 5, 4, 5, 'f3e1a9'); r(13, 45, 7, 3, '4a5755')
    elif name == 'camera':
        r(9, 27, 14, 10, '516465'); r(12, 24, 6, 4, '657571'); r(14, 29, 6, 6, 'a3bbb3'); r(15, 30, 4, 4, '394e56'); r(15, 37, 2, 8, '4b5751'); r(10, 46, 13, 2, '4b5751')
    else:
        r(10, 13, 14, 14, '8b6849'); r(12, 15, 10, 10, 'eddfbf'); r(16, 16, 1, 5, '536451'); r(16, 20, 4, 1, '536451'); r(15, 27, 4, 20, '8b6849'); r(10, 44, 14, 3, '8b6849')
objects.save('objects.png')
metadata = {'tileSize': 16, 'tiles': {'file': 'tiles.png', 'columns': 8, 'count': 16}, 'characters': {'file': 'characters.png', 'frameWidth': 16, 'frameHeight': 24, 'frames': 3, 'directions': ['down', 'left', 'right', 'up'], 'ids': [c[0] for c in characters]}, 'objects': {'file': 'objects.png', 'frameWidth': 32, 'frameHeight': 48, 'columns': 4, 'ids': names}, 'license': 'Original prototype assets authored in this project; no third-party assets.'}
# Regenerating map props must not replace the selected generated character set.
if (ROOT / 'atlas.json').exists():
    current = json.loads((ROOT / 'atlas.json').read_text(encoding='utf-8'))
    if current['characters'].get('layout') == 'character-rows':
        metadata['characters'] = current['characters']
        metadata['license'] = current['license']
(ROOT / 'atlas.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
print(f'Pixel assets: {ROOT}')
