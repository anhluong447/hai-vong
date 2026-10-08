# Aligned walk storyboards

Four technical guides for left, right, up and down, eight poses each. They describe motion rather than finished character art. The original left storyboard remains untouched in the parent directory.

`tools/prepare_walk_storyboards.ps1` starts from the same eight left-view landmarks in `../guide-landmarks.json`, then projects the longitudinal step into front/back depth. It does not ask an image model to invent four independent cycles.

All views use the same logical 32×48 canvas, head bounds (10,7,12,13), shoulder level y25, hip level y32, ground/pivot y46 and 3px limb thickness. Individual guides are enlarged 16× to 512×768; storyboards are 1024×768, four columns by two rows. There is no per-frame crop or recentering.

Phase order: 0 contact A, 1 closing A, 2 passing A, 3 opening A, 4 contact B, 5 closing B, 6 passing B, 7 opening B. Phase 0 advances the anatomical left leg in all four views. Facing left, this projects toward screen left; facing right, toward screen right; facing down, its shoe projects lower; facing up, its shoe projects higher. Opposite arms swing with it. This is a stylized projection of the existing pose sequence, not a physically solved 3D rig.

Blue always marks anatomical LEFT arm/leg; dark always marks anatomical RIGHT. These are identity colors so phases can be compared. Do not copy them as a rule that one trouser leg is permanently darker. The output character's shading should describe depth and occlusion instead. Front/back anatomy swaps screen sides when turning around. In the right view, the anatomical right limbs are nearer the camera and drawn in front; in the left view, the anatomical left limbs are nearer. This reverses occlusion without renaming the limbs or shifting the contact phase.

Download `left-sequence.png`, `right-sequence.png`, `up-sequence.png`, `down-sequence.png`; individual pose files use `<direction>-guide-<0..7>.png`. `landmarks.json` records the projected joints and registration.

In `/tools/walk-cycle-probe.html`, all four mannequin loops share the existing frame, pause/step, speed and onion controls. The character trial remains the approved left experiment. These guides do not replace the game's sprite sheet.

Validation: **57/57 browser tests passed**, including contact-leg projection, counter-swing, nonempty and distinct rendered poses, and shared pause/step/loop controls for all four views. Inspected actual Chrome page captures at [contact A (0)](../../../../tools/walk-storyboards-frame-0.png), [passing A (2)](../../../../tools/walk-storyboards-frame-2.png), and [contact B (4)](../../../../tools/walk-storyboards-frame-4.png). The inspection also caught uneven caption heights; the storyboard rows now align. [Current page preview](../../../../tools/walk-storyboards-preview.png).

For an imagegen reference: use an approved character master for identity, one individual guide for pose, and the matching sequence for motion context. State the direction and anatomical support leg explicitly; request a single sprite on the same full canvas. Review a small set of poses together before generating a full sheet. Alignment of guides alone cannot guarantee that generated character bodies will stay aligned.
