# Active asset inventory

`active-packs.json` selects eight existing manifest-backed packs; those manifests
remain authoritative for image/font loading. `tools/check_asset_packs.py --build`
derives `active-packs.js` and `active-inventory.json`; `--check` verifies paths,
hashes, atlas bounds and native metrics. The inventory does not preload assets.

Pixel grid units stay 16 px. Khuê/Vân frames remain 32×48 px with pivot(16,46).
Sprite bounds, visual offsets, pick heights and tile footprints are separate;
for example the desk remains one tile tall for picking although its sprite is
48 px high. Scene-specific overrides live in the scene/prefab JSON.

Binary art follows the repository's local-only policy. Transfer the retained
asset directories from a working copy; JSON/hash metadata alone cannot restore
an exact generated bitmap. Preserve generation masters/prompts and reusable
import tools. A regenerated image requires deliberate visual review and a new
inventory; it is not a byte-identical recovery.

| Pack | Provenance and recovery |
|---|---|
| pixel | `assets/pixel/CHARACTER-ART.md`, atlas, retained sprite masters and prompts; `tools/import_anime_sprites.ps1` describes mechanical packing |
| menu | `assets/ui/coastal-menu-v2/README.md`, `prompts.json`, `map-prompt.json`; transfer the original generated PNG masters |
| menu-materials / menu-motion | `assets/ui/coastal/menu-materials.json`, `menu-motion-manifest.json`; retain their referenced sources and existing material generation tools |
| dossier | `assets/ui/dossier-polish/README.md` and inventory; native SVG symbols remain editable source |
| dialogue | `assets/dialogue/manifest.json` and `v2/README.md`, expression prompts and retained exports |
| fonts / fonts-menu | Pinned download URLs, SHA256, SIL OFL1.1 and accompanying license files are recorded per file in the generated inventory |

Artwork provenance is described by its original pack documents; this inventory
does not create or change licensing terms. No historical or active art was moved.
