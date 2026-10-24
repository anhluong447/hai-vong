"""Project-owned dependencies and disposable files must stay inside this checkout."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

from project_environment import ROOT


class LocalEnvironmentTests(unittest.TestCase):
    def test_browser_child_appdata_is_local_without_changing_parent_locations(self):
        module=self.module();before={name:os.environ.get(name) for name in ['APPDATA','LOCALAPPDATA']};environment=module.browser_environment()
        for name in before:
            self.assertTrue(Path(environment[name]).resolve().is_relative_to(ROOT/'.cache'),environment[name]);self.assertEqual(os.environ.get(name),before[name])
    def module(self):
        path = ROOT / 'tools/pipeline/local_environment.py'
        self.assertTrue(path.is_file(), 'project-local environment boundary missing')
        spec = importlib.util.spec_from_file_location('local_environment', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_temp_and_child_caches_ignore_inherited_external_locations(self):
        self.module()
        script = """
import json, os, sys, tempfile, subprocess
from pathlib import Path
sys.path.insert(0, str(Path.cwd()/'tools/pipeline'))
from local_environment import configure
configure(require_venv=False)
with tempfile.TemporaryDirectory() as folder:
    child = subprocess.check_output([sys.executable, '-I', '-B', '-c',
        'import tempfile; print(tempfile.gettempdir())'], text=True).strip()
    print(json.dumps({'folder':folder, 'child':child,
        'cache':os.environ['PIP_CACHE_DIR'], 'config':os.environ['PIP_CONFIG_FILE']}))
"""
        env = {**os.environ, 'TMP':'Z:/forbidden', 'TEMP':'Z:/forbidden',
               'TMPDIR':'Z:/forbidden', 'PIP_CACHE_DIR':'Z:/forbidden'}
        run = subprocess.run([sys.executable, '-I', '-B', '-c', script], cwd=ROOT,
                             env=env, text=True, capture_output=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        result = json.loads(run.stdout)
        for key in ('folder', 'child', 'cache'):
            self.assertTrue(Path(result[key]).resolve().is_relative_to(ROOT / '.cache'), result)
        self.assertEqual(result['config'], os.devnull)

    def test_system_python_cannot_run_project_checks(self):
        system = Path(sys.base_prefix) / ('python.exe' if os.name == 'nt' else 'bin/python3')
        run = subprocess.run([str(system), '-s', '-B', 'tools/check.py', 'architecture'],
                             cwd=ROOT, capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0, run.stdout)
        self.assertIn('tool.python.venv.required', run.stdout + run.stderr)

    def test_ffmpeg_override_cannot_escape_the_project_venv(self):
        self.module()
        script = """
import os, sys
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'tools/pipeline'))
os.environ['IMAGEIO_FFMPEG_EXE']=str(Path(sys.base_prefix)/'python.exe')
from build_assets import ffmpeg_tool
try:
    ffmpeg_tool()
except ValueError as error:
    print(error)
else:
    raise SystemExit('external executable was accepted')
"""
        run = subprocess.run([sys.executable, '-I', '-B', '-c', script], cwd=ROOT,
                             capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('tool.ffmpeg.outside_venv', run.stdout)

    def test_real_browser_uses_only_a_project_profile_and_temp(self):
        sys.path.insert(0, str(ROOT / 'tools/pipeline'))
        import browser_runner
        with patch.object(browser_runner.subprocess, 'Popen', wraps=subprocess.Popen) as launched:
            report = browser_runner.run_browser(ROOT, ['/tests/fixtures/harness/probe.js'])
        self.assertTrue(report['ok'], report)
        invocation = launched.call_args
        profile = next(arg.split('=', 1)[1] for arg in invocation.args[0]
                       if arg.startswith('--user-data-dir='))
        self.assertTrue(Path(profile).is_relative_to(ROOT / '.cache/tmp'))
        self.assertFalse(Path(profile).exists(), 'browser profile leaked after exit')
        for key in ('TEMP', 'TMP', 'TMPDIR', 'XDG_CACHE_HOME'):
            self.assertTrue(Path(invocation.kwargs['env'][key]).is_relative_to(ROOT / '.cache'))

    def test_bundle_rejects_external_destination_before_opening_a_writer(self):
        import build_assets
        destination = ROOT.parent / 'forbidden-project-bundle.zip'
        # Never let this regression test actually write outside the project.
        with patch.object(build_assets.zipfile, 'ZipFile',
                          side_effect=AssertionError('external writer was opened')):
            result = build_assets.bundle_sources(ROOT, {'entries': []}, destination)
        self.assertFalse(result['ok'], result)

    def test_source_writer_cannot_be_rooted_outside_the_project(self):
        from source_writer import SourceWriter
        with self.assertRaisesRegex(ValueError, 'tool.path.outside_project'):
            SourceWriter(ROOT.parent, [], lambda *_: {'ok': True})
