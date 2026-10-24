# Phase 0 decisions and review disposition

These are the executor's recorded decisions, in execution order, copied from the
temporary execution ledger. They preserve technical deviations and tradeoffs for
future recovery. They do not supersede the user's instructions or protected Bible.
Historical provisional choices remain provisional. The independent review and
executor fix disposition are recorded in PHASE-0-REVIEW.md; no second reviewer
verdict is implied by the later test evidence.

## Rulings I made

1. Ruling: use native Python bookkeeping in this plan workspace ? Bash helper unavailable on Windows and task parser expects Task N instead of T01 ? cost: preserve equivalent briefs/base/test evidence manually.

2. Task 2: Ruling: checked-in schemas use an explicit bounded JSON Schema vocabulary with unsupported keywords rejected ? no full-draft dependency needed for initial contracts ? cost if wrong: extend shared validator/tests before accepting more constructs.

3. Task 4: Ruling: reuse the exact JS validator server-side by a short-lived browser validation page ? Python must not accept a weaker duplicate schema ? cost if wrong: source-save latency until a persistent validator worker is justified.

4. Task 4: Ruling: Windows symlink creation unavailable; test real junction escape instead with no skipped checks ? same resolved-root invariant ? cost if wrong: additional symlink-only coverage on privileged CI.

5. Task 5: Ruling: versioned small source ZIP + SHA-256 inventory in ordinary Git instead of a new LFS server ? six fixture masters/inputs restore reproducibly ? cost if wrong: migrate large production bundles deliberately.

6. Task 5: Ruling: introduce restore_assets.py in T05 rather than T13 ? T05 explicitly requires demonstrated empty-workspace recovery ? cost: T13 modifies this existing helper.

7. Task 5: Ruling: pinned Windows x64 offline worker with Pillow 12.3.0 and imageio-ffmpeg 0.6.0/FFmpeg 7.1; PNG/WAV conversion scope explicit, native/system fonts and browser font decoder separate ? cost if wrong: additional platform/format probes/pins before claiming those conversions.

8. Task 6: Ruling: keep optional world.pending/moving in prototype RunSnapshot 1; reject fictional or out-of-bounds scene snapshots; codec tests now use declared scene fixtures. T07 composes real adapter snapshots with atomic persistent save/migrations.

9. Task 6: Ruling: geometric fixture UI/world only; no production art approval implied. World owns one prepared AssetService lease directly. Existing ResourceScope remains for independent callers. System-font readiness/reflow tested; no custom-font converter claimed.

10. Task 6: Ruling: an already emitted sequence scene signal must not reemit on skip. Test corrected to collect it from update, then require empty repeated skips. Web Audio parameter assertions run after actual context processing; denied resume is injected, real retry uses trusted key.

11. Task 7 checkpoint (2026-10-23): native player save/menu/preferences integration GREEN 3/3; save/migration/preferences targeted GREEN 10/10. Full task not complete. Ruling: save export uses a keyboard-copyable JSON textarea, never an automatic external Downloads write; containment is mandatory. Cost: manual copy to a user-chosen backup destination. Ruling: RunSnapshot 1 gains optional history/read-anchor/view fields with strict validation; missing fields mean empty history/default fixture presentation, never a legacy 3D conversion. Cost: explicit release mappings still required for renamed content.

12. Task 7: Ruling: clear saved presentation.view after a successful domain command; it is a capture projection, not authority over future live frames. Cost if wrong: feature-specific browser fields must join the next capture instead of mutating gameplay.

13. Task 8 checkpoint: read actual Bible sections 4/5/6/8/9/10/15/16.1 and Defense 5.1; decisions in task-8-contract.md. Ruling: unresolved costs/work tick/publication timing/rewards are marked fixture-only/provisional, not canonical edits; cost if wrong is retuning data plus release mappings. Ruling: RunSnapshot 2 with explicit nested missing-field defaults preserves known v1 progress and rejects legacy 3D shape/tag; cost is migration review for future fields. RED -> GREEN calendar 4, quest/publication 5, migration 9 = 18 focused tests; earlier player/schema 21 passed. Progression activities/equipment/skills, deep state/reference validation, full gates and T08 commit still pending.

