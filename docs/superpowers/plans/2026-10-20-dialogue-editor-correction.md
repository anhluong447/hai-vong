# Correct the dialogue authoring renderer

User feedback: the HUD/dialogue editor renders the old DOM dialogue instead of
the existing Stage 4 SVG replica. This is a renderer/source selection mistake.

- [x] Add a failing browser regression for the Stage 4 paper/wave/flowers/notebook,
  the actual composition export, and aligned authoring bounds.
- [x] Use the existing ReplicaStage and Stage 4 motion/assets in the Dialogue tab;
  retain English authoring controls and the HUD editor.
- [x] Give the actual SVG composition three concrete editable groups: paper with
  attached decorations, date card, and choices. Keep transforms separate from
  animation transforms, clips and masks; neutral defaults preserve the replica.
  Persist into the existing coastal-dialogue-ui.json/build pipeline.
- [x] Verify edit/play, drag cancellation/history/import/export, stage scaling,
  main browser and unchanged gameplay baselines; compare against the standalone
  Stage 4 composition and capture the corrected editor.
- [x] Correct documentation that previously described the DOM fallback as delivered.

No new artwork or gameplay integration is required. Character/world matching
remains outside the fixed UI scope.
