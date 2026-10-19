"""Capture final dossier layout variants without replacing staged review evidence."""
import argparse
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8088')
    parser.add_argument('--only', nargs='+', help='Capture specific names from the final inventory')
    args = parser.parse_args()
    assert args.base_url.startswith(('http://127.0.0.1:', 'http://localhost:'))
    output = ROOT / 'docs/ui-reviews/dossier-polish'
    output.mkdir(parents=True, exist_ok=True)
    captures = [('final-runtime', dict(tab='cases'))]
    variants = ['concept', 'no-photo', 'long-title', 'many-history', 'empty-history',
                'long-list', 'energy-zero', 'energy-full']
    captures += [(f'final-{v}-fixture', dict(tab='cases', fixture='dossier', variant=v)) for v in variants]
    captures += [(f'final-{g}', dict(tab='cases', group=g)) for g in ['side', 'general']]
    if args.only:
        assert set(args.only) <= {name for name, _ in captures}, 'Unknown capture name'
        captures = [(name, params) for name, params in captures if name in args.only]
    for name, params in captures:
        subprocess.run([sys.executable, str(ROOT / 'tools/capture_replica.py'),
                        '--url', args.base_url+'/tools/coastal-menu-v2-preview.html?'+urlencode(params),
                        '--screen', 'menu', '--output', str(output / (name+'.png'))], check=True)
        print(name, flush=True)


if __name__ == '__main__':
    main()
