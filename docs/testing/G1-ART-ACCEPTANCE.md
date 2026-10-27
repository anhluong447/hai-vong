# G1 art acceptance record

Updated: 2026-10-27. Status: director requested revision; not accepted.
See [G1 R1 re-plan](../superpowers/plans/2026-10-27-g1-review-b-cohesion.md).
Evidence below certifies the previous implementation only; no R1 runtime check ran.
Plan commit: `3fafb2f`. Active branch: `feat/first3-art-direction`.

## Current progress

- T01: clean composition, three density drawings and two comparison boards generated. User explicitly selected A2 (192 px) and B3 (height 152). See ../art-direction/review-a/README.md; focused browser captures pass 3/3. Production layers remain T02 work.
- T02: assets and recoverable bundle prepared; 3 real layers, 16 sprite frames, 6 portraits, 2 atlases. Native frame canvas 160x208 / visible192 / pivot80,200; selected display152. Real-renderer composition/walk inspection available under ../art-direction/production-preview/. Sources remain candidates for playable Review B. Fresh private-venv recovery restores27 sources and rebuilds33 identical renditions; deterministic ZIP/build and audit pass.
- T03: content contracts and pure dialogue projection implemented. Focused tests: RED 14 failures / 8 existing rejections, then GREEN 22/22. Architecture and content suites pass; full unit suite passes 148 JS + 57 Python tests. No production art/content version change yet.
- T04: scoped pixel/background sampling, day visibility and facing implemented and tested; real G1 native captures now available. Final visual choice remains Review B.
- T05: managed portrait UI and transactional restore integrated. T06: real content0.0.3 and genuine old-save compatibility verified. T07: authoring controls/preview/source-writer round-trip verified. T08: native/static checks and independent review fixes verified; awaiting user playable Review B. See final evidence below.

Built-in image generation has a documented default output location outside the
project. The user explicitly granted the narrow exception for tool-generated images in
the latest reply. Copy project-bound outputs into the repository. T01 generation
can proceed; Review A still gates mass frame production.

## Visual decisions

Broad art direction is confirmed by the user: high-resolution layered Nostalgic
Coastal Anime scenery with Central Vietnam coastal character; detailed pixel
sprites with restrained proportions. Source dimensions, density and display
scale remain proposals in [the visual spec](../art-direction/G1-VISUAL-SPEC.md).

- [x] Review A: concrete boards shown; user selected A2 density 192 and B3 display height 152. Environment/palette still subject to playable Review B.
- [ ] Review B: integrated playable Room 3 approved by the user.

## Required evidence before closing G1

- [x] Clean source layers and character/portrait candidates independently recoverable (T02); visual Review B remains pending.
- [ ] Pixel sprite/background sampling verified in runtime and editor.
- [ ] Speaker/portrait/narration transitions, stale loads and lifecycle verified.
- [ ] Native keyboard Room 3 journey, save/reveal resume and existing routes.
- [ ] Explicit old-save migration with genuine pre-change provenance.
- [ ] Authoring round-trip and asset bundle restore/build/audit.
- [ ] Current-source local gates and static-artifact journey.
- [ ] Visual review decisions, measured hardware/browser limits and deferred work recorded.

No Phase-0 historical result is relabelled as current G1 evidence.

## Current T03 evidence

Raw focused reports: `.superpowers/sdd/2026-10-26-g1-room3-art-direction/t03-{red,green}.json`.
Full unit output: `t03-unit-output.json` in that same project-local workspace.
These raw files are local/ignored; the results above describe actual runs.
The first sandboxed browser attempt failed during Windows temporary-profile
cleanup with WinError 5, before a usable RED report. The authorized retry kept
its disposable profile in the project and produced the RED/GREEN evidence.

T03 code commit: `8679f4d`. T04 raw reports are `t04-*.json` in the same workspace.
The initial rendering RED run had four feature failures and one existing-facing
pass; background sampling and preview-setting validation each had an additional
focused RED→GREEN. The final unit/browser/authoring reports use `t04-final-*`.
No bot/release/static artifact or visual-art acceptance is claimed for this
partial implementation checkpoint. G1 remains open.

## T02 verification checkpoint

