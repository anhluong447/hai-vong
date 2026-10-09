# Development workflow

The project remains plain HTML/CSS, Canvas and ES modules. Python serves it; Chrome
or Edge runs the browser tests. Node is optional for the non-browser suite.

## Required rules

- Put player-facing text in `content/locales/vi.js`; put static no-JavaScript text
  in `content/fallback/`. This includes errors, accessibility labels and log text.
- Put character/case/dialogue/map definitions and tuning in `content/`.
- Use stable technical IDs in runtime logic. Locale labels must never control rules.
- Keep domain transitions immutable. Browser APIs belong to presentation,
  infrastructure or the world adapter, not domain code.
- UI handlers issue actions through `GameSession`; views do not calculate outcomes.
- Validate a replacement save before assigning it to the live session.
- Add small extension points where there is a concrete feature. Keep the formula
  sandbox ruleset separate from the newer gameplay ruleset.

## Adding content

1. Add catalog entries with stable keys and parameter placeholders.
2. Add definitions to the relevant content module. Reuse existing action/condition
   contracts for additional cases, characters, map objects or dialogue nodes.
3. Run content validation and verify all references.
4. Exercise the affected screen and save/load path in the browser suite.

A new mechanic needs a domain handler, an explicit action contract and an
application/UI path to invoke it. Keep narrative and balance editing outside the
handler. Adding a new phase, stat or save field also requires updating the save
validator and documenting migration behavior.

## Verification

```powershell
python tools/serve.py --port 8080
# In another terminal:
python tools/check_architecture.py
python tools/run_browser_tests.py
python tools/check_baselines.py
```

If Node is installed, `npm test` runs the formula-core and architecture/session/save
tests; the full UI, asset and long gameplay tests still run in the browser.

The architecture checker verifies import resolution, dependency boundaries,
catalog references, direct UI text, non-ASCII runtime literals and relocated review
links. It is a lightweight lexical policy check, not a compiler or a complete
proof that all possible inline prose has been removed. Browser tests verify execution.

The baseline comparison checks every field in eight formula policies and four
gameplay policies, including the 84-day run. Do not regenerate baseline files to
make a refactor pass. Rebaseline only for an intentional gameplay change, with its
reason and playtest evidence recorded separately.

## Files and artifacts

Keep runtime resources in `assets/`, current authoring/playtest tools in `tools/`,
and durable documentation in `docs/`. Historical review images live in
`archive/development/reviews/`; completed migration scripts live in
`archive/development/migrations/2026-10-09/`.

Do not delete historical art sources or move an active atlas, generation input or
tool solely because it looks old. Resolve runtime/tool references first. Inventory
archive moves and verify their hashes; update links after relocation.

The legacy `archive/clb-hoi/` snapshot is preserved and is not imported by active code.
