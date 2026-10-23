"""Keep project-managed tools, caches and temporary files inside this checkout."""
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]


def require_project_path(candidate):
    path = Path(candidate).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('tool.path.outside_project: ' + str(candidate))
    return path


def local_path(relative):
    return require_project_path(ROOT / relative)


def configure(require_venv=True):
    sys.dont_write_bytecode = True
    if require_venv:
        expected = local_path('.venv')
        config = expected / 'pyvenv.cfg'
        if (Path(sys.prefix).resolve() != expected or sys.prefix == sys.base_prefix
                or not config.is_file()
                or 'include-system-site-packages = false' not in config.read_text().lower()):
            raise SystemExit('tool.python.venv.required: run python -B tools/setup.py, '
                             'then use .venv/Scripts/python.exe (Windows) or .venv/bin/python')
    directories = {
        'TEMP': '.cache/tmp', 'TMP': '.cache/tmp', 'TMPDIR': '.cache/tmp',
        'PIP_CACHE_DIR': '.cache/pip', 'XDG_CACHE_HOME': '.cache/xdg/cache',
        'XDG_CONFIG_HOME': '.cache/xdg/config', 'XDG_DATA_HOME': '.cache/xdg/data',
        'XDG_STATE_HOME': '.cache/xdg/state', 'IMAGEIO_USERDIR': '.cache/imageio',
    }
    # Inherited pip destinations/configuration cannot redirect this project install.
    for key in list(os.environ):
        if key.startswith('PIP_'):
            del os.environ[key]
    for key, relative in directories.items():
        path = local_path(relative)
        path.mkdir(parents=True, exist_ok=True)
        os.environ[key] = str(path)
    os.environ.update(PIP_CONFIG_FILE=os.devnull, PIP_DISABLE_PIP_VERSION_CHECK='1',
                      PYTHONNOUSERSITE='1', PYTHONDONTWRITEBYTECODE='1')
    tempfile.tempdir = str(local_path('.cache/tmp'))
    return dict(os.environ)


def require_venv_path(path, code):
    resolved = Path(path).resolve()
    if not resolved.is_relative_to(local_path('.venv')):
        raise ValueError(code)
    return resolved

def browser_environment():
    environment=configure()
    for key,name in [('APPDATA','roaming'),('LOCALAPPDATA','local')]:
        path=local_path('.cache/browser-platform/'+name);path.mkdir(parents=True,exist_ok=True);environment[key]=str(path)
    environment.update(MOZ_CRASHREPORTER_DISABLE='1',MOZ_CRASHREPORTER_NO_REPORT='1')
    return environment
