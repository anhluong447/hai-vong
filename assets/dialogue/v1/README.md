# Hồi Âm: illustrated dialogue sprites v1

Historical version. V2 now uses `characters-anime-source.png` as the design pivot and gives the cast distinct poses, camera angles, faces and stronger expressions. See [active v2](../v2/README.md). V1 remains for comparison.

2026-10-08. Original anime cutouts generated with the built-in imagegen tool for this project. All game-referenced images live in this directory; originals are retained in the generated-image directory. [Prompts and reference paths](prompts.json) record all 21 calls and original source paths. No CLI/API generation or manual body/face compositing was used.

Six club members (Khuê, Vân, Long, Nhi, Ngọc, Ân) have neutral, happy and serious variants. The three current sources (school guard, teacher, harbor worker) each have a separate neutral. Each PNG is 1024×1536 with actual alpha. RGB colors under zero-alpha pixels may look like a background in raw previews; browser compositing uses the alpha channel. Very low alpha noise up to 2/255 at a corner is allowed in validation.

Identity and clothing references come from the current map sprites. Khuê establishes the new linework/shading style; Vân and the other masters use those references. Expressions are edits of each character's own neutral, preserving registration, pose and clothing. The painted masters are prototype designs rather than a final cast art bible. Some faces remain similar and the serious expression is deliberately restrained; facial differentiation and stronger emotions can be iterated later.

[Expression comparison](../../../tools/dialogue-expression-review.png) uses identical fixed crops of the original images for inspection only. It does not modify the game assets. `tools/build_dialogue_review.ps1` rebuilds that comparison. [Body audit](body-audit.json) samples opaque silhouettes below y650: 12 expression variants overlap their own neutral body silhouette by 99.1–99.8%. This verifies registration and silhouette, not identical shading or anatomical correctness.

The registry is [manifest.json](../manifest.json). Source NPCs use object identity rather than their shared pixel `source` skin. To extend the cast, create a new master, derive variants from it and register the image paths. Missing expressions fall back to the same character's neutral; missing images use a name emblem.

Preview at `/tools/dialogue-sprite-lab.html` with expression controls, light/dark backgrounds and a mobile frame. Play at `/pixel.html`. The archive provides layout reference only and is preserved.

Validation: **61/61 browser checks passed**, covering all assets, alpha, body registration, latest-speaker load race, fallback, lab controls/mobile layout, and the existing four-map gameplay route. Actual dialogue inspected in the newsroom and with the school guard; mobile inspected at 390×844.

[Vân in game](../../../tools/dialogue-van-map-preview.png), [mobile](../../../tools/dialogue-van-mobile-preview.png), [school guard](../../../tools/dialogue-source-map-preview.png), [Khuê in lab](../../../tools/dialogue-khue-lab-preview.png).
