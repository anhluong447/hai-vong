# Khuê: idle/walk proportion audit

2026-10-08. Historical comparison of `pilot-v5/khue.png`, before the up/down correction below. Source of truth: idle column 0 for each direction, as defined by the atlas. Walk must animate this body, rather than introduce a different character model.

Review tool: `/tools/khue-proportion-audit.html`. It displays idle, the selected walk frame and a silhouette overlay at identical registration and magnification. It does not crop or rescale either image. All eight frames can be stepped and compared. Saved measurements: `../tools/khue-proportion-audit.json`.

| Direction | Idle silhouette height | Walk silhouette height, all 8 frames | Idle upper-band width | Walk upper-band width |
| --- | --- | --- | --- | --- |
| Down | 39px | 37–38px | 18px | 17px |
| Left | 39px | 38–40px | 18px | 18px |
| Right | 37px | 39px | 19px | 18px |
| Up | 39px | 38–39px | 17px | 14–16px |

Upper band means opaque pixels at y<24. It includes the head/neck region and is not an automatic anatomical head measurement. Total height may legitimately vary with a pose; the numbers alone do not prove a wrong bone length. Arm and leg spread naturally change silhouette width. Diagnosis also requires the actual idle/walk images and overlay.

Visual findings:

- Up: head silhouette is visibly narrower than idle; the shirt, waist and satchel sit differently despite similar total height. In frame 0 the upper band contracts from 17px to 14px. Hair clusters are redrawn.
- Right: idle starts at y8 while all walk frames start at y7; walk also extends 2px more in total height. The chin/neck and shirt proportions differ, so shifting the whole figure cannot align both head and body.
- Down: the head bounding box is close, but facial/hair clusters and the shirt/waist transition differ. Matching top height does not retain the original body model.
- Left: the upper band is pixel-identical in all walk frames (0 changed opaque pixels), because the previous trial copied its upper region from the idle master. This verifies that region only; it does not establish consistent lower-body proportions.

The right/up/down upper bands change 180–186, 146–167 and 161–179 pixels respectively versus idle. These differences include colors/texture as well as position, so they must not be interpreted as a displacement count.

Evidence: [right comparison](../tools/khue-proportions-right.png), [down comparison](../tools/khue-proportions-down.png), [up comparison](../tools/khue-proportions-up.png).

Pipeline cause: the generator treated the idle image as an identity/style reference while rendering a new body over a generic mannequin. Import then applied a shared 0.95 scale and aligned each source row's top to y7. This corrects sheet padding, not internal anatomy. It also disregards direction-specific idle bounds, such as the right idle's y8 start and 37px height. Passing canvas/palette tests did not validate these proportions.

Correction requirements for the next art revision:

1. Keep the existing idle frames unchanged as the source of truth, including per-direction head shape, neck, torso proportions, limb thickness, shoe/hand scale and satchel attachment.
2. Derive each direction's pose guide from that idle model. Fit the skeleton to the approved body; do not fit a newly drawn body to the generic guide.
3. Preserve the original 32×48 registration and pivot. Any body bob/lean must be a deliberate shared pose displacement, not inferred from each frame's bounds. Avoid blanket top alignment or arbitrary scale corrections as a substitute for matching anatomy.
4. Compare contact and both passing poses directly with idle at native size before expanding the cycle. Inspect the whole body, not only a locked head. Head, shirt and hip landmarks should remain consistent while arms/legs articulate.

## Up/down correction: pilot-v6

The active bank now uses regenerated up/down walk only. Each direction uses a complete sheet of unchanged idle copies as the editing input, with an idle-fitted pose guide. No character rescale or head splice is applied. Idle/talk and sideways walk remain pixel-identical to v5.

All eight up frames retain a 17×17px upper band, and all eight down frames retain 18×17px, at y7 with the same horizontal center as idle. Contact overlays also align the neck, shirt and waist more closely. These measurements constrain proportions without proving identical internal pixel clusters. The historical v5 JSON and screenshots above are retained; the live review tool reads the active bank.

[Up comparison](../tools/khue-v6-up-idle-comparison.png), [down comparison](../tools/khue-v6-down-idle-comparison.png), [import and sources](../assets/pixel/pilot-v6/README.md).
