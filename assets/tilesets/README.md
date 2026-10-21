# Imported regular-grid tilesets

The World Editor imports static PNGs into `assets/tilesets/<sha256>.png`.
The hash covers original uploaded bytes. `content/world/tileset.json` retains
image dimensions, source name, grid layout and stable tile identities/properties.
The original pixel atlas remains in `assets/pixel/`.

PNG files follow the repository's existing binary ignore policy. Retain the
original PNGs in the asset pack handed over with the project; a Git checkout
alone does not restore imported artwork. Copy each image to the catalog's
`imagePath`, verify its SHA-256, run `python tools/build_world_scenes.py --build`
and reload. Missing or mismatched images produce an explicit error.

With an ordinary static server, imports are preview-only until the author
exports the catalog and downloads/copies the PNGs to these paths. Blob/data URLs
are never persisted as runtime asset paths. Browser drafts do not retain unsaved
image bytes across reload.

Import accepts 16/24/32/48-pixel square source tiles, integer margin/spacing
0–32, PNG size up to 8 MiB and dimensions up to 4096×4096. Grid dimensions must
divide exactly; catalog capacity is 8192 tile records. World grid remains 16 px.
Animated PNG and MZ A1–A4 autotile interpretation are outside this importer.

See [authoring workflow](../../docs/guides/DATA-AUTHORING.md).
