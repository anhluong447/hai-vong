# Hoi Am workspace state

Updated: 2026-10-26 (Asia/Bangkok).

## Current task and stopping point

Latest user authorizes a new branch and an initial commit, then explicitly asks
to stop and await the next assignment. Created feat/first3-art-direction from
Phase 0 tip c172652d9ce0deede3b3b9a389c699e2b0c06912, reusing this existing linked
worktree at .worktrees/phase-0. The path name does not determine the current branch.
Copied all 11 supplied concept PNGs (nine character sheets and two location
concepts) from the original-root docs/design/concept to the same relative paths
here; all 11 source/copy SHA-256 hashes match. Originals remain in place.

Initial commit scope: these concept references and this checkpoint, including
the preceding three-day scope/art audit. No gameplay, production asset conversion,
implementation plan, dependency setup, merge, push or publication is authorized
by this request. Check staged diff/committed tree and final branch status; runtime
tests are not needed for this concept/checkpoint-only initialization. Stop after
the initial commit and report its ID. Phase 0 local acceptance remains historical
evidence below, not a fresh test run.

### Supplied art direction and character references

Latest user provides existing character designs and a new corridor concept. Viewed
all nine sheets under original-root docs/design/concept/characters: Khue, Van,
Long, Nhi, Ngoc, An, Khoa, Linh, Huy. The generically named Hoi Am_ Character
Design Sheet.png is Ngo Thien An. Sheets supply appearance, turnaround,
expressions, palettes, props and sample sprites; these are existing design
sources, not missing design work. Viewed locations/Sunset_Corridor.png; Room 3
reference now also resides under locations/bao-chi-hoang-hon.png. Both locations
share painted anime environments, sunset light and navy/ivory UI. References
exist in original root, not this worktree. No image was copied/generated/edited.

Production gaps remain: clean separate portraits/sprites/frames, consistent sprite
proportions (sheet samples are more chibi than map characters), background layers
without baked UI/characters, in-game staging and real audio. Corridor sign says
12A3 while existing First3Days class is 11A3; concept lettering/biographical copy
does not silently override protected narrative. Immediate scope remains three
days. This turn inspected references and updated checkpoints only; no runtime
changes or tests, and no implementation plan was approved.

### Three-day scope and preceding asset audit

Latest user explicitly keeps the existing three-day scope and rejects expanding
to two weeks as the immediate next step. They ask which major components/assets
are missing so these three days become an actual audiovisual game and can settle
art direction. The earlier two-week recommendation is superseded; Bible section
15 remains future reference, not authorization to expand content now.

Read-only audit found seven locations sharing one fixture background and the same
generic NPC; player/NPC share one idle frame and two walk frames. Both BGM/SFX cues
use the same 0.5-second synthetic tone. No real character/environment/music pack
is registered. World rendering supports image layers/parallax and idle/walk;
actor schema has no expression/pose states. Story showActor/setBackdrop update
snapshot fields, but the audited player rendering does not consume those fields;
First3 dialogue has no speaker/portrait/expression metadata. Audio buses/fades
exist, but play currently replaces the active track on each bus, so overlapping
SFX needs an explicit policy. UI uses system fonts and fixture tokens. Asset
import/atlas/bundle recovery infrastructure exists.

Recommendation only: first integrate one representative Room 3 encounter with
distinct characters, layered art, dialogue staging/UI and real music/ambience/SFX,
then cover the existing three days using the same style. Proposed asset counts
are planning estimates, not approved requirements. No production assets/code,
new implementation plan, merge, CI setup or publication were created/authorized.
Only root/feature PROJECT-STATE.md were updated; no runtime tests were rerun.

### Previous implementation handoff

Phase0 T01–T14 local implementation/acceptance and final independent review fixes
are complete. Latest user asks to check cleanliness and push any remaining docs
to feat/phase-0-skeleton-tools. This is a documentation-only handoff; no runtime,
CI, merge, game publication or twelve-week expansion is authorized by this task.

Prior push exit0 and git ls-remote confirmed4058c45fb6c45b745ae5947b5f32461f420b16d7.
The new docs handoff preserves characters_profile.md and master_narrative_bible.md
under docs/history/narrative, byte-identical to the original root sources.
First3Days was already tracked and is byte-identical across both checkouts.
Raw narrative-source Git attributes preserve bytes. README/checkpoint now describe
the completed foundation and fresh-clone setup rather than an earlier milestone.
Root-only containment/recovery changes already exist here; the root snapshot is
committed separately without merging its historical plan over this implementation.
Verify final status and remote SHA after the docs commits/push. Git verification
receipts from the prior handoff remain .cache/reports/git/.
Optional scratch-ledger deletion was auto-review rejected; preserve the ledger.
Its history also exists in tracked docs/testing/PHASE-0-EXECUTION-LOG.md.

