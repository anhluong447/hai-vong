# Resource and scene authoring

Run from the active checkout `.worktrees/phase-0`. All dependencies, caches,
source backups, browser profiles and generated files remain inside the project.

```powershell
.venv/Scripts/python.exe -B tools/dev.py --authoring --port 8080
```

Open `http://127.0.0.1:8080/tools/workspace/`. The ordinary read-only host supports
editing/export/preview in memory; source saving and asset rebuilding require the
explicit authoring host. It accepts only same-origin, token-authorized requests
to allowlisted source files. No player database is opened by a preview.

## Select and edit

1. Choose a source in the explorer. With an empty query, its definitions appear
   in the resource list; type an ID, source path or text to search the whole pack.
2. Choose a definition. Typed property controls and dedicated preview controls
   operate on that same working document. Tab/Shift+Tab, Enter/Space and normal
   text editing work throughout. Lists paginate; fields scroll without losing
   the selected source. Mouse placement is optional.
3. An edit validates the entire candidate project before replacing any document.
   Invalid values retain the last valid bundle and produce source/pointer
   diagnostics. Select a usage/diagnostic to focus its field or raw-source fallback.
4. Undo/redo restores a complete edit group. Locale-key renaming updates both
   catalogs and every exact reference in one group. Referenced removal is blocked
   with its used-by paths. Generated assets are inspected, never directly edited.
5. Save writes all dirty documents as one validated batch when necessary. Export
   exposes copyable JSON; import uses the same validation. Expand the raw-source
   section for the full JSON form. These controls do not write to Downloads.

Definitions use namespaced technical IDs, such as `scene.chapter.location` or
`clip.character.walk`. Labels never determine rules. Used-by indexes exact ID
references, not words inside prose; use distinct namespaces across resource kinds.
ID changes still require content-version/migration review before publishing a
release. Renaming content does not invent migrations for existing player saves.

## Resource panels

| Panel | Source and preview |
| --- | --- |
| Strings | Locale entries, parameters and safe rich-text preview through TextService/TextView. Parameter changes must match translations and callers. The en-XA stress catalog can be regenerated with `tools/pipeline/expanded_locale.py` after editing Vietnamese source. |
| Assets | Generated manifest metadata and decoded atlas/image preview. The recipe link opens editable import/atlas settings. Audio assets preview through a declared cue; create a cue before previewing an otherwise unreferenced audio asset. |
| Animation | Clip frames, durations, pivot and loop settings. Preview and Step use the actual ActorView/AnimationPlayer and resource leases, including edited pivots and frame timing. |
| Audio | Cue asset/bus, loop points, gain and fades. Listen starts the actual AudioAdapter after a browser gesture; Stop releases its resources. BGM/ambience/voice/SFX remain separate buses. |
| Events | Registered handler and parameter schema. Enter JSON parameters and run a fresh isolated GameSession; inspect outcomes and failed guards. Preview rewards never touch player progress. |

Previews use explicit steps rather than an editor background simulation loop.
Replacing, stopping or closing a preview releases its canvas, listeners, resource
leases and audio nodes. A superseded asynchronous request cannot claim the next
preview. System fonts are supported; no custom-font converter is claimed.

## Asset and atlas recipe

`content/assets/imports.json` is an authored, schema-validated document. Its source
root is declared in the recipe/schema; the file pipeline independently enforces
resolved project containment. Add masters under `assets/sources/`, record their
license/provenance, and edit entries or atlas members/padding/max size in the recipe
inspector. The pinned pipeline currently converts PNG and WAV/Ogg fixtures.

Choose **Build** on the recipe. The workspace first saves the coherent dirty group,
then prevents edits during generation. The loopback service checks the source hash,
uses the existing pinned pipeline and validates the proposed manifest through the
shared project validator. Only then does it replace the generated manifest. Failed
conversion, bad references or stale source hashes preserve the previous manifest.
Generated renditions/cache files may remain for reuse after a rejected build.

For example, fixture atlas padding `1 -> 2` produces a `70 x 68` atlas with its
first frame at `x = 2`; no generated frame coordinates are edited by hand. Refreshing
the generated document updates its source hash and the bundle used by the preview.
The read-only host disables Build. The CLI remains available:

```powershell
.venv/Scripts/python.exe -B tools/pipeline/build_assets.py
```

## Scenes, layout and bindings

Scene properties cover layers/parallax, ground baseline, walk bounds, spawns,
actors, interaction ranges/doors and scene width. Select a layer/actor/interaction
to narrow the property fields. Preview uses the real World2D and GameSession.
Select a placement target, then release the pointer on the canvas to set its X;
typing the same X field issues the same validated operation. Resizing preserves
logical coordinates. Focus the preview canvas for the authored movement/input
bindings, then Step to inspect the result.

Drawing positions and interaction regions are independent definitions. Moving an
NPC sprite does not silently move an unrelated talk point; edit the intended
interaction explicitly. GroundY plus animation pivots defines the feet baseline.
The current collision contract is the linear walk range. Camera following/clamping
uses scene width and the runtime viewport. Arbitrary polygon collision is absent.

The layout inspector edits UI tokens/navigation and previews native menu order
plus focused/selected/disabled/error states. Duplicate navigation actions reject.
The input inspector edits source bindings and provides an isolated active-context
input target. Conflicting/reserved/unknown bindings reject. Neither editor writes
player preferences or remaps.

## Recovery and verification

Draft recovery restores the entire dirty source group and checks every base hash.
A changed base rejects recovery without partially replacing documents. Source
batches retain before-bytes and a journal under `.cache/authoring-transactions/`.
An interrupted process is recovered on authoring-host startup; unknown externally
edited bytes block recovery rather than being overwritten. Keep that journal for
manual diagnosis if recovery reports a conflict. This is process-crash recovery,
not a claim of filesystem-wide atomicity or certified power-loss durability.

Run architecture/content/unit/browser/authoring gates with `tools/check.py` using
the project venv. T10 checks include native search/edit/undo/dependency navigation,
CSS-scaled pointer placement, resource decoding/audio, scene export/reopen in the
runtime and source-write/build failure recovery. Hot reload and the traversal bot
belong to T12; the complete authored chapter/release acceptance belongs to T13/T14.
