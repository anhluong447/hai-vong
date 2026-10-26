# G1 art acceptance record

Updated: 2026-10-26. Status: implementation started; not accepted.
Plan commit: `3fafb2f`. Active branch: `feat/first3-art-direction`.

## Current progress

- T01: clean composition, three density drawings and two comparison boards generated. User explicitly selected A2 (192 px) and B3 (height 152). See ../art-direction/review-a/README.md; focused browser captures pass 3/3. Production layers remain T02 work.
- T02: assets and recoverable bundle prepared; 3 real layers, 16 sprite frames, 6 portraits, 2 atlases. Native frame canvas 160x208 / visible192 / pivot80,200; selected display152. Real-renderer composition/walk inspection available under ../art-direction/production-preview/. Sources remain candidates for playable Review B. Fresh private-venv recovery restores27 sources and rebuilds33 identical renditions; deterministic ZIP/build and audit pass.
- T03: content contracts and pure dialogue projection implemented. Focused tests: RED 14 failures / 8 existing rejections, then GREEN 22/22. Architecture and content suites pass; full unit suite passes 148 JS + 57 Python tests. No production art/content version change yet.
- T04: renderer code implemented; focused renderer/lifecycle/display checks pass 9/9, full browser 53/53 and authoring 42/42. A follow-up preview-sampling validator test was RED then GREEN. Final full unit passes 149 JS + 57 Python; current architecture/content pass. Actual G1-art visual checks remain pending Review A/assets.
- T05: portraits/UI wired; full browser64/64 and authoring42/42 PASS. T06: content0.0.3 integrated; real old-save focused6/6, original migration chain/two routes3/3, full browser66/66 PASS. Unit153 JS +60 Python pass, bound receipt invalidated by source edit; final CI required. T07/T08 remain.

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
