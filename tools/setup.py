"""Bootstrap only a private .venv; never install into user/system Python."""
from pathlib import Path
import argparse
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline.local_environment import ROOT, configure, local_path


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--portable',action='store_true',help='Provision pinned ZIP tools inside this checkout');args=parser.parse_args()
    env = configure(require_venv=False)
    interpreter=sys.executable
    if args.portable:
        sys.path.insert(0,str(ROOT/'tools/pipeline'))
        from portable_tools import provision_all
        result=provision_all(ROOT)
        if not result['ok']:raise SystemExit(str(result))
        interpreter=result['value']['python']
    venv = local_path('.venv')
    executable = venv / ('Scripts/python.exe' if sys.platform == 'win32' else 'bin/python')
    # Re-running venv also repairs an interrupted ensurepip without deleting data.
    if not executable.is_file():
        subprocess.run([interpreter, '-I', '-B', '-m', 'venv', str(venv)],cwd=ROOT,env=env,check=True)
    config = venv / 'pyvenv.cfg'
    if 'include-system-site-packages = false' not in config.read_text().lower():
        raise SystemExit('tool.python.system_site_packages.forbidden')
    wheels = local_path('.cache/toolchain')
    wheels.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(executable), '-I', '-B', '-m', 'pip', 'install', '--no-user',
                    '--only-binary=:all:', '--cache-dir', str(local_path('.cache/pip')),
                    '--find-links', str(wheels), '-r', str(ROOT / 'requirements-tools.txt')],
                   cwd=ROOT, env=env, check=True)
    print('Project tools ready: ' + str(executable))


if __name__ == '__main__':
    main()
