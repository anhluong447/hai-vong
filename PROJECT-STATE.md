# Hoi Am workspace state

Updated: 2026-10-22 (Asia/Bangkok).

## Current status: executing Phase 0; T01?T05 verified; T06 in progress

The user approved committing the plan and implementing it sequentially. Plan commit:
`e9a4d83` on the original branch. Implementation worktree: `.worktrees/phase-0`,
branch `feat/phase-0-skeleton-tools`. Future work continues there, not in the archived
original root. T01?T14 execution is authorized; no push or publication is authorized.

## Current task and evidence

- [Implementation plan](docs/superpowers/plans/2026-10-22-phase-0-skeleton-tools.md).
  T01 contracts, read-only dev server, Python CLI, architecture guards and real
  browser harness are implemented. No playable game or authoring workspace yet.
- `python -X utf8 tools/check.py unit`: 7 Python tests pass; includes real Chrome
  probes proving failing and passing assertions reach the runner. Architecture
  violation fixtures and the current architecture scan pass.
- RED evidence: three preflight and four architecture tests failed before tools
  existed. GREEN evidence is from the actual new suite, not legacy results.
- Windows sandbox prevents access to Python's mode-700 temporary directories;
  browser/Python suites run with sandbox escalation. This is an environment limit,
  not a reason to weaken tests or disable the browser sandbox.
- No Node or new dependency installed. Chrome/Edge are local. `all` and unfinished
  suites intentionally fail `not-implemented` until their tasks supply real checks.
- T02: typed flags/catalogs, bounded JSON schema validation, stable story nodes,
  diagnostics/source pointers, project loader and minimal development pack are implemented.
  Unit gate: 21 browser tests + 8 Python tests pass; content gate validates the real
  pack; architecture passes. Added RED?GREEN malformed-document/unused-locale
  tests and a regression for scanner false positives. No external library installed.
- T03: immutable GameSession/StoryRunner/checkpoints, effect idempotency ledger,
  content-anchor validation and SHA-256 envelope codec implemented. Unit gate: 33
  browser tests + 8 Python tests; real pack content and architecture gates pass.
  Pending scene continuation/stale receipts, mid-reveal and choice resume, corrupt
  envelopes, interrupted effect rollback and zero-yield loops are covered.
  Real timed sequence/audio playback resume remains T06/T07/T09; T03 checks
  serializable adapter state with in-memory fixtures. Profile-slot merge remains T07.
- T04: real JSON workspace UI, shared validation, history/drafts, isolated preview,
  loopback opt-in writer with Host/Origin/token, exact source hashes, atomic replace
  and server-side JavaScript revalidation implemented. Commands in AUTHORING.md.
  Verified: 33 JS + 14 Python (zero skips), 7 authoring, 1 real content; architecture
  passes. UI bootstrap and history invalidation have browser checks; writer conflict,
  interrupted validator, path traversal, Host/Origin/token and Windows junction escape
  have actual HTTP/filesystem checks. Dedicated visual editors remain T10/T11.
- T05: shared asset/animation/audio contracts, AssetCatalog/AssetService/ResourceScope,
  real browser PNG/Vorbis decoder with hashes, deterministic PNG/atlas/audio build,
  import/audit and versioned source ZIP recovery are implemented. Generated documents
  are read-only in editor/model/backend. Restore refuses edited-master overwrite.
  Evidence: unit 40 browser + 20 Python, authoring 8, content 1, architecture pass;
  actual ZIP restored 6 masters/inputs in an empty directory and rebuilt all 6 rendition
  definitions identically. No legacy art copied. Geometric art/tone are explicit internal
  development fixtures, not production art approval or distribution rights.
- Toolchain: existing Pillow 12.3.0 (metadata MIT-CMU); imageio-ffmpeg 0.6.0 installed
  into this worktree's ignored `.cache/python` only. Wrapped FFmpeg 7.1 binary hash
  is pinned; Vorbis repeat build hash verified. Current offline asset worker pin is
  Windows x64. See ASSETS.md/requirements-tools.txt for fresh-checkout setup.
- T06 started: browser harness now has a test-only CDP bridge on its isolated
  loopback profile, using native browser WebSocket with no new dependency. A real
  Tab/Enter test proves default focus/button activation with trusted events; initial
  RED found missing CDP character payload, fixed and 5 preflight tests pass. It does
  not disable Chrome's sandbox; allowed origin is only the ephemeral test host.
  World/input/text/audio/timeline modules have not yet been implemented.
