# Phase 0 evidence

T01–T14 local implementation/acceptance, fresh-source recovery and the single
whole-branch review/fix pass are complete. Hosted Actions confirmation remains open. See [current acceptance](PHASE-0-ACCEPTANCE.md). The T13
numbers below are historical evidence, followed by the current T14 run.
T12's actual final gates: architecture/content pass, 119 JS + 42 Python unit,
35 browser, 40 authoring and 7 bot tests pass. See `PROJECT-STATE.md` and its
per-task `.cache/test/t12-final-*.json` references.

T13 focused packaging regressions exercise reproducible ZIP payloads, missing
gates/masters/renditions, wrong hashes, undeclared licenses, incompatible snapshot
version, debug reachability, stale evidence and extra-file artifact contamination.
Portable-tool tests exercise verified extraction, unchanged-byte reuse, path and
Windows case collisions and Firefox policy integrity. A real architecture command
supplies the gate receipt tamper regression. Static-host tests use actual HTTP.
The actual seven-suite run through `.venv/Scripts/python.exe -B -X utf8 tools/ci.py`
passed: architecture/content, 119 JS + 55 Python unit, 35 browser, 40 authoring,
7 bot tests and release. Raw report: `.cache/reports/ci.json`. Gate receipts bind
fingerprint `8fa1af3191896c7cbca611682df07b5ea` (full value in the report).
The local artifact is `dist/foundation-demo/8fa1af3191896c7cbca6/` and its ZIP.
Fresh-source restore/build verification also passed on committed source `5714e7c`:
every tracked byte was checked against `git archive`, its own portable tools and
empty private venv installed cached pinned wheels, the tracked game bundle restored
initially absent masters, renditions rebuilt and all seven suites passed again
(119 JS + 55 Python / 35 browser / 40 authoring / 7 bot / release).
Recovery summary: `.cache/reports/recovery/summary.json`; full independent gates:
`.cache/fresh-checkout-5e032a2/.cache/reports/ci.json`. No legacy bytes were consulted.

Retained failed attempts document the network proxy blocking a wheel download and
pip preferring a remote duplicate over `--find-links`; explicit `--offline` setup
used the project cache after official PyPI SHA-256 verification. The first full
portable run also exposed two containment tests assuming the base interpreter was
external; selecting `ROOT.parent` instead corrected the premise, then focused
7/7 checks on both interpreters and the full fresh suite passed.

Actual Firefox smoke ran on portable **Nightly 161.0a1**, build
`20261022214940`. It creates the real styled player, draws Canvas, saves/restores
IndexedDB, decodes audio and releases resource owners. It uses API/DOM operations;
Chromium covers the trusted native keyboard suite. Stable/ESR Firefox is unverified.

Release/performance reports live in `.cache/reports/release/`: per-profile JSON,
Firefox JSON, machine summary and screenshots under `.cache/test/screenshots/`.
Profiles are defined in `content/pipeline/performance-targets.json`. RAF intervals
use real browser clocks, not virtual game ticks. The constrained profile applies
4x CPU slowdown to the same host. This is a reproducible simulation, not measured
FPS on a physical lower-spec desktop. Load/bytes/heap/frame targets remain visible
in each report, including failures. Actual first complete run:

| Profile | Ready | Startup bytes | RAF p50 / p95 / maximum | Heap growth after 6 new-run scene replacements |
| --- | --- | --- | --- | --- |
| Reference | 659.5 ms | 390,083 | 16.7 / 16.7 / 16.8 ms | 120,496 bytes |
| 4x CPU simulation | 1434.5 ms | 390,083 | 66.6 / 150.1 / 200 ms | 132,872 bytes |

Each profile sampled 180 actual RAF intervals, saved/loaded through the keyboard UI,
replaced the scene/runtime six times, selected managed 150% text size and resized
to 960x720 at DPR 2. Screenshots: `.cache/test/screenshots/c3a4b8bc41e42ab0.png`
and `db2e5a740cbc48f2.png`. Host: Windows 11 AMD64, Intel64 Family 6 Model 186
Stepping 2; portable HeadlessChrome 156.0.8078.47. Reference timing meets the
proposed frame target; the constrained simulation does **not**. Its functional
journey passes, but it does not establish lower-spec smoothness acceptance.

No hosted CI run, public release, production art approval, 12-week game completion,
stable Firefox certification or physical low-end 60-FPS result is claimed.

## T14 current local evidence — 2026-10-24

