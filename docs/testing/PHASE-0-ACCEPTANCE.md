# Phase 0 acceptance record

Status: all seven current-source local gates passed on 2026-10-24. Current T14
fresh-source recovery and whole-branch review remain pending. No twelve-week or
finished-art acceptance is implied. Branch: `feat/phase-0-skeleton-tools`.

The final local run passed architecture/content, 126 JS + 57 Python unit tests,
38 browser, 42 authoring, 8 bot and release. Fingerprint:
`b10946e7504aff81912bfe1ccf9c4900be002a5f14c547b5b0fda1612f5efe6f`.
The static directory and ZIP are under `dist/foundation-demo/b10946e7504aff81912b`.
Both complete exported routes, Firefox smoke and both real-time profiles passed
functional checks. Performance targets remain separately visible below.

## What the foundation exercises

| Contract | Concrete evidence |
| --- | --- |
| Data-driven story, flags and strict references | Shared schema/semantic validators; unknown opcode/type/ref tests; First3Days source mapping in [the chapter guide](../guides/FIRST-THREE-DAYS.md) |
| Authoring scene/NPC/dialogue/quest/resources/hearings | Native workspace inspectors and actual source round trips; First3 producer → authenticated eight-document writer → reopened JSON |
| Recovery and rejected edits | Real IndexedDB draft reopen; grouped undo/redo; stale/conflicting source writes and invalid flag/ref preserve last good bytes |
| Complete authored chapter | Native accept/skip canteen journeys, both completing Main; delegated General and concrete standard card; Side high card only when earned |
| Automatic publication and hearing mechanics | Managed isolated Friday/week-3 fixtures earn materials and publish before Defense/Attack; no calendar compression into day 3 |
| Keyboard UI/accessibility | Native world, menus, backlog, auto/skip, remap, locale expansion, text size/speed, reduced motion, resize and focus regressions |
| Saves and compatibility | Native slots/import/export/backup; quota/conflict/corruption guards; tween/scene/hearing continuation; genuine pre-T14 slot migrated without duplicate receipts |
| Resources and lifecycle | Reproducible atlas/audio/manifest pipeline, optional fallback vs required failure, stale completion rejection, repeated scene/menu owner disposal |
| Development diagnostics | Validated reload/restart, source diagnostics, typed debug/trace/replay and local crash exports; debug modules unreachable from player export |
| Whole-pack traversal | 20/20 nodes, 6/6 choices, 6/6 assets, 14/14 fixtures; no unexplored branch at the recorded T14 run |
| Static delivery | Deterministic fingerprinted export, license/provenance audits, read-only manifest host, native two-route artifact play; raw-entry real-RAF evidence separate |
| Recovery from source | T13 fresh git archive restore/build/all gates passed; current T14 fresh-source verification remains pending |

## Verification artifacts

The complete command is `.venv/Scripts/python.exe -B -X utf8 tools/ci.py`.
Its UTF-8 raw report is `.cache/reports/ci.json`; individual immutable-input gate
reports/receipts are under `.cache/reports/gates/`. Bot reports are under
`.cache/reports/bot/`; native screenshots under `.cache/test/screenshots/`.
Local raw reports and exported artifacts are ignored, not silently checked in.
The GitHub workflow retains them when it actually runs.

Focused T14 evidence includes `t14-native-old-save.json`,
`t14-authoring-pipeline.json`, `t14-story-red.json` / `t14-story-green.json` and
`t14-staged-routes.json` under `.cache/test/`. The old slot is a tracked fixture
with the genuine source commit recorded, not a new-runtime snapshot labelled old.
Packaging-only focused tests use explicitly synthetic gate inputs; only the public
full gate/release path provides release proof.

## Limits that remain visible

- Geometry, colors, tone and portraits are development fixtures with provenance;
  production hand-drawn/anime art and final UI approval remain future work.
- Firefox evidence is the pinned portable Nightly build, not stable/ESR certification.
- The constrained browser profile is a 4x CPU simulation on the recorded host.
  It missed the proposed smoothness target in T13. Physical lower-spec hardware
  testing remains unverified; a functional journey is not a 60-FPS claim.
- Hosted Actions is configured but has not yet been observed for the final revision.
  Local checks do not prove a hosted run. No public game publication is authorized.
- This milestone does not fill all twelve weeks, finalize provisional balance,
  add gamepad/gallery/Steam/native installers, or guarantee filesystem-wide
  power-loss atomicity for source writing.

Protected Bible/GDD and archive bytes remain unchanged. The user's First3Days
source is copied exactly, with Git attributes preserving its raw bytes.
