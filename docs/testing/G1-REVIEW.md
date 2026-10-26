# G1 independent implementation review

One fresh, read-only whole-branch review covered `d684512` through the current G1
implementation, including the T08 working changes. The reviewer inspected source,
tests and captures; it did not independently execute suites. No merge is authorized.

No Critical finding. Two Important findings were reproduced and fixed in one pass:

- New editor labels (`speaker`, `expression`, `narration`, `day`) could pass shared
  validation while missing, unresolved or carrying required parameters, then crash
  editor rendering. The validator now checks all four empty-parameter contracts.
  The rejection test was RED, then GREEN for all twelve invalid cases.
- Actual G1 Resource Browser clip previews inherited scale 2 and smooth sampling,
  cropping heads in the 480x270 canvas. Managed preview settings now select pixel
  sampling and scale 1. Tests exercise all four actual animation panels, inspect
  draw-time filtering and calculate complete frame bounds. Sampling and crop each
  failed before the corresponding change; the combined focused suite passed 13/13.

One Minor finding remains deferred: Preview -> day 2 -> Preview again starts a new
day-one Scene Preview while its day control still displays 2. Change the day field
again to apply it. This affects only authoring preview; it does not alter player
saves or production NPC visibility. The workflow permits one Important fix pass;
this minor is recorded for the user's next tool-polish assignment.

The reviewer declined to judge the following; the executor retains these limits:

- Final palette, proportions and animation aesthetics require playable Review B.
  Automated checks cannot approve the user's art direction.
- Other locations/cast, synthetic audio, broad HUD/menu styling and dynamic light
  are explicitly outside G1. Their fixture status remains visible.
- Physical lower-spec performance and actual browser fullscreen appearance remain
  unverified. Viewport emulation and controlled CPU samples do not establish them.

Final frozen-source gates and static journey results are recorded in
[G1-ART-ACCEPTANCE.md](G1-ART-ACCEPTANCE.md). No second review is claimed.
