# G1 art acceptance record

Updated: 2026-10-26. Status: implementation started; not accepted.
Plan commit: `3fafb2f`. Active branch: `feat/first3-art-direction`.

## Current progress

- T01: reference/spec and review questions prepared; clean composition and density/scale boards not generated yet. Review A pending.
- T02: asset production has not started.
- T03: content contracts and pure dialogue projection implemented. Focused tests: RED 14 failures / 8 existing rejections, then GREEN 22/22. Architecture and content suites pass; full unit suite passes 148 JS + 57 Python tests. No production art/content version change yet.
- T04: renderer code implemented; focused renderer/lifecycle/display checks pass 9/9, full browser 53/53 and authoring 42/42. A follow-up preview-sampling validator test was RED then GREEN. Final full unit passes 149 JS + 57 Python; current architecture/content pass. Actual G1-art visual checks remain pending Review A/assets.
- T05–T08: not complete.

Built-in image generation has a documented default output location outside the
project. The user was asked whether to allow that narrow exception before using
it; no image-generation call has been made while the question is pending.

## Visual decisions

Broad art direction is confirmed by the user: high-resolution layered Nostalgic
Coastal Anime scenery with Central Vietnam coastal character; detailed pixel
sprites with restrained proportions. Source dimensions, density and display
scale remain proposals in [the visual spec](../art-direction/G1-VISUAL-SPEC.md).

- [ ] Review A: composition and sprite density/scale selected on concrete boards.
- [ ] Review B: integrated playable Room 3 approved by the user.

## Required evidence before closing G1

- [ ] Clean source layers and characters/portraits, independently recoverable.
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
