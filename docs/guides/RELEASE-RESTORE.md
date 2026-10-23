# Local static release and recovery

From a contained, bootstrapped checkout:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/build.py --profile foundation-demo
```

The public CLI obtains current architecture/content/unit/browser/authoring/bot
gate receipts. Each receipt binds its raw report to the fingerprint of source,
tools, tests, content, master assets and recovery bundle. Changed inputs or damaged
reports invalidate the receipt. Missing proof runs the actual gate. Packaging unit
fixtures use labelled synthetic inputs; those are never public CLI evidence.

The build audits recovery bytes, provenance/license records, versions and asset
hashes; strips authoring documents/schemas/strings and unreachable developer modules;
revalidates the runtime pack; then exercises the staged artifact on a separate
read-only static server using native Chromium keyboard input. It also records
Firefox Nightly API/DOM compatibility smoke and real-time headless profile data.
Only a passing staged build replaces `dist/foundation-demo/latest.json`. An existing
fingerprinted directory containing unexpected/modified files is rejected.

The versioned directory and deterministic ZIP are local outputs. No upload,
publication, Steam integration or installer is performed. `foundation-demo` allows
known internal fixtures and grants no public distribution license. The default
`production` profile rejects those fixtures until their approval is explicit.
Tool/browser licenses are inventoried but their executables are not shipped.

Serve the directory named by `latest.json`:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/pipeline/release_host.py dist/foundation-demo/FINGERPRINT --port 8081
```

Replace `FINGERPRINT` with the actual directory. The host exposes only manifest
files, has no authoring routes, revalidates code/content, and caches hashed assets
immutably according to `CACHE-POLICY.json`. `_headers` is supplied for compatible
static hosts; configure equivalent headers elsewhere. ES modules require HTTP,
not `file://`. Player saves remain browser-origin-specific.

For a fresh source checkout, run [SETUP](SETUP.md). Tracked
`assets/bundles/` plus `assets/ASSET-INVENTORY.json` restore all required masters;
`build_assets.py` regenerates pinned renditions. Neither command consults the
historical archive. Corrupt/missing bundle bytes or conflicting local masters stop
restore instead of overwriting work. Commit source/content/inventory/bundle changes
together. `.venv`, `.tools`, `.cache`, extracted masters/renditions and `dist` are
recreatable and ignored.

Run `tools/ci.py` with the private venv to retain a UTF-8 complete gate report.
CI runs the same local commands on Windows using pinned portable tools. The workflow
is configured locally; a hosted Actions run requires an authorized push and is not
claimed by local verification. See [actual evidence](../testing/PHASE-0-EVIDENCE.md).
