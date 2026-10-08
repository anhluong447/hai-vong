# Hồi Âm: dialogue designs v2

Active in the game and dialogue lab. 24 transparent 1024×1536 PNGs, nine identities. Khuê has two three-expression pose sets, five other club members have three emotions each, and the three adult sources each have one default.

## Everyday Khuê and eyewear correction

Khuê now defaults to an upright relaxed stance with empty hands: `neutral` (ordinary expression), `happy` (gentle smile), and `serious` (attentive listening). The existing notebook pose remains available as `investigate`, `lead_found`, and `questioning`. `expressionMasters` in the manifest registers each expression to its own pose master; switching emotions within a pose keeps body registration, while switching poses intentionally changes the silhouette.

Ngọc's wink and Long's hearty laugh now use `ngoc-happy-v2.png` and `long-happy-v2.png`, both **without glasses**. The old expression prompts erroneously demanded glasses; they are retained as historical records and explicitly marked against reuse in the individual prompt files. New facial edits reference only that person's own images, with an explicit bare-face constraint. Nhi and Ân are the club members who wear glasses.

[Revision generation prompts and references](revision-prompts.json). Original generated files and the superseded portraits are preserved. Preview Khuê's ordinary pose at `/tools/dialogue-sprite-lab.html?character=khue`, or use `&expression=investigate` for the notebook pose. All six choices are available in the expression dropdown.

Design pivot: [characters-anime-source.png](../../pixel/characters-anime-source.png), SHA-256 `34E79D2102FB953B88B9F0B594D6CEF1E519A3BE7743129FE5924D7021AFB593`. The pivot is unchanged. `design-refs/` contains unmodified crops of the first three cells in each source row, prepared by `tools/prepare_dialogue_design_refs.ps1`.

Masters are generated independently from the pivot and the matching row crop. No previous dialogue character is used as another person's face/body reference. Each prompt specifies a distinct face, stance, props, viewing angle and baseline emotion. The shared art direction is expressed in words: anime ink contours and readable cel shading.

| Character | Pose / identifying design | Emotions |
| --- | --- | --- |
| Khuê | Relaxed upright everyday stance; separate notebook investigation stance; dark hair, teal tie, satchel | Ordinary / gentle smile / attentive listening; investigation: focused / delighted / probing |
| Vân | Crossed arms, lifted chin, confident gaze; loose brown hair, yellow flower clip, teal bow | Cool confidence / pleased confident smile / fierce objection |
| Long | Broad open stance, raised conversational hand; gold sweater vest | Friendly grin / big laugh / indignation |
| Nhi | Inward shoulders, book hugged to chest, shy angled face; navy bob, round glasses, blue cardigan | Embarrassed / bashful joy / startled anxiety |
| Ngọc | Diagonal lean, camera raised, hand at hip; red ribbon and coral cardigan | Enthusiasm / playful wink / disapproval |
| Ân | Upright side view, adjusting rectangular glasses, holding folder; olive open jacket | Thoughtful / satisfied / skeptical |

The guard retains the source's khaki cap/beige shirt/olive trousers. The source has one adult archetype; teacher and harbor worker are occupation-specific interpretations rather than characters explicitly drawn in the pivot. Their poses and faces differ from both the students and each other.

Prompts: [Khuê](khue-prompt.json), [Vân](van-prompt.json), [Long](long-prompt.json), [Nhi](nhi-prompt.json), [Ngọc](ngoc-prompt.json), [Ân](an-prompt.json), [guard](groundskeeper-prompt.json), [teacher](teacher-prompt.json), [harbor worker](harbor-source-prompt.json). Each includes the master design/camera prompt and selected expression prompts. [All selected prompts and original image paths](prompts.json). All art uses the built-in imagegen tool. Original generated files and v1 are retained.

Expressions derive from that person's own pose master. Vân's happy image derives from her own serious variant, which derives from her neutral. Poses and registration stay stable within each pose group while eyes/brows/mouth change visibly. [Body audit](body-audit.json) checks lower-body silhouette registration against the corresponding pose master. It does not check eyewear, emotional readability or anatomical accuracy; those require image inspection.

Review: [whole cast poses](../../../tools/dialogue-v2-pose-review.png), [expression comparisons](../../../tools/dialogue-v2-expression-review.png). `tools/build_dialogue_v2_review.ps1` generates comparison artifacts with fixed crops/scales and does not edit game art.

Run `/tools/dialogue-sprite-lab.html`: each character has its own emotion labels and mock lines; the cast comparison below the main preview links to individual prompts and the pivot. Run `/pixel.html` for actual NPC interactions.

Validation after the everyday/eyewear revision: **61/61 browser checks passed**, including all 24 active PNGs, registration within each pose group, Khuê's six expression selections, the corrected Long/Ngọc asset paths, and mobile buttons. Visually checked the corrected faces and both Khuê pose sets in the comparison sheet, and [Khuê's everyday pose in the dialogue UI](../../../tools/dialogue-khue-everyday-preview.png). Earlier in-game previews: [Vân in game](../../../tools/dialogue-v2-van-map-preview.png), [Nhi mobile](../../../tools/dialogue-v2-nhi-mobile-preview.png). These checks support asset loading and registration; eyewear was checked visually. Gameplay costs, movement assets and the archive are unchanged.