Original root C:/Users/anhlh52/AndroidStudioProjects/Ask is the separate historical
branch feat/full-3d-foundation. Active implementation is .worktrees/phase-0, branch
feat/phase-0-skeleton-tools. A fresh clone uses this feature branch as its root;
the .worktrees/phase-0 path is specific to the original machine, not a prerequisite.
T14 commit ac6e818; source fix c599d0fea67f27929b7f03aa764f910b95ddf39e.

## Mandatory recovery and containment

Read actual root AGENTS.md → this file → docs/engineering/CODING-RULES.md →
skills/hoi-am-engine-free-development/SKILL.md → relevant current plan/design after
every compaction/new session/context loss. Summary is only a pointer.
All dependencies/tools/worktrees/caches/logs/temp/browser data remain in project.
No global/user/AppData/Windows installation or PATH/registry/service changes.
Use .venv/Scripts/python.exe -B -X utf8. Browser/temp/Git writes require sandbox
escalation on this machine; browser sandbox remains enabled.

## What exists

Engine-free JS modules/Canvas2D/DOM browser exploration and keyboard UI; immutable
GameSession/story/flags/calendar/energy/quest/delegation/publication/progression/
Defense/Attack/timed hearings; managed strings/assets/animation/audio/events/tuning;
shared schema/semantic validation; transactional saves/preferences/migrations;
dedicated resource/scene/layout/input/story/quest/gameplay/hearing editors, atomic
source groups, undo/redo/drafts, safe reload/debug/trace/crash/bot; contained portable
toolchain, asset bundle restore/build and deterministic static export/license/CI.

First3Days:11story docs/7physical scenes/3quests/17flags under content/dev/first-three-days.
Player index selects content/first-three-days.project.json/runtime.first3; original
mechanics fixtures remain content/project.json/runtime.foundation. Both share pack,
content0.0.2. Two routes finish Main on day3; canteen Side stays optional; separate
routine General delegated to Long. Main Attack findings, Side high/General standard
Defense cards separated. No fabricated camera-bluff evidence. Cassette2011 unresolved.
Friday publication/week3 hearings use isolated fixtures, not chronological day3.
Geometry/tone are labelled temporary fixtures, not production anime art approval.

Explicit additive0.0.1→0.0.2 migration adds only missing flags/quests and preserves
progress/receipts. Genuine old-runtime slot provenance captured from1dfce84. RunSnapshot3.
Registered story gameplay capabilities reuse pure guarded commands/executeOnce.
Multiple flag source files are selectable in Story Editor. Bot seeds replay earned
state via ordinary commands, never forged rewards or silently omitted branches.
Sequence fixes derive waiting scene from saved ID/index + pending target and share
initial/frame signal dispatch. No new persisted field or schema version.

## Actual final local evidence

All seven local gates PASS; 126 JS + 57 Python / 46 browser / 42 authoring / 8 bot; fingerprint 4cef4485da8e977089ff7b7c131936b44b2bd1fa5c3699fe23f939971e03fb2f.
Raw .cache/reports/ci.json + bound receipts; static artifact dist/foundation-demo/4cef4485da8e977089ff.
Both full native-keyboard source/static routes pass, save/load day2/end, Main-only
and Side paths, queued2/3/audience0. Actual First3 Workspace→8doc authenticated writer
round trip, undo/recovery/hot reload/rendering/conflict diagnostics pass.
Bot20/20nodes,6/6choices,6/6assets,14/14fixtures, no unexplored.

Fresh git archive ac6e818:394tracked files byte-verified; own portable offline tools,
empty private venv; absent game masters restored ONLY from tracked bundle; rebuilt
and all seven gates PASS. .cache/reports/recovery-t14/summary.json. No legacy reuse.
Subsequent focused sequence fixes have final full current-source gate proof above;
older fresh artifact is not claimed to contain those later changes.

One fresh whole-branch review, no Critical,2Important both fixed RED8→GREEN8 plus
full gates green.1Minor stale-negative-test revision deferred. No second review.
Measurement timeout diagnosed: awaited60RAF RPC exceeded6s on4xCPU profile; now
continuous180realRAF samples + short polls; targets unchanged. Failure log retained.
Detailed evidence/review/all Rulings: docs/testing/PHASE-0-{ACCEPTANCE,EVIDENCE,REVIEW,DECISIONS}.md.
Execution history is preserved in docs/testing/PHASE-0-EXECUTION-LOG.md.

## Limits and protected sources

Hosted CI explicitly deferred by the latest user; no CI success is claimed. Nightly smoke does not certify stable/ESRFirefox.
4xCPU simulation is not physical lower-spec FPS; keep failed targets visible.
Production art/12weeks/final balance remain future work. Source journals do not
certify filesystem-wide power-loss atomicity. Protected Bible/GDD unchanged.
User First3Days raw SHA256 f55787d3363ee2fb9a82e4ca171a67cf713b6dc2475924005d1d548aae3b2d30.
Archive untouched, prior35171files/5105177266bytes; no new full rehash claimed.
Do not rerun ignored one-time content bootstrap helpers over edited source.
