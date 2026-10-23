# Hoi Am workspace state

Updated: 2026-10-23 (Asia/Bangkok).

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
T01 through T12 are implemented in the active worktree; T13 through T14 remain.
No 12-week production expansion.
The latest user instruction resumes the approved plan after containment remediation.
Continue at T13 in the active worktree without another permission prompt.
No push, publication or merge is authorized.

## Current checkpoint (T12 complete; T13 next)

T01-T12 are implemented in the isolated worktree. Earlier gameplay/hearing/save
contracts are documented in docs/engineering/{GAMEPLAY-CONTRACT,HEARING-CONTRACT,
PLAYER-SAVES}.md, resource/story/debug recipes in docs/guides/, and task decisions
in the execution ledger. Continue the latest authorized plan; do not restart old
tasks from historical evidence below. Current details and checks follow.

## T12 complete; T13 in progress

T11 committed as 261fa39. T12 implements safe source/state reload with explicit
restart/migration, isolated typed debug/jump/skip and bounded trace/replay, local
crash exports, authenticated revision polling and incremental PNG asset rebuild.
DebugPanel/TracePanel are integrated in the workspace and use real Canvas/TextView
owners without player persistence. Dirty/conflicting source work, stale watch/load
responses and invalid candidate state preserve the last-good session/resources.
Adopted previews detach preparation cancellation. Source selectors refresh after
successful working-copy reload; native regression confirms later rejection retains
that adopted view. No player snapshot field was added.

Actual final gates: architecture/content pass; 119 JS + 42 Python unit,
35 browser, 40 authoring and 7 bot tests pass. Reports: .cache/test/t12-final-*.json.
Actual pack traversal: 2/2 nodes, 1/1 choice, 6/6 assets and 2/2 managed fixtures,
no unexplored branches. Bot behavior tests separately cover two-branch input,
missing required assets, dead nodes/invalid flags, loops/budgets, unresolved guards
and declared optional silent-audio degradation. The independent native keyboard
bot runs the maintained real player journey. Reports: .cache/reports/bot/.

Production entry reachability rejects mutation-debug/authoring modules and unknown
dynamic imports. A reproduced Windows denied-POST reset was fixed by bounded body
draining before rejection and Content-Length on JSON responses. Earlier intermittent
Chrome startup timeout remains an environment uncertainty; request/process/stderr
diagnostics are retained, not retried away. Final six gates are green.

Guide: docs/guides/DEBUG-WORKFLOW.md. Live reload targets isolated development
playtests; audio audition remains in the Audio panel and player profiles are not
rewritten. A visual debug snapshot with no committed scene and an initial pending
scene requires explicit restart; pure reload/resource ports and normal player
save/load remain separate. Full authored chapter/release acceptance is still pending.

T12 committed as f91ee19. T13 is active; read task-13-brief.md in the execution
ledger and existing toolchain/asset recovery contracts. Next: release/CI/license/
performance/restore, then T14 authored
acceptance plus one fresh whole-branch review. Release suite remains unimplemented;
do not claim full P0 or 12-week game completion. No external install, protected
Bible/GDD/archive mutation, push/merge/publication or production expansion authorized.


## T13 packaging/toolchain checkpoint

T13 remains uncommitted and incomplete. Deterministic filtered assembly has
packaging tests for missing gates/inputs, hashes/licenses/versions/debug inclusion,
byte-identical ZIPs and contaminated existing artifacts. Gate receipt work binds
reports to current source/master fingerprints; public release orchestration,
actual export play/smoke/performance, CI and fresh-checkout recovery remain pending.

Pinned official CPython NuGet 3.12.10, Chrome for Testing 156.0.8078.47 and Firefox
Nightly 161.0a1 ZIPs were downloaded/hash-verified and extracted ONLY into this
worktree's .cache/toolchain and .tools. Portable CPython actually created an isolated
.cache/portable-python-probe/.venv with working pip. No installer, global package,
PATH, registry or service change occurred. Firefox policy disables updates/studies/
telemetry; browser child AppData/cache/profile paths are project-local.
Firefox has not yet run; Nightly smoke will not certify stable/ESR compatibility.