14. Task 9 checkpoint: actual GDD operational reads completed; contract decisions in task-9-contract.md. Ruling: Defense section 4 explicit pipeline wins over conflicting section 6.2 next-accusation prose; pre-response bailout resumes current response, post-response resumes after atomic response/discard. Cost if wrong: change continuation policy and rebalance before production. Ruling: mercy fixture restores 3 hearts at current round, retains solved progress, resets current selections/locks; GDD amount/reset open. Cost if wrong: retune recovery. First 5 Defense tests RED (missing commands/definitions); no hearing implementation yet.

15. Task 9: Ruling: extend only declared 11-binding prefixes, preserve prior codes/contexts and reject ambiguous layouts; profile record stays v1 because only input definitions append. Cost if wrong: explicit remap migration required for future definition edits.

16. Task 9: Ruling: raise unit browser deadline from 40 to 120 seconds after a diagnostic completes 104/104 in 67.9s; no timing assertion relaxed. Cost: hung unit suites take longer to fail.

17. Task 10: Ruling: multi-file source writes use a project-local recovery journal and refuse unknown external bytes; no filesystem-wide atomicity or power-loss certification claimed. Cost if wrong: recover the retained journal manually; production write workflows need stronger storage guarantees.

18. Task 10: Ruling: source save batches include every dirty document, because the validated project revision may span translations/callers; UI labels this as save group. Cost if wrong: user must undo unrelated dirty work before saving a subset.

19. Task 10: Ruling: scene collision editor covers existing linear walkBounds and camera extent; arbitrary polygons require a new runtime contract. Cost if wrong: extend scene/runtime/tools together before authored obstacle-heavy levels.

20. Task 10: Ruling: cold real-workspace bootstrap allowance is 10 seconds instead of 4 after an isolated pass/full-suite cold-start timeout; readiness assertions retained, no performance acceptance relaxed. Cost: a stuck bootstrap takes longer to fail; T13 still measures startup separately.

21. Task 10: Ruling: load independent pack sources concurrently while retaining declaration order; player excludes explicitly authoringOnly documents. Cost if wrong: authoring metadata must be marked correctly before release.

22. Task 10: Ruling: browser suite deadline 120 seconds after measuring a full 53-second native suite; serial gates match normal check orchestration. Cost if wrong: hung suites take longer to fail; device performance acceptance remains T13.

23. Task 10: Ruling: domain fixtures clone a single real project read per harness after measuring 138-second repeated I/O; loader/decoder and native journeys retain actual I/O. Cost if wrong: loader regressions depend on dedicated loader/browser/content tests, not repeated domain setup.

24. Task 11: Ruling: flow creation adds a terminal node and incoming choice in one validated transaction; no temporarily invalid orphan workspace. Cost if wrong: disconnected drafting requires an explicit separate authoring-draft format.

25. Task 11: Ruling: hearing checkpoint previews replay explicit authoringOnly fixture commands from day 17 through earned/publication state; they do not move canonical Boss scheduling. Cost if wrong: new content needs a maintained precondition fixture before isolated preview.

26. Task 11: Ruling: node rename emits a reviewed anchorMap draft with no automatic content-version selection or save writes. Cost if wrong: authors must review/copy the mapping before release and re-review after undo.

27. Task 12: Ruling: owned loopback revision polling provides file-change notifications instead of OS-specific watchers. Cost if wrong: changes appear after the managed poll interval; no global background service or external watcher dependency.

28. Task 12: Ruling: live reload mutates isolated development playtests, not the player session/database; compatible source changes preserve that preview checkpoint. Cost if wrong: production play sessions restart through the normal player; full end-to-end acceptance still uses exported player content.

