# Stage 4 dialogue motion sheet

Authoritative parameters: [motion JSON](../../../content/ui/coastal-dialogue-motion.json).
Build/check with `tools/build_dialogue_motion.py`. Art and native anchors come
from the unchanged v3 pack. Values below describe authored presentation, not
gameplay delays or automatic acceptance thresholds.

| Layer/effect | Pivot / space | Timing / amplitude | Occlusion / end state |
| --- | --- | --- | --- |
| Wave ink | Native cubic contour, paper offset 599 | 8 s, vertical texture 1.3 px; contour 2.2 px, 1.4 spatial turns | Behind paper; no horizontal translation or glyph warp; exact 16 s master-loop endpoint |
| Paper/print | Native plane; retain existing art transform/opacity | Enter 650 ms ease-out cubic, lift 12 px; exit 240 ms | Harbor/shore retain rest registration and paper clip; settled original position |
| Choices | Fixed control bounds; art transform only | 70 ms stagger, entry lift 8 px; hover lift 2.2 px / response 140 ms; press 1 px; select pulse 280 ms | Copy baselines and hitboxes fixed; callback immediate; new interaction cancels obsolete visual state |
| Flowers | (46,932) | 8 s, phase 0.75 rad, rotation ±0.65°, lift ±1.2 px | Whole alpha cluster; attached to UI, overlap stays subtle; enter angle −1.5° |
| Notebook | (1568,924) | 16 s, rotation ±0.35°, lift ±0.8 px | Outer union holds edge/PNG/wash/handwriting; only art union gets shadow; enter angle +0.8° |
| Paper sheen | Native paper clip | 16 s period; active first 2.8 s, narrow 280 px wash, opacity ≤0.11 | Fade at both ends; no global bloom, off when lighting disabled |
| Reading copy / marks | Original native coordinates | Opacity reveal after 32% entry progress | No translate/filter; marks/rules/return disappear with dialogue; date/logo remain HUD |

Runtime draws at a requested 30 Hz; frame delta is capped at 48 ms to avoid jumps.
Native browser caches for wave/paper/shore grain avoid repeated SVG turbulence
rasterization. Static/reduced rendering uses original SVG; caches are temporary
and disposed. Timing comparison has a 0.25 ms tolerance for RAF timestamp rounding.
Hidden document pauses and resumes at the same phase. Pause preserves current
state, slow uses ×0.25 presentation time, replay replaces the old transition.
Exit disables callbacks immediately; interrupted enter resumes from the current
progress. No action depends on animation completion.

Reduced motion cancels scheduling, settles visibility instantly, disables sway,
sheen and art transforms, and retains immediate keyboard/pointer input. Changing
views/lighting/selection rebinds one controller and cancels prior SVG listeners.
Disposal removes RAF, media/visibility listeners and resources.

Capture defaults to settled static, independent from live timeline. Explicit
ambient samples freeze presentation time, preserve the game/fixture clock and
record profile parameters. Exported WebM samples are review evidence; encoder
wall time/cadence is not device FPS. See [review](../../ui-reviews/coastal-replica-stage4/README.md).
