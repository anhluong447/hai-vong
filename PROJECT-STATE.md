# Hoi Am workspace state

Updated: 2026-10-24 (Asia/Bangkok).

## Current task and stopping point

Phase0 T01–T14 local implementation/acceptance and final independent review fixes
are complete. Latest user says continue and explicitly permits commit+push.
Latest explicit user: "u dont have to setup the CI, just need to push".
Stop CI investigation/setup/monitoring. Hosted CI is deferred by the user and is
not a blocker. Remaining step: push the final checkpoint commit and verify remote
SHA, then stop. No merge, game publication or twelve-week expansion.
Remote GitHub ref already independently matched3bd6954. Git HTTPS response later
reported a transport error; a normal non-forced retry will confirm the final push.
Actual push verification receipts: .cache/reports/git/.
The optional scratch-ledger cleanup was rejected by automatic approval review
because of recovery-history loss risk. It was NOT deleted; preserve it. Its history
also exists in tracked docs/testing/PHASE-0-EXECUTION-LOG.md.

Original root C:/Users/anhlh52/AndroidStudioProjects/Ask (separate original branch
feat/full-3d-foundation with intentional recovery-doc changes).
Implementation .worktrees/phase-0, branch feat/phase-0-skeleton-tools. Do not merge
or claim the original tree clean. T14 commit ac6e818; source fix commit c599d0fea67f27929b7f03aa764f910b95ddf39e.

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