29. Task 12: Ruling: visual debug snapshots with no committed world scene and an initial pending request require restart; ordinary committed-scene/pending transitions and pure reload ports keep validated state. Cost if wrong: extend the visual preview loading projection before importing such initial-loading traces.

30. Task 13: Ruling: pin official Firefox Nightly ZIP for contained compatibility smoke — Mozilla stable Windows artifacts require an installer, while this exact ZIP has published checksums — stable/ESR compatibility remains unverified.

31. Task 13: Ruling: receipt fingerprint covers all tools and tests as well as runtime/content/masters — authoring/setup changes must invalidate prior gate proof — broader invalidation costs extra verification.

32. Task 13: Ruling: grant sandbox identities RX only inside portable Chromium tool tree — inherited owner-only Windows ACLs prevented executable access; actual stderr and ACL comparison confirmed root cause — local browser bytes become readable/executable to standard sandbox identities, never writable.

33. Task 13: Ruling: record 4x CPU profile as constrained simulation, including failed proposed 60-Hz target — no physical lower-spec machine is available and virtual time would fabricate FPS — physical lower-spec performance acceptance stays unverified and requires later hardware testing.

34. Task 13: Ruling: add explicit Python-wheel offline bootstrap mode — pip prefers a blocked remote duplicate even with verified local --find-links inputs — offline setup requires complete preverified project wheel/archive cache and fails if missing.

35. Task 13: Ruling: make containment tests choose ROOT.parent, not sys.base_prefix — official portable Python is correctly inside the checkout, so the previous test premise was false — these assertions test the checkout boundary independently of interpreter location. RED fresh 2 failures → 7/7 focused both locations → full fresh green.

36. Task 14: Ruling: adapt mandatory canteen leverage into optional Side + Main-only confrontation — finalized Bible forbids Side prerequisites and puts Boss at week3 — no-Side dialogue differs while exact source is preserved.

37. Task 14: Ruling: keep Friday publication/week3 hearing in isolated managed fixture acceptance — requested story ends day3 — no single chronological three-day run can contain these later events.

38. Task 14: Ruling: preserve foundation mechanics fixtures and author First3Days in a separate namespace/runtime project, sharing validated pack/resources — original focused tests/tools need stable fixtures and user requires a real new player entry — export must explicitly include/revalidate additional project metadata; tests isolate historical fixture selection.

39. Final: Ruling: production anime art/12 weeks/final balance remain outside Phase0 — fixtures and provisional values stay labelled — cost: separate production approval/authoring/balance milestones.

40. Final: Ruling: physical lowend/stable-ESR Firefox remain unverified — Nightly and CPU simulation are bounded evidence, retain target failures — cost: additional compatibility/performance fixes may be needed.

41. Final: Ruling: reviewer skipped hosted execution/deployment — user authorizes feature-branch push only, observe CI if available without claiming unrun results; no merge/publication — cost: hosted-only failures may remain.

42. Final: Ruling: parent fresh ac6e818 all-gate proof is authoritative for that revision — post-review sequence fixes receive full current gates, older artifact does not contain them — cost: recovery evidence is explicitly revision-bounded.

43. Final: Ruling: journal source writes are not filesystem-wide power-loss/hostile-race certification — keep conflict detection, last good bytes and documented manual recovery — cost: stronger storage guarantees need future work.

44. Final: Ruling: bounded review/bot coverage does not prove all state/schema combinations — report actual acceptance coverage and extend cases with content — cost: untested combinations may still fail.

45. Final: Ruling: replace batched awaited RAF RPCs with continuous in-page real-RAF sampling plus short status reads — a slow profile can legitimately take over six seconds for60frames — retain180samples/all performance targets and explicit90s sampling failure; cost: measured series includes all intervals and polling overhead, numbers remain host-specific.

## Deferred minors

- Final: minor (deferred): tests/browser/player-flows.test.js:19 uses old contentVersion and may reject mismatch before malformed-presentation guard; use actual revision + exact diagnostic in later test-quality task.
