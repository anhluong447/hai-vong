# Phase 0 independent review and fix disposition

One fresh read-only reviewer examined the whole branch `e9a4d83..ac6e818`, following
the approved plan's five Review Focus cases, contracts and recorded rulings.
No implementer subagents or second review were used. The review found no Critical
issue, two Important sequence defects and one Minor test-quality issue. Its original
verdict was **not ready until the two Important defects were fixed**.

Strengths identified: immutable session ownership, shared content validation,
explicit migrations, staged runtime replacement, resource lease/cancellation,
validated conflict-aware authoring writes and Bible-compatible Main-only progression.

## Important fixes

1. `src/bootstrap/main.js` formerly acknowledged timeline scene loads through a
   closure-only `sequenceSceneStep`. A saved waiting scene opened in a fresh runtime
   could lose continuation, restart a destination entry or stay waiting forever.
   The fix removes that closure state. `SequencePlayer.waitingScene()` derives the
   step from the saved timeline ID/index, and bootstrap acknowledges it only when
   it matches the pending scene destination. Destination entry sequences do not
   replace that continuation. No persisted field/schema change is needed.
2. Timeline entry previously called `update(0)` and discarded its cue/scene signals.
   A leading cue was lost; a scene-first or zero-duration-prefix timeline could wait
   forever without a scene request. Initial and per-frame signals now share one
   dispatcher through the existing audio and scene-command ports.

`tests/browser/sequence-continuation.test.js` reproduces both defects with valid
in-memory fixture edits, actual shared validation, real Canvas/audio/resource/save
owners and disposable Chromium profiles. It checks leading cue once, leading scene,
zero wait/tween prefixes, same/fresh runtime restore and destinations with/without
entry timelines. It also explicitly detects a restarted timeline that later happens
to finish, and compares receipt preservation. These are API-driven real-browser
runtime tests; trusted keyboard journeys remain separately covered.

All 8 final reproductions failed on the original implementation
(`.cache/test/final-sequence-red-final.json`) and all 8 passed after the fix
(`final-sequence-green.json`). The whole-suite run after this single fix pass passed all seven gates: 126 JS + 57 Python / 46 browser / 42 authoring / 8 bot.
The later measurement-harness timeout was reproduced and corrected with continuous
RAF sampling; all frame counts and targets remain unchanged. No second reviewer
verdict is claimed. Source fix commit: `c599d0fea67f27929b7f03aa764f910b95ddf39e`.

## Deferred Minor

`tests/browser/player-flows.test.js:19` constructs its malformed-presentation
envelope with content revision `0.0.1` despite a current snapshot. Content mismatch
can reject it before the intended presentation validation. Improve this test by
using the actual snapshot revision and asserting the relevant diagnostic. Deferred
as test quality: the production presentation validator remains active, and the
review supplied no corresponding accepted-invalid-state reproduction.

## Behaviors the reviewer declined to judge

The executor explicitly retains these bounds, rather than silently converting
missing evidence into acceptance:

1. Production anime art, full twelve-week content and final balance are outside
   Phase 0. Fixtures/provisional data remain labelled. Cost: production authoring,
   art approval and balancing still require their own milestones.
2. Physical lower-spec performance and stable/ESR Firefox are unverified. Keep
   Nightly/CPU-simulation evidence and failed smoothness measurements visible.
   Cost: further compatibility or performance work may be required before release.
3. The reviewer did not execute hosted Actions/deployment/publication. The user
   does authorize pushing this feature branch; perform that after verification.
   Keep hosted CI unverified unless its real result is observed. Game publication
   and merge remain unauthorized. Cost: hosted environment failures may remain.
4. The independent fresh-checkout outcome belongs to the parent executor's actual
   run. Source `ac6e818` was byte-verified, bootstrapped offline, restored from the
   tracked bundle and passed all seven gates. The later focused sequence fixes
   require their own full current-source gates, not a claim that the older fresh
   artifact contains them. Cost: evidence is bounded to the recorded revisions.
5. Recovery journals do not certify filesystem-wide power-loss atomicity or
   hostile external-process races. Retain detected-conflict/last-good behavior and
   manual journal recovery. Cost: stronger storage guarantees remain future work.
6. Review and acceptance traversal are bounded, not exhaustive proof over every
   state/schema combination. Report actual node/choice/fixture coverage and add
   cases as production content expands. Cost: untested combinations can still fail.
