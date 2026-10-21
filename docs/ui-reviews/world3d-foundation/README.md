# Full 3D foundation M1 — 2026-10-21

Approved scope: a separate playable low-poly newsroom at `world3d.html`, with
mesh environment AND humanoid mesh actors. The player and Vân are prototype
mannequins; final character art, GLB exports, full gameplay/UI integration and
a 3D editor belong to M2–M4. Existing 2D entries remain available.

## Implemented

- 12×10 m, Y-up room with authored floor, cutaway walls/windows, desks/chairs,
  bookshelf, plants, lamp and noticeboard. Source recipes and materials live in
  `content/world3d/`; no pixel textures, billboard actors or image backdrop.
- Camera-relative WASD/arrows, normalized diagonal speed, meter-scale circle/
  AABB collision, substeps and sliding; range/occlusion checks for interaction.
- Perspective camera, direct/ambient light and shadows; narrow viewports increase
  camera distance to keep the whole walkable room visible.
- Localized DOM controls, pause/dialogue, keyboard and mouse NPC selection.
  Isolated memory GameSession, no save reads/writes and no gameplay commands.
- Unsupported GPU fallback, real context-loss retry, one owned frame loop,
  idempotent disposal and paused BFCache history restoration.
- Three.js **0.180.0/r180** vendored unchanged with MIT license and SHA-256
  [inventory](../../../vendor/three/INVENTORY.json). Existing `.gitattributes`
  asset rules were retained; vendor bytes get their own preservation rule.

## Verification evidence

- Full browser suite: **185/185 passed** (168 existing + 17 new). Preserved
  baselines match all **8 sandbox** and **4 gameplay** policies.
- Frozen 2D product verifier: **1,583 files**, **1,076,338,104 bytes**,
  **0 issues** after M1 implementation. Original map/tile JSON, domain,
  application, baseline bytes, art and old entry pages were also compared to
  the M0 commit and remain unchanged.
- Focused browser suite: **17/17 passed**, including real WebGL mount,
  meter-scale mesh bounds, actual geometry/animation, collision/occlusion,
  resized raycasting, input focus, pause, retry, disposal and storage isolation.
- TDD observed: navigation **0/4 → 4/4**, mesh factory **4/7 → 7/7**, runtime
  **7/10 → 10/10**, controller **10/14 → 14/14**, resume focus **14/15 → 15/15**.
- Native CDP checks passed at **1280×720** and **390×844**: physical key and
  pointer routing, distant click without teleport, walk to Vân, interaction,
  pause/resume, wall collision and cleared movement on trusted Tab.
- `WEBGL_lose_context` caused actual GPU context loss; retry created one new
  canvas, kept session data unchanged and left localStorage empty.
- Actual navigation to `pixel.html` and Back passed. Chrome restored the page
  through **BFCache on both viewports**, with a paused usable scene.
- HTTPS requests were blocked during review; all resource loads stayed on the
  local origin. M1 does not depend on generated art files or a runtime CDN.
- Menu/screen/dialogue/world generated-output checks passed. Architecture:
  **0 issues**, **1441 text entries**.

An independent read-only final reviewer found two P2 bugs: held movement after
focus change and a blank page on BFCache return. Both were reproduced by failing
regressions, fixed, then verified by focused tests and native Tab/history input.
The review returned no other concrete correctness findings. The compact camera
change also has a four-corner projection regression observed failing before fix.

Headless documents with no window focus update `activeElement` without dispatching
native focus events. That unit test injects the focusin transport only in that
case; the native review separately uses trusted Tab with focus emulation enabled.

## Rendering diagnostics and limitations

The native captures used ANGLE on **Microsoft Basic Render Driver / D3D11**,
not a certified hardware-GPU player benchmark. Both captures reported **168 draw
calls**, **3,224 triangles**, **61 geometries**, DPR 1. For each viewport the last
240 samples had median frame interval around **16.7 ms** and p95 around **33.4 ms**.
Screenshot/input timing and software rendering affect these values. They prove
functional rendering, not a stable 60 fps performance result on target hardware.
The approved 60 fps desktop target still needs a named hardware-GPU run.

Local generated evidence (ignored by Git):

| Artifact | Purpose |
| --- | --- |
| `room-1280.png`, `room-390.png` | Initial scene and compact camera framing |
| `movement-frame-*.png` | Consecutive movement frames from native input |
| `interaction-*.png`, `wall-*.png` | Dialogue and collision outcomes |
| `gpu-recovery-*.png`, `history-return-*.png` | Actual context failure and history restoration |
| `report.json` | GPU/browser, movement trace, frame samples and native assertions |

## Reproduce

Serve the workspace on port 8096; run browser processes sequentially:

```powershell
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8096/tests/world3d.html --profile-root tmp/browser-tests --timeout 90
python tools/review_world3d.py --base-url http://127.0.0.1:8096 --output docs/ui-reviews/world3d-foundation
python tools/run_browser_tests.py --real-time --url http://127.0.0.1:8096/tests/index.html --profile-root tmp/browser-tests --timeout 240
python tools/check_baselines.py
python tools/check_architecture.py
python archive/products/coastal-2d-2026-10-21/verify_snapshot.py
```

[Usage](../../guides/WORLD3D-PROTOTYPE.md),
[approved spec](../../design/specs/2026-10-21-full-3d-foundation-design.md),
[local implementation plan](../../design/plans/2026-10-21-full-3d-foundation.md).
