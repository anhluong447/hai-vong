# Khuê walk pose probe — 2026-10-06

Experimental outputs, not active game sprites. Built-in imagegen, four calls: contact-left, passing-right, contact-right attempt 1, targeted contact-right attempt 2. Exact prompts are in `prompts.json`.

Review at `/tools/walk-probe.html`. The page compares the immutable approved left idle master, all four generated results and the current eight-frame left walk. It deliberately does not play three key poses as if they formed a complete cycle.

Inputs: `khue-left-master.png` is a fixed 32×48 crop of pilot-v2 Khuê, row 5 column 0 (zero-based), enlarged 16× with nearest-neighbor. `*-guide.png` are technical leg diagrams, not character artwork; red identifies anatomical left/near leg, blue right/far leg. See `tools/prepare_walk_probe.ps1`.

Raw `*-source.png` outputs are transparent 1024×1536 generated images. Native versions use fixed full-canvas 32×48 sampling, alpha threshold 160, and nearest RGB color from the approved Khuê palette. No individual crop/recenter/rescale, invented frames or leg drawing. See `tools/import_walk_probe.ps1`. Native cleanup is a mechanical import, not a correction of pose geometry.

## Findings

| Result | Visual finding at native size | Changed pixels in head region |
| --- | --- | --- |
| Contact-left | Wide leg separation is readable. Anatomical leg identity still needs manual review. | 9 |
| Passing-right | One raised shoe and a tighter leg silhouette are readable; materially different from contact. | 4 |
| Contact-right attempt 1 | Contact silhouette exists, but opposite anatomical step is not sufficiently clear to approve. | 6 |
| Contact-right attempt 2 | Targeted correction changes arms/leg appearance, but still does not establish a reliable alternating gait; increases drift. | 24 |

Head comparison is y=0..23 against the approved left idle master after native import. This is a pixel preservation check, not a face-quality or anatomical score. `metrics.json` also reports semi-transparent samples in raw output sampled on the same grid: 452, 402, 451 and 443 respectively. These counts do not measure the entire high-resolution alpha channel. Binary native import removes soft alpha, but the generated source is not already a clean native sprite.

Verdict: master + per-pose guide helps produce distinct contact/passing silhouettes. It does not yet pass the opposite-leg or pixel-preservation requirements. Do not extend these frames into a production sheet without reviewing and repairing limbs and retaining approved head/body layers. No gait timing or planted-foot sliding verdict is possible from these three key poses; that requires the complete cycle and moving-ground test.

Recommended next step: keep approved head/torso pixels in editable layers, resolve both contact poses with explicit near/far leg landmarks, fill the remaining phases, then evaluate on the map. A guide-following generated pose is a draft to review, not an authoritative motion frame.

Browser preview loaded all generated images, metrics, fonts and old frames successfully. Screenshot: `tools/walk-probe-preview.png`.

Original generated files were copied from `C:/Users/anhlh52/.codex/generated_images/01a10a03-549c-7db3-b022-5e15fe7a905b/`:

- Contact-left: `exec-4a9edd97-aedc-45ac-a3cc-f9e1f5c1564a.png`
- Passing-right: `exec-3a3ff5e6-11b1-49cb-9fcd-0cc0a9295950.png`
- Contact-right attempt 1: `exec-47c1da81-42d8-4859-bf6b-2d82cf93cf32.png`
- Contact-right attempt 2: `exec-0f1c77f7-7cb4-43cf-9197-2d79dd7e9514.png`