All seven gates passed through the private venv `tools/ci.py`: architecture/content,
126 JS + 57 Python unit, 38 native browser, 42 authoring, 8 bot and release.
Fingerprint `b10946e7504aff81912bfe1ccf9c4900be002a5f14c547b5b0fda1612f5efe6f`;
raw `.cache/reports/ci.json`, versioned directory/ZIP
`dist/foundation-demo/b10946e7504aff81912b`.

The actual chapter's two complete source routes and two complete static artifact
routes passed. Artifact routes used trusted keyboard input, saved/loaded at day 2
and ending, and preserved execution receipts. Both finished Main and delegated
General on day 3; Side completed only on the investigate route. Materials queued
3/2, audience remained 0, no fake bluff card. Artifact route screenshots:
`6f8e325c24715464.png`, `92823c8da85a6651.png` under `.cache/test/screenshots/`.

Actual First3 workspace edits produced eight dirty documents, survived undo/redo
and IndexedDB draft recovery, rendered the new scene/NPC, hot-reloaded at a stable
anchor, and round-tripped through the authenticated batch source writer. Invalid
references/flags and stale writes preserved the last good revision. A real old
runtime save from `1dfce84` imported through native UI, preserved old progress and
receipts and added only explicit defaults. Corruption preserved the good slot.
The editor's single-flags-document assumption failed in the expanded project;
explicit source selection fixed it, RED 2 failures → GREEN 7 focused checks.
Two older assertions hardcoded old content versions/pack counts; corrected to
exercise a genuinely new revision and the declared six-choice/fourteen-fixture pack.

Bot reports 20/20 nodes, 6/6 choices, 6/6 assets, 14/14 fixtures, 14 terminal paths,
103 states / 92 steps and no unexplored branches. Managed entry fixtures replay
ordinary commands for prerequisite state. Player export excludes these fixtures.

Raw exported index measurements still use real RAF, separately from controlled
correctness clocks. Both sampled 180 frames and six runtime replacements:

| Profile | Ready | Startup bytes | RAF p50 / p95 / maximum | Retained heap growth |
| --- | --- | --- | --- | --- |
| Reference | 1259.2 ms | 489,863 | 16.7 / 16.7 / 16.8 ms | 115,664 bytes |
| 4x CPU simulation | 1805.7 ms | 489,863 | 50 / 133.3 / 183.4 ms | 142,272 bytes |

The constrained frame target is **false** in the raw report; functional release
success does not convert this measurement into a smoothness pass. Physical low-end,
stable/ESR Firefox, production art and hosted Actions remain unverified.

## Final review fix pass and continuous measurements

Source fix commit `c599d0fea67f27929b7f03aa764f910b95ddf39e`. All seven local gates PASS; 126 JS + 57 Python / 46 browser / 42 authoring / 8 bot; fingerprint 4cef4485da8e977089ff7b7c131936b44b2bd1fa5c3699fe23f939971e03fb2f.
Two Important review findings fixed with eight real-browser regressions RED8→GREEN8:
pending timeline scene continuation and discarded initial cue/scene signals. One
Minor negative-test diagnostic weakness is deferred; full disposition in
[PHASE-0-REVIEW.md](PHASE-0-REVIEW.md).

The first after-fix run passed six gates but constrained profiling exceeded a
six-second RPC while waiting for60frames; retained raw failure
`.cache/test/final-before-measurement-fix.json`. Continuous real-RAF collection with
short status reads fixed the harness: focused staged checks then the full seven
gates passed. No frame count/performance target was relaxed. Current measurements:

| Profile | Ready | Startup | Continuous RAF samples | RAF p95 | Retained heap growth | Frame target met |
| --- | --- | --- | --- | --- | --- | --- |
| reference | 1845.3 ms | 490116 | 180 | 16.8 ms | 125604 bytes | True |
| constrained-simulation | 4051.9 ms | 490116 | 180 | 166.6 ms | 143096 bytes | False |

Current local static artifact: `dist/foundation-demo/4cef4485da8e977089ff` and ZIP.
Fresh source verification: `.cache/reports/recovery-t14/summary.json`, commit
`ac6e818f94c860ff4f5505d6a6164ce9515635df`, 394 tracked files byte-verified, own empty
private venv/portable offline tools, initially absent masters restored only from
tracked bundle, regenerated renditions, all seven gates passed. No legacy bytes.
Raw fresh gates: `.cache/fresh-t14-ac6e818/.cache/reports/ci.json`.
Post-review narrow runtime changes have their own full current-source proof above.
Physical lowend/stableFirefox/production art remain unverified. Hosted CI status
will be recorded after the authorized feature-branch push; no public game deployment.
