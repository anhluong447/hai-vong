# Hoi Am workspace state

Updated: 2026-10-22 (Asia/Bangkok).

## Current status: complete; awaiting the next user instruction

The requested recovery skill, verified legacy archive and mandatory post-compaction
coding/resource rules are complete. The latest task is Git hygiene and committing
this archived-reset workspace; the checkpoint is included in that cleanup commit.
Use `git log -1` and `git status --short` to verify the resulting commit and tree.
No replacement runtime, skeleton, manager, editor or game content has been created.
No push or further implementation is authorized by the Git-cleanup task.

## Latest task and handoff

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
