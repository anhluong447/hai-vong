# G1 production asset preview

Open `docs/art-direction/production-preview/index.html` through the existing local
server. This isolated art fixture uses the real `World2D`, `ActorView`, resource
decoder, hashed manifest and leases. It does not create a game session or saves.

- [Composition](composition.png): three independently generated room layers and A2/B3 characters at the real 960×540 viewport, baseline 420.
- [Walk frames](walk-strips.png): six successive poses per actor, drawn by ActorView with guide lines for pivot inspection. The live preview's buttons switch Khuê between idle and an in-place walk loop. These remain prototype animations for playable Review B.
- The page also decodes all six 512×512 portraits. `preview.json` is an explicit review fixture, not the player catalog; its actor name keys are fixture labels. T06 will register real actor definitions and locale names.

Sources, reference copies and exact prompts are recoverable from the active asset
bundle. Masters remain unchanged by the managed crop/resize/padding recipes. The
interior combines architecture, furniture and props; outdoor parallax and foreground
occlusion are separate. Foreground placement is lowered to keep baseline 420 clear.

Actual sources are approximately 1930×814; the proposed 2560×1080 master size has
not been produced by the image tool. Source dimensions are recorded in the inventory.
No upsampled image is claimed to contain additional source detail.

This is T02 asset evidence. It does not certify the story encounter, portrait
transitions, old-save migration, performance, or the user's playable Review B.