Actual focused checks so far: initial 4 packaging tests passed; new contaminated
artifact regression RED→GREEN; gate report tamper/failure receipt test RED→GREEN;
portable extraction initial 2 tests passed, new case-collision/policy tests exposed
the missing guards (currently being implemented). Full T13 gates have NOT run.


## Latest user steering: T14 narrative source

User explicitly directed T14 level/story design to use
`docs/history/narrative/First3Days.md`. Actual file currently exists in the original
checkout (not this implementation worktree), SHA-256 `f55787d3363ee2fb9a82e4ca171a67cf713b6dc2475924005d1d548aae3b2d30`. Read it there;
do not overwrite or silently omit it from recovery. This source informs authored
scenes/dialogue, subject to finalized Bible/GDD gameplay contracts. T13 continues
first; T14 is not complete. No protected design rewrite is authorized.


## T13 verified build checkpoint (fresh restore pending)

Actual complete `tools/ci.py` seven-suite run passed on portable Chromium 156:
architecture/content; 119 JS + 55 Python unit; 35 browser; 40 authoring; 7 bot;
release. Raw evidence .cache/reports/ci.json. Local static artifact/ZIP at
dist/foundation-demo/8fa1af3191896c7cbca6. Public CLI uses actual current-fingerprint
gate receipts; assembly removes authoring/debug data, audits bundle/assets/licenses,
revalidates the derived pack and verifies staged static-host keyboard play before
updating latest.json. Portable setup command actually passed with no global install.

Firefox Nightly 161.0a1 styled Canvas/IndexedDB/audio/disposal smoke actually passed.
Static export keyboard/save/load/150% text/DPR resize + six scene/runtime replacements
passed in both reference and 4x CPU simulation. Reference ready 659.5ms, startup
390083 bytes, RAF p95 16.7ms, normalized heap growth 120496 bytes. 4x CPU profile
ready 1434.5ms, RAF p95 150.1ms: proposed smoothness target NOT met; physical lower-
spec performance and stable/ESR Firefox remain unverified. Do not call that target
passed. Screenshots/reports in .cache/reports/release and .cache/test/screenshots.

T13 source/tooling is ready for an intermediate commit so a fresh git source export
can test contained bootstrap/restore/build/play without legacy bytes. That recovery
test and T13 completion bookkeeping remain; T14 then uses the user's First3Days.md
direction above. No hosted Actions run/push/merge/publication/12-week expansion.


## T13 recovery interruption and offline fix

Intermediate commit 5e032a2 contains the verified build/tooling. A fresh git archive
at .cache/fresh-checkout-5e032a2 provisioned its own portable tools and empty private
venv, with masters/renditions absent as expected. Remote Pillow wheel download was
rejected by proxy MediaTypeBlocked (0.log); pip still preferred the remote duplicate
after --find-links cache was supplied (resumed-0.log). No external install occurred.

The project pip cache contained the exact Pillow wheel; official PyPI metadata
verified SHA-256 a2b55dd6b2a4c4b7d87ffa56bdb33fdc5fdb9a462173861a7bc097f17d91cb09.
It is now named in .cache/toolchain. Added explicit tools/setup.py --offline mode
(Python wheel index disabled); actual CLI RED unrecognized option → GREEN cache-
only execution. Full current tools/ci.py re-verification is running (session 17062).
After that, commit the offline fix, update the fresh Git source bytes from that
commit and run --portable --offline, restore/build and all gates in that separate
checkout. Retain the first failed logs. Fresh recovery is NOT passed yet.

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
- Platform details: docs/engineering/BROWSER-PLATFORM.md. The last recorded read-only dev host
  used port 8080; current liveness was not checked at this handoff.

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
