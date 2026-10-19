# Dossier artwork — 2026-10-15

Six exported images were generated with the **built-in `image_gen.imagegen` tool**,
using the exact requests in [prompts.json](prompts.json). The reference for scene,
desk and waves was [01-ho-so.png](../../../docs/ui-concepts/coastal-editorial-menu-prototypes-v2/01-ho-so.png).
Photo illustrations used text prompts without a reference. These local PNGs are
the retained generation masters; no scripted raster editing was used.

| Workspace file | Export size | Purpose |
|---|---|---|
| `school-window.png` | 1672 × 941 RGB | Sunny school courtyard through a window, dossier background |
| `desk-cluster.png` | 1536 × 1024 RGBA | Camera, papers, pencils and white flowers, isolated alpha |
| `canteen-photo.png` | 1086 × 1448 RGB | Canteen quest illustration |
| `field-photo.png` | 1086 × 1448 RGB | Locked field quest illustration |
| `side-wave.png` | 1024 × 1536 RGBA | Painted teal/cream sidebar divider |
| `harbor-wave.png` | 1672 × 941 RGBA | Transparent footer with an engraved harbor inside waves |
| `editorial-icons.svg` | Native SVG sprite | Six filled nav icons, energy and header decorations |
| `logo-stamp-placeholder.svg` | 65 × 70 SVG | Explicit temporary stamp pending approved logo art |

The SVG sprite extends the project's native SVG icon system. The logo is **not
final artwork**: the live localized wordmark and wave motif occupy a 270 × 108
layout, with a 65 × 70 stamp slot. Replace with approved original lettering/stamp
art and preserve live accessible/localized naming.

Existing assets reused: `assets/ui/coastal-menu-v2/foliage.png` for the moving
upper-right leaves, `assets/ui/coastal/menu-case-paper.png` for paper grain and
`menu-nav-dry-brush.png` for brush surfaces. Paper layers, polaroid border,
paperclip, torn-edge masks and checkboxes remain native CSS/SVG. Tape lengths
adapt to content; they are not three separately illustrated sprites. Typography
uses the existing locally licensed fonts. Header symbols are native approximations
of the concept, not extracted original illustrations.

Run `python tools/check_dossier_assets.py` to verify hashes, export dimensions,
transparent alpha and complete prompt coverage. For a deliberate, visually
reviewed art replacement, record it with `--write-inventory`.
[inventory.json](inventory.json) retains byte sizes and SHA-256 for six PNGs and
both SVGs. New PNGs and review captures follow the existing Git ignore policy;
copy this whole folder when transferring a working build to another machine.

See the [implementation and visual review](../../../docs/ui-reviews/dossier-polish/README.md)
for screenshots and remaining differences from the reference.
