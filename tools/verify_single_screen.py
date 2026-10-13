"""Run the existing browser suite with a profile inheriting workspace permissions.

On Windows, Python's private temporary-directory ACL can exclude the restricted
sandbox token. A normal directory inside the workspace inherits its allowed ACL.
The suite, assertions and result contract are unchanged.
"""
from contextlib import contextmanager
from pathlib import Path
import shutil
import uuid

import run_browser_tests


ROOT = Path(__file__).resolve().parent.parent


@contextmanager
def workspace_profile(prefix='press-club-test-', **_):
    parent = ROOT / 'tools' / '.single-screen-profiles'
    parent.mkdir(exist_ok=True)
    profile = (parent / (prefix + uuid.uuid4().hex)).resolve()
    if not profile.is_relative_to(parent.resolve()):
        raise ValueError('Browser profile must stay inside the workspace')
    profile.mkdir()
    try:
        yield str(profile)
    finally:
        if profile.is_dir() and profile.is_relative_to(parent.resolve()):
            shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    run_browser_tests.tempfile.TemporaryDirectory = workspace_profile
    raise SystemExit(run_browser_tests.main())
