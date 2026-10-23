# Hoi Am workspace state

Updated: 2026-10-23 (Asia/Bangkok).

## Current task and authorization

Continue the approved Phase 0 plan T01–T14 inline. T01–T13 are implemented;
T14 is next, followed by one fresh whole-branch review. The latest user explicitly
directs T14 level/story design to use `docs/history/narrative/First3Days.md`.
Do not stop for another milestone permission prompt. No push, merge, publication
or 12-week production expansion is authorized. Phase 0 is NOT complete yet.

Original root: `C:/Users/anhlh52/AndroidStudioProjects/Ask`.
Implementation: `.worktrees/phase-0`, branch `feat/phase-0-skeleton-tools`.
Run implementation commands from that worktree. Original branch remains separate
with intentional recovery-doc changes; do not merge or claim its tree clean.

## Mandatory containment and recovery

Read actual root AGENTS.md → this file → docs/engineering/CODING-RULES.md →
skills/hoi-am-engine-free-development/SKILL.md → active brief/plan/design sections
after every compaction/context loss. A summary is only a pointer.

All dependencies, portable tools, worktrees, caches, browser data, logs and temporary
files stay inside this project. No global/user/AppData/Windows installation,
PATH/registry/service modification or external skill installation. Use the private
`.venv/Scripts/python.exe -B -X utf8` after bootstrap. Native browser/temp tests
require sandbox escalation on this machine; this never disables browser sandboxing.

## Completed implementation

T01–T05: contracts/validation, story/flags/GameSession/checkpoints, shared authoring
workspace and reproducible resource import/build/bundle recovery.
T06–T07: keyboard 2D world/NPC/doors/camera/text/audio/timeline, transactional browser
saves/slots/backup/import, menus/settings/remap/locales/backlog/auto/skip.
T08–T09: data-driven calendar/energy/Main/Side/General/delegation/publication,
progression/evidence and immutable Defense/Attack/timed hearing state machines.
T10–T11: resource/scene/layout/input/story/quest/gameplay/hearing editors, validated
atomic source writes, undo/redo/drafts, dependency rename/remove and isolated previews.
T12: safe hot reload/revision polling, typed debug/jump/skip, trace/replay, local crash
exports, traversal bot and production debug reachability guard.
T13: contained pinned portable tools, deterministic static export/license/hash/version
audit, current-fingerprint real gate receipts, read-only cache-policy host, staged
keyboard export/performance checks, Firefox smoke, CI recipe and fresh-source restore.

Key commits: T10 bb6f7a1; T11 261fa39; T12 f91ee19;
T13 implementation 5e032a2, offline bootstrap 372ba3a, portable regression 5714e7c.
Earlier task bases/decisions are in the ignored execution ledger:
`.superpowers/sdd/2026-10-22-phase-0-skeleton-tools/progress.md`.

## Actual T13 verification

Full current source at 5714e7c was exported with git archive; every tracked source
byte in a separate `.cache/fresh-checkout-5e032a2` was verified against that export.
Its own portable Python/empty venv installed pinned wheels, restored initially
absent game masters ONLY from the tracked bundle, regenerated renditions, then
passed all seven suites: architecture/content, 119 JS + 55 Python unit,
35 browser, 40 authoring, 7 bot and release. Recovery summary/logs:
`.cache/reports/recovery/summary.json`, `verified-current-gates.log`; raw fresh gates
are in that separate tree's `.cache/reports/ci.json`. No legacy bytes were consulted.
The main worktree also passed all seven gates before the last two test-only fixes;
the fresh run verifies those corrected tests with portable Python.

Retained recovery failures: proxy rejected remote Pillow wheel; pip preferred the
remote duplicate over --find-links. Official PyPI hash verified the existing project
cache wheel; `tools/setup.py --portable --offline` then installed successfully from
local wheels only. Two tests assumed sys.base_prefix was external; portable Python
is legitimately internal. Corrected tests use ROOT.parent, RED in fresh run → 7/7
focused containment checks on both interpreters → full fresh seven gates green.

Tools: CPython NuGet 3.12.10, Chrome for Testing 156.0.8078.47, Firefox Nightly
161.0a1 (build 20261022214940), Pillow 12.3.0, imageio-ffmpeg 0.6.0/FFmpeg 7.1.
Pins/URLs/hashes: content/pipeline/portable-tools.json and toolchain.json. All reside
in project .tools/.venv/.cache. Standard sandbox identities receive RX only on the
portable Chromium tree; no ACL outside that tool tree is modified.

Actual Firefox styled Canvas/IndexedDB/audio/disposal smoke passed. Static artifact
native keyboard new game/NPC/save/load/150% text/DPR resize and six runtime/scene
replacements passed in reference and 4x CPU profiles. First complete reference run:
ready 659.5ms, startup 390083 bytes, RAF p95 16.7ms, normalized heap growth 120496
bytes. 4x CPU simulation p95 150.1ms did NOT meet proposed smoothness target. It is
not physical lower-spec hardware certification. Stable/ESR Firefox and a hosted
Actions run remain unverified; no push was performed. Full evidence/limitations:
docs/testing/PHASE-0-EVIDENCE.md and .cache/reports/release/.

## T14 source and remaining work

Read task-14-brief.md and the plan's T14/Definition of Done. The user's actual source
currently lives in the ORIGINAL root at docs/history/narrative/First3Days.md;
SHA-256 `f55787d3363ee2fb9a82e4ca171a67cf713b6dc2475924005d1d548aae3b2d30`. Preserve its bytes when copying it into the implementation
branch for recovery. It has nine scenes: day1 transfer/Long/recruitment in Room3;
day2 cabinet/tape2011/Long's canteen lead; day3 Khoa intimidation/flash/advisor Nguyen.

Bible/GDD govern gameplay: Side canteen remains optional, all required Main context
must survive skipping it; Khoa on day3 is narrative pressure, not the week3 Boss
hearing. Publication remains automatic; no manual writing/printing approval chores.
The tape is an early lead, not a resolved 2011 case or early final-Boss evidence.
Do not silently grant fabricated evidence for the camera bluff.

T14 still needs authored playable beginning/end with two verified branches through
workspace contracts, all-mechanic fixture integration, native keyboard/save/migration/
hot-reload/export acceptance, bot coverage, complete failure/recovery diagnostics,
updated guides/evidence and a final fresh whole-branch review. Geometry/tone remain
labelled temporary fixture art; no production visual approval is claimed.

## Contracts and protected sources

RunSnapshot 3 / formatTag hoi-am.side-scroll; envelope/profile 1 are separate.
Review explicit content/schema migrations before new persisted definitions. Keep
domain transitions immutable and all commands behind GameSession. Strings/assets/
events/tuning belong in managed data, with shared editor/build/runtime validation.
Authoring/debug previews never write player saves. Preserve last-good owners on
invalid/stale/conflicting replacements. Side high/General standard Defense cards
are separate from Main Attack findings; quality never rescues unrelated evidence.

Read docs/engineering/{GAMEPLAY-CONTRACT,HEARING-CONTRACT,PLAYER-SAVES}.md for exact
rules; docs/guides/ has authoring/resources/debug/setup/release recipes. Legacy
formula sandbox rules remain historical, not the current Bible gameplay.

Protected docs/design/narrative and docs/design/gameplay and archive bytes remain
unchanged. Original ignored archive: 35171 files / 5105177266 bytes; prior inventory
SHA-256 3962b62c8ff13fc30617322fde4b2ea83be9cc9e38c78a161f8c3490d53b8f3b.
No full archive rehash in T13. Do not restore the 3D/coastal roadmap.