Final unit: 150 JS + 60 Python PASS; architecture/content/audit PASS. New image-recipe
checks were RED then GREEN (including alpha/padding, invalid bounds, atlas rebuild
and source diagnostics). An initial full run found five packaging failures because
the new provenance ID was absent from the release registry; explicit registration
and the internal profile entry fixed them, without marking art production-approved.

Fresh `.cache/tmp/g1-recovery-t02` has its own private venv installed offline from
contained wheels. All 27 masters/inputs were absent before restore; all 33 output
metadata/hashes match the active manifest. Bundle SHA256 is
`9fc33cd4b7f737a43194ee65d271ba0457bdfe03ba57a5f106d20122553d9cdb`.
The original foundation bundle is unchanged. Raw recovery/determinism/unit reports
are `t02-*.json` in the scoped ledger; copied captures have unique artifact names.

No current full browser/authoring/bot/static or gameplay visual acceptance is
claimed for this asset-only checkpoint. G1 remains open.

## Final implementation evidence

T05–T08 implementation is integrated. User Review B remains open. The current
source fingerprint is `cfc80e3d34c2d84bdc4f4c2e2cfa2fb531f86acf4da4d80c6c7c2a399d8ad7d1`.

| Check | Actual result |
| --- | --- |
| Architecture / content | PASS / 1 test PASS |
| Unit | 154 JS + 61 Python PASS |
| Browser | 67/67 PASS |
| Authoring | 47/47 PASS |
| Bot | 8/8 behavior tests + complete pack traversal PASS |
| Static export | PASS, `dist/foundation-demo/cfc80e3d34c2d84bdc4f/` |
| Static existing three-day routes | 2/2 PASS |
| Additional static G1 encounter/save-load | 1/1 PASS |
| Firefox platform smoke | 1/1 PASS; no stable/ESR certification |
| Protected sources | 20 files byte-identical to `d684512` |

All six required gate receipts were checked against the current fingerprint;
`.cache/reports/g1-current-gates.json` links those receipts and the static G1 run.
This is not a claim that one uninterrupted CI invocation passed: `tools/ci.py`
runs encountered intermittent module/content fetch failures and bootstrap timeout.
The failed gates were rerun on unchanged source. A 24-load content probe and full
instrumented authoring run did not reproduce the faults (only a canceled session
request during disposal). No loader/server change was guessed into the product.
Raw failed and succeeding reports remain in the scoped G1 ledger; intermittent
local browser startup/fetch behavior remains a tooling limitation.

The final release used the valid receipts and passed its browser verification.
Reference profile: load 957ms, startup 736,365 bytes, real RAF p95 16.8ms, retained
heap growth 124,980 bytes. CPU-4x simulation: load 1,089ms, p95 **33.4ms**, exceeding
the **33.34ms** budget; retained heap growth 184,728 bytes. The frame-budget miss
remains visible even though the release harness reports success. These entry-page
samples are not Room3 live-FPS certification or measurements on a physical weak PC.
Host: Windows 11 AMD64, Intel64 Family 6 Model 186 Stepping 2; headless Chromium156.

Native G1 evidence includes New Game → authored Room3, all four unambiguous speaker
commands, narration clearing, standing sprites during dialogue, partial reveal
save/load and pause/resume, earned notice once, four day-two room round trips with
stable asset ownership, and disposal to zero. Window/large-text captures and the
accounted image-memory/controlled CPU measurements are in
[Review B](../art-direction/review-b/README.md). Fullscreen appearance remains a
human check; 1920x1080 emulation is not a Fullscreen API test.

Genuine `d684512` saves (exploration and partial Van warning), hashes and capture
module are in `tests/fixtures/g1/`. Migration retains story/reveal/UI/domain data,
resets only validated old animation projections, and rejects corrupt replacements.
The original 0.0.1 migration chain and both existing routes remain covered.

One independent review found no Critical issues. Both Important findings were
fixed RED→GREEN; the final full gates above include those changes. One editor-only
minor is deferred: restarting Scene Preview resets its session day to1 while the
day control retains its previous value. See [G1-REVIEW.md](G1-REVIEW.md).

No aesthetic acceptance is inferred. The remaining maps/cast, synthetic audio,
general HUD/menu styling and dynamic lighting are outside G1. The next authorized
step is the user's playable Review B; do not start G2–G8 automatically.
