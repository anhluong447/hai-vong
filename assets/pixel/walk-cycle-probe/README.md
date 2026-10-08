# Khuê contraction/expansion walk test

New aligned technical guides: [left/right/up/down storyboards](storyboards/README.md), displayed together at the top of `/tools/walk-cycle-probe.html`. They share phases and controls; the character experiment below remains left-facing.

2026-10-06. Experimental single left-facing eight-frame cycle, generated with the built-in imagegen tool. Nine calls: one per frame, plus a targeted correction to frame 5. Exact original prompts: `prompts.json`; correction: `frame-5-retry-prompt.txt`.

Review `/tools/walk-cycle-probe.html?head`. Pause, step frames, choose slower playback, enable onion skin, and compare the existing sheet at the same phase. `?head&runtime` starts at the current game's nominal 88.9px/s and 48px/cycle. Default trial is 40px/s and 32px/cycle, approximately 0.8s per loop. These are test settings, not changes to gameplay.

## What changed in the experiment

The guide controls the visible progression: wide → closing → narrow passing → opening, repeated with the other leg. Arms open opposite the legs and approach the torso during passing. Near limbs use lighter navy; far limbs use darker navy, even when the far leg is forward. Foreground limbs are drawn over background limbs.

`tools/prepare_walk_cycle_probe.ps1` produces technical diagrams and their landmarks. The diagrams are not substitute character artwork. Every imagegen call references the same approved master, the current diagram and the full motion storyboard. Full outputs are retained as `frame-N-source.png`.

`tools/import_walk_cycle_probe.ps1` samples the full 2:3 canvas to 32×48, thresholds alpha at 160 and indexes to the approved Khuê palette. It does not draw or repair limbs, synthesize intermediate frames, mirror poses or recenter/resize individual frames. Output strip: `khue-left-walk-native.png`, 256×48.

## Review findings

| Zero-based frame | Intended phase | Lower-region width, native pixels |
| --- | --- | --- |
| 0 | Wide A | 19 |
| 1 | Closing A | 12 |
| 2 | Passing A | 8 |
| 3 | Opening A | 15 |
| 4 | Wide B | 20 |
| 5 | Closing B, corrected | 16 |
| 6 | Passing B | 10 |
| 7 | Opening B | 16 |

Width is alpha bounds at y≥37, a lower-leg spread indicator, not automatic shoe separation or proof of anatomy. The first attempt at frame 5 was already 10px wide, giving 20→10→10. The targeted correction improves that to 20→16→10; its first source, first metrics and preview are retained separately.

The cycle now contains visibly wider and narrower leg silhouettes and changing arm poses instead of eight similar spread stances. This supports the user's corrected motion criterion. The change at 7→0 is smaller in width (16→19), but width alone does not certify smooth timing or planted-foot locking.

Remaining limitations: arms, torso shape, garment highlights and limb shading still vary between generated frames. Raw head-region differences against the master are 21, 15, 7, 94, 30, 97, 150 and 21 pixels; these include positional drift, not just color changes. The page's optional head lock deterministically renders the approved master region y<24 and generated region y≥24. It is explicitly a preview composite, not a claim that imagegen preserved these pixels. Turn it off to inspect raw imported output. It does not fix torso drift or anatomy.

## Validation and acceptance

Browser loaded all eight character frames, eight guides and the comparison sheet, and playback visited all eight phases. Preview screenshot: `tools/walk-cycle-probe-preview.png`. A separate nominal-game-cadence preview is saved as `tools/walk-cycle-probe-runtime-preview.png`.

This is a usable motion review prototype, not a production-approved sheet. Final acceptance still needs continuous arm/hip trajectories, consistent garment shading, stance-foot behavior against moving ground, and all directions at the same semantic phase.

Following user approval, the head-locked left walk was packed into `../pilot-v3/khue.png` and selected in `atlas.json` for an in-game trial. Other directions and clips retain their original pixels; movement settings are unchanged. Browser suite: 56/56 passed. See [integration details](../pilot-v3/README.md).
