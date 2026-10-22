# Resource pipeline and recovery

Authoritative import settings/provenance: `content/assets/imports.json`. Source masters
and generation input JSON are in the versioned ZIP named there. The ZIP is tracked in
ordinary Git while fixture sizes remain small; no LFS server is required to recover
this pack. Large production bundles may move to LFS/versioned storage deliberately.
The ignored historical archive is never a dependency of the new pack.

## Setup / fresh checkout

Use Python 3.12+ with `requirements-tools.txt` in a workspace-local virtual environment,
or existing versions that match `content/pipeline/toolchain.json`. The current tested
asset worker is Windows x64: Pillow 12.3.0 and imageio-ffmpeg 0.6.0 wrapping FFmpeg 7.1,
with its executable SHA-256 pinned. A different platform/build fails until explicitly
probed/pinned; the exported browser game does not require these offline tools.

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-tools.txt
.venv/Scripts/python.exe tools/pipeline/restore_assets.py
.venv/Scripts/python.exe tools/pipeline/build_assets.py
.venv/Scripts/python.exe tools/pipeline/audit_assets.py
```

This agent already has Pillow globally; FFmpeg was installed only in `.cache/python`,
not global Python. No game engine or runtime dependency was installed. Core runtime
ES modules still run directly in the browser with no Node or package-manager step.

## Supported v1 transformations

- PNG RGBA masters to optimized PNG renditions. Max dimension, source, ID and license
  come from imports. Shelf-packed atlases have authored padding/max size and generated
  frame rectangles; invalid bounds/missing source block the build.
- PCM WAV masters to Ogg Vorbis through pinned FFmpeg. Quality/sample rate/channels
  are import data. Loop/crossfade/bus settings belong in `content/audio/cues.json`.
- Animation clips reference asset/frame IDs with data-owned durations and pivots.
  Fonts can be resolved by the browser resource decoder; custom-font conversion/import
  is not claimed by the v1 PNG/WAV converter. System-font text remains supported.

Image/audio conversions were actually probed; repeated Vorbis builds matched SHA-256.
Cache keys include input/config/tool versions. Same inputs reuse existing outputs;
a changed master rebuilds itself and dependent atlases. Generated manifest publication
is separate from master inputs; failed validation never publishes a replacement manifest.

Inspect an import candidate with `python tools/pipeline/import_assets.py SOURCE --id ID --license ID`.
Accept edits in managed imports; run build/audit. `--bundle` on build updates the resource
ZIP and inventory intentionally. Commit the import settings, ZIP, inventory and generated
manifest together; never patch a generated manifest independently. Workspace marks
it read-only, including the backend write allowlist.

Restore verifies bundle hash, member list, paths, sizes and per-source hashes before
writing. Existing different masters cause a conflict before any write. Validate a bundle
in an empty temporary workspace before relying on it for recovery. Source/destination
hashes are part of the inventory; a filename list alone cannot recover ignored bytes.

The current geometric PNGs and synthetic tone are development fixtures generated from
retained inputs, not approved production art or an external distribution license grant.
Their internal-use provenance is explicit in imports. Tool licensing and resource
licensing are separate: [Pillow](https://pillow.readthedocs.io/en/12.3.0/) and the
[imageio wrapper](https://pypi.org/project/imageio-ffmpeg/0.6.0/) have their own notices;
the packaged FFmpeg executable reports GPL/version3 build flags. Offline executables
are not included in the player export; final release notices/audit are T13.

## Runtime lifecycle

AssetCatalog uses shared resource semantics; AssetService acquires scene groups using
revision/signal and returns explicit leases. Shared resources decode once and are freed
at their last lease. Scene ResourceScope cancels pending loads and releases owned leases.
Missing optional images use a declared placeholder; required resources reject the group.
Decoded bytes are checked against the manifest hash to reject mixed content revisions.
