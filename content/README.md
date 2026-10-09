# Game content

Content and balance are authored here as ES modules. This preserves the project's
plain browser/Node workflow without a build step or duplicated JSON/code copies.
The modules export data and small map/dialogue authoring helpers; gameplay
transitions belong in `src/domain/`.

| Location | Owns |
| --- | --- |
| `locales/vi.js` | Player-facing labels, dialogue, errors, log templates and accessibility text |
| `gameplay/definitions.js` | Mock roster, case templates, stat labels and quest steps |
| `gameplay/balance.js` | Default session configuration and gameplay tuning |
| `gameplay/presentation.js` | Phase labels and city locations |
| `gameplay/migrations.js` | Immutable historical identifiers for save migration |
| `maps/definitions.js` | Map layout, objects, portals, NPC placement and schedules |
| `dialogue/interaction-scenes.js` | The nine mock dialogue graphs |
| `sandbox/` | The separate formula sandbox's fixtures and balance |
| `fallback/vi.html` | Static text for browsers with JavaScript disabled |
| `manifest.js` | Active pack and its content version |

Keep IDs stable. Use IDs for rules, conditions, references and save data; use
catalog keys for displayed text. Never use a translated label as a rule identifier.
Catalog keys retain their original namespaces after source files move so existing
events keep resolving. New keys should describe intent, such as `journal.assignment`.

Use `t(key, parameters)` for text. Templates contain named placeholders; migrated
entries retain `value0`, `value1`, etc. Missing keys and parameters are errors.
Catalog output is text, not HTML: render it with DOM text helpers, never `innerHTML`.

The translation service supports additional catalogs and default-language fallback.
The current pack resolves roster/map labels when its modules load; complete live
language switching will require resolving those definitions from keys at view time.
Vietnamese remains the active shipped language.

`validateContent` checks duplicate IDs, stat references, map dimensions, portal
destinations, dialogue speakers and dialogue edges before the gameplay/interaction
pages start. Run the architecture check and browser suite after editing content.
