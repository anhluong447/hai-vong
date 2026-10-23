import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

from project_environment import ROOT

class PreflightTests(unittest.TestCase):
    def test_project_portable_browser_is_preferred_over_machine_discovery(self):
        import tempfile
        from preflight import detect_browser
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'content/pipeline').mkdir(parents=True);(root/'.tools/browser').mkdir(parents=True)
            executable=root/'.tools/browser/chrome.exe';executable.write_bytes(b'fixture')
            (root/'content/pipeline/portable-tools.json').write_text(json.dumps({'tools':{'chromium':{'destination':'.tools/browser','executable':'chrome.exe'}}}))
            result=detect_browser(project_root=root)
            self.assertTrue(result['ok'],result);self.assertEqual(Path(result['value']),executable)
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
    @unittest.skipUnless(sys.platform == 'win32', 'Windows open-file deletion semantics')
    def test_profile_cleanup_waits_for_a_delayed_browser_file_release(self):
        import tempfile
        import threading
        sys.path.insert(0, str(ROOT/'tools/pipeline'))
        import browser_runner
        with tempfile.TemporaryDirectory(dir=ROOT/'.cache/tmp') as directory:
            profile=tempfile.TemporaryDirectory(dir=directory)
            path=Path(profile.name)/'browser.log'
            path.write_bytes(b'fixture')
            handle=path.open('rb')
            release=threading.Timer(.25,handle.close)
            release.start()
            try:
                browser_runner.cleanup_profile(profile)
                self.assertFalse(Path(profile.name).exists())
            finally:
                handle.close()
                release.join()
                profile.cleanup()

    def test_native_screenshot_is_saved_inside_the_project(self):
        sys.path.insert(0,str(ROOT/'tools/pipeline'))
        from browser_runner import run_browser
        report=run_browser(ROOT,['/tests/fixtures/harness/screenshot.js'])
        self.assertTrue(report['ok'],report)
        path=ROOT/report['results'][0].get('artifact','missing')
        self.assertTrue(path.is_relative_to(ROOT/'.cache/test/screenshots'))
        from PIL import Image
        with Image.open(path) as image:self.assertEqual(image.size,(960,720))

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
