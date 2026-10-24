# Research sources

Consulted 2026-10-22. These are primary documentation or the pattern author's own book. Recheck changing API support or tool behavior before relying on it. They support engineering choices; the user's product decisions remain separate.

| Topic | Source and relevant lesson |
| --- | --- |
| Main loop | [MDN: Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) — input/update/render sequencing and pauses on managed browser platforms |
| Simulation timing | [Robert Nystrom: Game Loop](https://gameprogrammingpatterns.com/game-loop.html) — update timestep trade-offs, catch-up limits and rendering separation |
| Object behavior | [Robert Nystrom: Update Method](https://gameprogrammingpatterns.com/update-method.html) — explicit behavior state and meaningful update order |
| Hidden tab lifecycle | [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — visible/hidden state and resource suspension |
| Collision | [MDN: 2D collision detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection) — simple hitboxes independently of rendered shape |
| Canvas | [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — caching repeated drawing, DPR and measurement-led optimization |
| Keyboard UI | [W3C/WAI: Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — visible/persistent focus, focus versus selection and component navigation |
| Keyboard escape | [W3C: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap/) — keyboard users need a keyboard way out |
| Gameplay bindings | [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) — physical key identity differs from typed text; check target-browser support |
| Data contracts | [JSON Schema: Structuring schemas](https://json-schema.org/understanding-json-schema/structuring) — modular schemas and explicit identifiers/references |
| Narrative authoring | [inkle: ink and Inky](https://www.inklestudios.com/ink/) — write/test/export, immediate preview, diagnostics and jump-to-definition; reference workflow, not an adopted runtime dependency |
| Font readiness | [MDN: CSS Font Loading API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API) — load status before font-dependent layout |
| Unicode reveal | [MDN: Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) — locale-aware grapheme/word segmentation |
| Audio startup | [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — user interaction and blocked playback handling |
| Motion preferences | [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — reduce non-essential motion |
| Persistence | [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — quota failures, best-effort storage and eviction |
| Authoring file access | [Chrome: File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) — explicit user grants and browser-support limits |
| Controlled tests | [Playwright: Clock](https://playwright.dev/docs/clock) — time-controlled verification; reference capability, not a mandatory tool migration |
| Failure diagnostics | [Playwright: Trace Viewer](https://playwright.dev/docs/trace-viewer) — inspect recorded actions, snapshots and failures |
| Memory | [Chrome: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) — retained DOM, allocations and device-specific budgets |
| Release caches | [web.dev: HTTP Cache](https://web.dev/articles/http-cache) — resource fingerprints and revalidation |
| Binary recovery | [Git LFS](https://git-lfs.com/) — versioning large source assets; optional policy choice, not automatic installation |
