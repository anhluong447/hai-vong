import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

from project_environment import ROOT

class PreflightTests(unittest.TestCase):
    def test_missing_browser_returns_diagnostic(self):
        path = ROOT / 'tools/pipeline/preflight.py'
        self.assertTrue(path.exists(), 'browser capability detector not implemented')
        spec = importlib.util.spec_from_file_location('preflight', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        result = module.detect_browser(explicit='Z:/missing-browser.exe')
        self.assertFalse(result['ok'])
        self.assertEqual(result['errors'][0]['code'], 'tool.browser.missing')

    def test_unimplemented_suite_never_succeeds(self):
        run = subprocess.run([sys.executable, 'tools/check.py', 'unregistered-fixture-suite'], cwd=ROOT, capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('not-implemented', run.stdout)

    def test_real_browser_harness_reports_failing_and_passing_assertions(self):
        path = ROOT / 'tools/pipeline/browser_runner.py'
        self.assertTrue(path.exists(), 'browser test runner not implemented')
        spec = importlib.util.spec_from_file_location('browser_runner', path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        result = module.run_browser(ROOT, modules=['/tests/fixtures/harness/probe.js'], params={'fail': '1'})
        self.assertFalse(result['ok'], result)
        self.assertEqual(result['failed'], 1, result)
        result = module.run_browser(ROOT, modules=['/tests/fixtures/harness/probe.js'])
        self.assertTrue(result['ok'], result)
        self.assertEqual(result['passed'], 1, result)

class NativeKeyboardTests(unittest.TestCase):
    def test_real_keyboard_defaults_reach_native_controls(self):
        sys.path.insert(0,str(ROOT/'tools/pipeline'))
        from browser_runner import run_browser
        report=run_browser(ROOT,['/tests/fixtures/harness/keyboard.js'])
        self.assertTrue(report['ok'],report)
        self.assertEqual(report['passed'],1)

if __name__ == '__main__':
    unittest.main()

class RequestedServerTests(unittest.TestCase):
    def test_requested_browser_base_url_must_be_reachable(self):
        run=subprocess.run([sys.executable,'-X','utf8','tools/check.py','authoring','--base-url','http://127.0.0.1:1'],cwd=ROOT,capture_output=True,text=True)
        self.assertNotEqual(run.returncode,0)
        self.assertIn('test.server.unreachable',run.stdout)
