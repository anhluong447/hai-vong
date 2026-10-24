"""Render geometric test masters from retained authoring data; never production art."""
import json
import math
from pathlib import Path
import struct
import wave
from local_environment import configure, require_project_path, require_venv_path
configure()
import PIL
require_venv_path(PIL.__file__, 'tool.pillow.outside_venv')
from PIL import Image,ImageDraw

def generate(root):
    root=require_project_path(root);folder=root/'assets/sources';data=json.loads((folder/'fixture-inputs.json').read_text(encoding='utf-8'))
    for definition in data['images']:
        image=Image.new('RGBA',tuple(definition['size']),definition['background']);draw=ImageDraw.Draw(image)
        for shape in definition['shapes']:
            if shape['type']=='rectangle':draw.rectangle(shape['points'],fill=shape['fill'])
            elif shape['type']=='ellipse':draw.ellipse(shape['points'],fill=shape['fill'])
            elif shape['type']=='polygon':draw.polygon([tuple(p) for p in shape['points']],fill=shape['fill'])
            else:raise ValueError('unsupported fixture primitive')
        destination=require_project_path(folder/definition['file']);destination.relative_to(folder)
        image.save(destination,format='PNG')
    for tone in data['tones']:
        destination=require_project_path(folder/tone['file']);destination.relative_to(folder)
        with wave.open(str(destination),'wb') as stream:
            rate=tone['sampleRate'];stream.setnchannels(1);stream.setsampwidth(2);stream.setframerate(rate)
            stream.writeframes(b''.join(struct.pack('<h',int(32767*tone['gain']*math.sin(2*math.pi*tone['frequency']*i/rate))) for i in range(round(rate*tone['duration']))))
if __name__=='__main__':generate(Path(__file__).resolve().parents[2])