- Next: write T06 platform tests/data and implement browser world/adapters, then T07?T14.
  Authoring dev server was stopped after T05 validation; restart explicitly for
  `--base-url` browser/authoring checks. No ongoing test server is assumed.
  Continue without another permission prompt under the user's implementation order.
- Plan-specific ledger/briefs live under `.superpowers/sdd/2026-10-22-phase-0-skeleton-tools/`
  in the implementation worktree; recorded rulings and test evidence survive compaction.

## Previous Git cleanup handoff

- Authorized scope: fix `.gitignore` and commit the completed archive/rules/skill
  reset so the working tree is clean. Preserve the local archive payload and the
  protected design documents; do not publish or start implementation.
- Changes: `.gitignore` excludes local archive payloads/frozen files across snapshot
  names, local editor/preview drafts, nested dependencies/caches and build outputs.
  Snapshot inventories, verification/recovery metadata, rules, skill source and
  approved design documents remain trackable. Prior tracked paths removed by the
  archive are part of the cleanup commit, not files to restore into the active root.
  `.gitattributes` preserves exact JSON metadata and protected-document bytes so
  Git line-ending normalization cannot invalidate the recorded SHA-256 contract.
- Recovery order: `AGENTS.md` → this checkpoint → coding rules → project skill →
  relevant current task/design sources. A summary does not substitute for reopening
  the files; the latest explicit user task takes precedence over an old stop marker.
- Pre-commit verification: 8 ignored-path cases, 6 retained-file cases, 8 protected
  document hashes and 52 recovery links passed. Staged review passed for 827 paths:
  10 modified, 18 added and 799 old-path deletions. The 28 live files contain no
  payload/cache/log additions; staged metadata, protected documents and skill bytes
  match their preservation contracts, and `git diff --cached --check` passes.
  The resulting commit and `git status --short` provide final Git evidence.
  Full archive byte verification already passed at the archive handoff; this task
  does not modify the payload. No runtime/browser checks are claimed.
- Remaining implementation: none authorized by this task. Product/foundation work
  still requires a subsequent user instruction.

## Previous archive preservation evidence

- [Archive verification](archive/legacy-2026-10-22/verification.json): **passed**;
  35,171 files, 5,105,177,266 bytes, zero mismatches.
- All **8 protected narrative/gameplay documents** match their pre-move SHA-256
  and remain at their original active paths.
- [Skill verification](archive/legacy-2026-10-22/skill-verification.json): the four
  repository-source and installed skill files match; local references and metadata pass.
- [Context-recovery probes](archive/legacy-2026-10-22/skill-recovery-check.md)
  confirm the intended product direction and stopping point are recoverable.
- The SHA-256 inventory includes local/ignored files and the working-copy changes
  that existed at capture time. `.git` remains in place. At the archive handoff no
  commit or publication had been made; a later user request now authorizes the
  workspace-cleanup commit. The ignored payload itself is not part of that commit.

The bundled skill validator required unavailable PyYAML; dependency-free structural
checks and independent recovery probes were used instead. No dependencies were installed.
Legacy architecture validation passed before the move. Browser/baseline suites were
not run for this archive-only task; no new gameplay was implemented or certified.

## Confirmed direction

- Engine-free 2D side-scrolling exploration; hand-drawn/anime scenery with layered depth and light ambient motion.
- Desktop browser; complete keyboard operation, optional mouse.
- Redesign the UI. The old 3D roadmap and coastal UI targets are historical.
- Build detailed gameplay contracts, maintainable runtime foundations, dedicated authoring tools and resource management before expanding production content to 12 weeks.
- Keep finalized narrative/gameplay documents and Bible unchanged. Full 12-week gameplay is the eventual product goal.

## Recovery entry points

- Mandatory coding/resource rules: [CODING-RULES.md](docs/engineering/CODING-RULES.md).
- Skill source: [hoi-am-engine-free-development](skills/hoi-am-engine-free-development/SKILL.md).
- Protected narrative: `docs/design/narrative/`.
- Protected gameplay: `docs/design/gameplay/`.
- [Verified archive](archive/legacy-2026-10-22/README.md): original paths under `payload/`, a SHA-256 inventory and verification reports. Its payload remains local and ignored by Git; retain it or a verified external copy when moving the workspace.

No new runtime, skeleton, editor or game content is authorized by this checkpoint itself. Resume development only on a subsequent user instruction.
