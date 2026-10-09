# Project instructions

- No hardcoded player-facing strings or text in runtime JavaScript or page shells.
  Use `content/locales/vi.js` and the shared text service. Static no-JavaScript
  fallback text belongs in `content/fallback/`.
- Keep game definitions and balance in `content/`; technical IDs remain stable and
  never depend on translated labels. Read `docs/ARCHITECTURE.md` and
  `docs/DEVELOPMENT.md` before changing module boundaries.
- Preserve the separate formula-sandbox and gameplay rulesets. Domain transitions
  must remain immutable and independent of DOM, storage and network APIs.
- Issue gameplay commands through `GameSession`; validate saves before replacing
  a session. New state fields require validator and migration review.
- Preserve existing baselines during refactors. Regenerate them only for an
  intentional gameplay change with documented evidence.
- Run `python tools/check_architecture.py`. For gameplay/UI/world/content changes,
  run the browser suite with the local server and then `python tools/check_baselines.py`.
  Node tests are optional when Node is unavailable; report what actually ran.
- Archive obsolete artifacts with an inventory, verify moved bytes and repair
  references. Preserve active art, source generation inputs and reusable tooling.
- Build focused extension points for concrete features; avoid a speculative engine
  framework. Do not edit the historical `archive/clb-hoi/` snapshot during routine work.
