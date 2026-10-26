# G1 Review A — visual samples

User selected **A2: 192 px density** and **B3: 152 logical units high** on
2026-10-26. Van retains a slightly shorter silhouette. These measurements govern
G1 frame production; final environment, palette, animation and UI acceptance still
belongs to the playable Review B.

- [Composition preview](board-composition.png): 960×540 viewport, centered within the 1280×540 room. This reference image still shows the comparison's 136-unit sample; the approved production height is 152.
- [Density comparison](board-density.png): A1=128, A2=192, A3=256; all displayed at height 136.
- [Scale comparison](board-scale.png): B1=120, B2=136, B3=152; all use A2.
- [Exact prompts and source metadata](generation.json): built-in image tool, reference paths, generated image dimensions and hashes. Individual correction prompts are retained alongside their images.

Open the viewer from the active checkout using the existing server:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/dev.py --port 8080
```

Then open `http://127.0.0.1:8080/docs/art-direction/review-a/index.html`.
The viewer is a documentation tool; it does not load gameplay or saves. Labels,
positions and measurements live in `review.json`.

Each density has an independently generated drawing. The viewer crops the actual
alpha silhouette, renders it into the requested native-height grid, then draws
with nearest-neighbor sampling. The generated files themselves are enlarged
1536×1024 review sources, not claimed to be finished 128/192/256-pixel masters.
PNG RGB channels may retain hidden backdrop colors where alpha is zero; judge
cutouts composited with alpha, as in these boards.

The clean background is currently a flattened composition. Version 2 adds enough
floor for baseline 420. It is not five production layers, and these samples are
not a playable acceptance result. Original concept images remain unchanged.

Three focused browser capture checks pass. Each PNG is transported separately:
the first combined-image report exceeded the existing 4 MB harness body limit.
No runtime suite was rerun for this documentation-only viewer.

Generated images were copied into this tracked review folder under the user's
explicit exception for the image tool's external staging directory. Production
sources and their recoverable bundle will be managed separately in T02.
