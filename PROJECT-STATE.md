# Hoi Am workspace state

Updated: 2026-10-22 (Asia/Bangkok).

## Mandatory project containment

The entire project, plans, skills, dependencies, worktrees, portable toolchains,
caches, logs, temporary files and test browser profiles must stay inside the
project folder. No project installation into Windows/AppData/user/global folders;
no PATH/registry/service changes. Python packages use a private `.venv` with
system site packages disabled. Root AGENTS.md, coding rules, local skill and plan
now carry this requirement. Read the repository skill directly; do not install
or synchronize it externally.

## Active implementation location and progress

Original project: `C:/Users/anhlh52/AndroidStudioProjects/Ask`.
Implementation: `.worktrees/phase-0`, branch `feat/phase-0-skeleton-tools`.
Plan commit: `e9a4d83`; containment commit: `ade0461`.
T01 through T05 are implemented and committed: contracts/checks, content/flags,
story session/checkpoints, JSON authoring workspace and resource pipeline/recovery.
T06 is implemented: keyboard-driven 2D fixture scenes, NPC dialogue, doors, camera,
DPR/viewport, focus, text, animation, audio and presentation timeline.
T07 through T14 remain; no 12-week production expansion.
The latest user instruction resumes the approved plan after containment remediation.
Continue at T07 in the active worktree without another permission prompt.
No push, publication or merge is authorized.

## Latest implementation evidence (T06)

- Real keyboard journey: walk, NPC dialogue/choice, pause/resume and door to a second
  scene. Geometry/tone remain labelled development fixtures, not production art.
- Shared scene/actor/input/sequence contracts and validation; pure world commands
  through GameSession. Stale/failed scene requests cannot commit old candidates.
- Browser gates passed: 45 JS unit tests, 28 Python tests, 13 platform/journey/display
  tests, 8 authoring tests, real-pack content and architecture. Full reports are in
  implementation `.cache/test/t06-final-*.json`. Browser/authoring used the live
  loopback server with `--base-url http://127.0.0.1:8080`.
- Actual headless browser viewport 1280x1000 at DPR 2: canvas CSS 1068x600.75,
  backing 2136x1202. Readiness was awaited before capturing the actual rendered PNG
  at `.cache/test/screenshots/8fdb99069a1ca48e.png`; a virtual-time-only screenshot
  captured loading and is not acceptance evidence. No physical FPS claim.
- Development locale encoding corruption was fixed; independent Unicode escape
  tests verify real Vietnamese/graphemes and workspace labels.
- RunSnapshot 1 review: optional pending/moving fields remain additive; validate
  real scene IDs/bounds/facing/spawns. T07 still must integrate adapter snapshots,
  transactional persistent save/restore and schema/content migration policy.
- Platform details: docs/engineering/BROWSER-PLATFORM.md. The read-only dev host
  is running on port 8080 for review; authoring writes are not enabled.

## Containment implementation and recovery

- Bootstrap from the implementation checkout with `python -B tools/setup.py`.
  Then use `.venv/Scripts/python.exe -B` (Windows) or `.venv/bin/python -B`.
  Pillow 12.3.0 and imageio-ffmpeg 0.6.0 are now installed only in this private venv.
  Existing system Python/browser executables are invoked without modification;
  the project no longer imports globally installed Pillow or `.cache/python`.
- Project commands reject non-venv execution. Shared environment setup redirects
  temp, pip/imageio/XDG caches and subprocess temp paths into `.cache/`. Pip user
  configuration and inherited destination settings are disabled during setup.
  Browser tests use disposable `.cache/tmp` profiles, not the normal user profile.
- Source-writer roots, bundle destinations and asset writes reject resolved paths
  outside the checkout. Source/restore/build files remain separate from caches.
- The old external project skill (4 files) and one empty leftover test profile were
  moved into the original project `.cache/recovered-external-artifacts/`.
  All 4 original skill SHA-256 hashes matched before/after; both external paths
  were verified absent. Recovery evidence is in that directory's verification.json.
  Historical archive skill-verification records describe the earlier installation;
  they are not instructions to reinstall it. Other existing software was untouched.
- The obsolete `.cache/python` dependency directory is inactive; no import path
  points to it. Only the venv supplies Python project dependencies going forward.

## Actual verification for containment

- RED: inherited external temp/cache defaults and missing venv guard reproduced;
  bundle/source writer tests also exposed missing external-root rejection without
  allowing the regression test to write outside the project.
- GREEN: 27 Python tests and 40 browser unit tests; 8 authoring browser tests;
  1 real-pack content test; architecture and asset audit pass. A real browser
  regression checks its profile/temp locations and profile cleanup on exit.
- Asset build through the new venv succeeds with zero changed renditions.
  The FFmpeg executable still matches its pinned SHA-256; audio conversion is
  exercised by the Python suite. Reports stay under implementation `.cache/test/`.
- Browser/Python tests require sandbox escalation on this machine due temporary
  directory ACLs. Escalation does not authorize an external installation and does
  not change Chrome's own sandbox. All project-managed output paths stay local.
- Containment-stage host was stopped; the current T06 host is recorded above.
  Production art/UI design and the remaining
  gameplay/editor/hot-reload/release work have not been completed by this change.

## Protected sources and historical evidence

Protected Bible/GDD files under `docs/design/narrative/` and `docs/design/gameplay/`
are unchanged. The ignored archive remains at `archive/legacy-2026-10-22/payload/`
in the original project: 35,171 files, 5,105,177,266 bytes, prior verification passed.
Its inventory SHA-256 is
`3962b62c8ff13fc30617322fde4b2ea83be9cc9e38c78a161f8c3490d53b8f3b`.
No full archive rehash was performed for this environment change.

Mandatory recovery: root AGENTS.md, this checkpoint, CODING-RULES.md, repository
SKILL.md, then the active implementation checkpoint/plan and relevant design sources.
A context summary does not replace reopening these files.

Active plan: [Phase 0](docs/superpowers/plans/2026-10-22-phase-0-skeleton-tools.md). Execution ledger: `.superpowers/sdd/2026-10-22-phase-0-skeleton-tools/`.
