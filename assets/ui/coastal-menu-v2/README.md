# Coastal menu v2 — scenery assets

Three local native 1672×941 images generated with the **built-in image_gen** tool:

- `scene.png`: clean newsroom window/harbor scenery without characters or UI.
- `foliage.png`: isolated leaves with actual transparent alpha, animated around the branch origin.
- `map.png`: clean scenery derived from `docs/hai-vong.png`; labels and pins are live UI.

[prompts.json](prompts.json) and [map-prompt.json](map-prompt.json) preserve the exact
generation requests. [inventory.json](inventory.json) records size, dimensions and
SHA-256. The exported PNGs themselves are the retained generation masters here;
they have not been cropped or painted by a postprocessing script.

Validate with `python tools/check_menu_v2_assets.py`. Update the inventory only for
an intentional, visually inspected asset replacement using `--write-inventory`.
PNGs are local and ignored by the repository's existing binary-art policy; transfer
the whole asset folder when sharing a working copy with another machine.

The runtime also reuses the existing coastal brand, brush/paper texture,
transparent foreground flowers, harbor-print SVG and licensed fonts. Wave contours,
navigation icons, text, controls and particles remain native SVG/DOM/CSS.
