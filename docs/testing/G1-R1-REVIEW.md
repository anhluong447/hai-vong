# R1 whole-change review

One fresh independent read-only review examined `db7bea8..9f00c94`, including C1,
C2 and R07, against the R1 plan/spec and its five review focus cases. No nested
reviewers were used. Three Important findings entered one TDD fix pass:

1. Hidden/blur stopped momentum only in `step()`. The inactive event now issues
   `world.stop` immediately. Both hidden→visible and blur→focus with no inactive
   RAF are tested; position/distance stay fixed and no footsteps resume.
2. Selected animation preview always used time playback. Locomotion clips now use
   managed `ui.authoring.preview.locomotionSpeed` and cumulative distance through
   the actual ActorView/plant renderer. Equal distances give equal poses; editing
   a sole anchor changes actual rendered pixels. Other clips keep ordinary playback.
3. Shared authoring validation accepted looping footstep cues rejected by runtime.
   It now rejects them at the cue element pointer and preserves the good document.

Regression run: **4 failures before fixes → 13/13 passing** with existing momentum
save/restore cases. A further reproduction of the same lifecycle finding showed
that a moving restore completed while hidden could reintroduce momentum. Thaw
now stops only when lifecycle is inactive; active capture keeps momentum. That
reproduction failed before the refinement and the combined set passes14/14.
Full current suite results are recorded in
[R1 acceptance](G1-R1-ACCEPTANCE.md); final current CI passes all7gates (176JS+67Python,82browser,56authoring,8bot+pack),
and actual static artifact passes3/3. Six receipts match the final fingerprint.

One Minor is deferred: configuration/animation semantic diagnostics generally
omit array-definition prefixes (for example second cloned camera preset reports
`/camera/followResponse60` instead of `/1/camera/followResponse60`). Invalid changes
still reject; source-file identity remains correct. The new looping-cue error
does carry its element prefix. No second review is planned.

Reviewer areas set aside, with explicit rulings:

- Artistic cohesion, lower-leg deformation and subjective feel remain user review.
  Tests do not approve appearance; cost if wrong is an art/game-feel revision.
- Physical low-spec hardware, actual fullscreen and retained heap remain unverified.
  Existing headless CPU4x failures and owned-buffer counts stay disclosed; cost is
  uncertain target-hardware performance, not permission to claim the budget passed.
- Bound CI and static artifact were pending at review. Run the current gates/artifact
  after fixes; cost of stopping earlier would be an unverified handoff.
- Pre-R1 G1 and G2–G8 remain outside this review/task. Preserve their established
  scope; cost is no new certification for earlier work or later milestones.

Earlier implementation rulings retained in the scoped ledger: native project-local
PowerShell/Python equivalents for Bash helpers (manual ledger consistency cost);
cached code-native beam polygon (no painted texture); isolated C2 namespace and
start fixture (normal route still requires separate checks); optional native-grid
lower-leg plant correction (deformation aesthetics and drawing cost need review).
