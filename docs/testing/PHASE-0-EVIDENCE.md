# Phase 0 evidence

T01–T12 are committed; T13 is in progress. No whole-Phase-0 completion claim yet.
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
Fresh-source restore/build verification is the next step, not yet claimed.

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
