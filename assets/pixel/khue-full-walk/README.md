# Khuê full walk sources

The approved left walk lives in `../walk-cycle-probe/`. This directory supplies the other 24 walk frames for `../pilot-v4/khue.png`.

- `<direction>-master.png`: approved idle identity/reference, enlarged on a fixed grid.
- `<direction>-guide-N.png`, `<direction>-sequence.png`: technical pose diagrams with thick limbs and counter-swinging hands. Generate with `tools/prepare_khue_full_walk.ps1`.
- `<direction>-N-source.png`: selected imagegen output, untouched copy of its generated canvas.
- `<direction>-N-native.png`: mechanical 32×48 import, including approved master upper 24px.
- `selected-generations.json`: original paths and prompt selection for each selected source.
- `metrics.json`: occupied pixels, bounds and lower-body envelope after import. These measurements detect clipping/empty art, not animation quality.

The run used 29 built-in imagegen calls: 24 new poses, three upward guide corrections and two targeted downward corrections. Initial down0/down2/up2 and up1/up3 attempts are kept as `*-attempt1-source.png`. The original upward sequence is kept as `up-sequence-attempt1.png`.

Prompt iterations: `prompts.json`, `prompts-revised.json`, `prompts-landmarks.json`, `prompts-up-corrected.json`. Down0 was further edited to counter-swing the left-screen hand lower than the right; down2 was edited to make the right-screen leg support and the left-screen knee pass close to center. These edits preserve limb thickness and body registration. The approved head is locked during import because the generator still varies hair and face pixels between frames.

Important distinction: side-view walking contracts/expands mainly along screen X. Front/back walking changes projected leg length, overlap and screen Y. Upward guides account for a planted foot moving down in local coordinates while the root moves up. Naming alternating legs alone does not establish these movements.

Limitations: the model does not follow every guide coordinate exactly. Some arm arcs, shirt creases and trouser shading still vary. Front/back motion needs visual review in the loop; eight different frames and passing automated bounds checks do not prove a polished walk cycle. Preview at `/tools/khue-animation-lab.html` with slow motion/onion skin.
