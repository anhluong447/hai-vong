# Anime sprite assets

Generated with the built-in `image_gen` tool, with transparency enabled.
Original PNGs are kept intact. `SpriteFactory` reads their alpha bounds, aligns
the feet, and assembles the runtime animation grid on a canvas at startup.

Each PNG has four columns (front, back, left, right) and two rows
(standing, walking). The runtime uses two drawn poses per direction, repeated
over eight timed frames. Source resolution: 1536 × 1024.

## Prompt set / art direction

Shared: production transparent anime RPG character atlas for a school visual
novel; smooth organic silhouettes, delicate outlines, expressive almond eyes,
individual hair strands, detailed cloth folds, cel shading and a slight overhead
view. Exactly four equal columns and two equal rows; consistent outfit and scale;
complete hair-to-shoes figures centered in each cell with transparent margins.
No labels, background, scenery, grid lines, pixel art, voxels or block-shaped limbs.

- `khue.png`: Diệp Khuê, lean male student, tousled black hair, thoughtful expression,
  white short-sleeved shirt with a loose collar, navy trousers, brown crossbody satchel.
- `long.png`: Đoàn Bảo Long, tall broad-shouldered male student, short spiky brown
  hair, cheerful smile, white shirt, loose orange-brown tie, navy trousers, steamed bao bun.
- `van.png`: Lục Thanh Vân, slender female student, high brown ponytail with jade
  clip, composed expression, white blouse, red bow, navy pleated skirt, loafers,
  worn leather wristwatch; no glasses.
- `nhi.png`: Hạ Tuyết Nhi, wholesome bookworm with chestnut bob, brown eyes and
  gold hairclip, modest ivory cardigan, buttoned white blouse, brown ribbon,
  navy knee-length pleated skirt, white socks, loafers, hardcover book.

The secondary cast uses curved canvas illustration with matching proportions;
painted PNG atlases currently exist for the four characters listed above.
