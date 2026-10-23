# Contained Windows development setup

All project tools, packages, browser profiles, caches and reports remain in this
checkout. No installer, global package, PATH, registry or service changes.
An existing Python executable may bootstrap the pinned portable tools:

```powershell
python -B tools/setup.py --portable
.venv/Scripts/python.exe -B -X utf8 tools/pipeline/restore_assets.py
.venv/Scripts/python.exe -B -X utf8 tools/pipeline/build_assets.py
.venv/Scripts/python.exe -B -X utf8 tools/check.py all --profile foundation-demo
```

The Windows AMD64 portable versions, official URLs, archive bytes and SHA-256 pins
are in `content/pipeline/portable-tools.json`. Python's official NuGet distribution
provides the private venv interpreter; packages come only from
`requirements-tools.txt`. Downloaded archives/wheels use `.cache/toolchain`,
pip uses `.cache/pip`, executables use `.tools`, and browser child AppData/profile
paths use `.cache/browser-platform` and `.cache/tmp`. Existing venvs are retained;
the fresh-checkout recipe proves a new portable Python venv.

ZIP extraction rejects escaping/reserved/colliding paths and verifies existing
tool bytes before reuse. Firefox policy disables updates, telemetry and studies.
On Windows, bootstrap grants standard sandbox identities **read/execute only** on
the resolved `.tools/chromium-*` tree; it never disables the browser sandbox or
changes permissions outside that tool tree. Modified tools fail verification.

`python -B tools/setup.py` can retain existing Python/browser prerequisites without
provisioning ZIP tools; Firefox release smoke still requires the pinned ZIP.
`HOIAM_BROWSER` may explicitly select an existing Chromium-family executable.
This override is reported through the actual user agent; it does not certify the
pinned browser. Portable provisioning currently supports Windows AMD64 only.

See [authoring setup](AUTHORING.md), [asset workflow](ASSETS.md),
[debugging](DEBUG-WORKFLOW.md) and [release/restore](RELEASE-RESTORE.md).

Primary tool references: [Python NuGet CI distribution](https://docs.python.org/3.12/using/windows.html#the-nuget-org-packages),
[Chrome for Testing](https://github.com/GoogleChromeLabs/chrome-for-testing),
[Mozilla headless/profile commands](https://firefox-source-docs.mozilla.org/browser/CommandLineParameters.html).
