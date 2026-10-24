# Hoi Am project instructions

## Recover the current brief first

**Mandatory recovery after every context compaction, new session or context loss:**
before continuing work, use read-only file tools to reopen these actual files in
order, even if a carried summary says they were read before:

1. This root `AGENTS.md`.
2. [PROJECT-STATE.md](PROJECT-STATE.md).
3. [Coding and resource rules](docs/engineering/CODING-RULES.md).
4. [Project recovery skill](skills/hoi-am-engine-free-development/SKILL.md).
5. The current task's existing specification/plan and relevant protected Bible/GDD
   sections, if the task touches their subject.

Complete these recovery reads before any mutation or implementation command.
Treat a summary as a pointer, not a substitute for the files. Reconstruct the latest
user request, constraints, completed work, unfinished work and verification results.
If a required recovery file is unavailable, resolve its location before editing code.

The latest explicit user request controls the currently authorized task. A checkpoint
that says "awaiting instructions" does not cancel a newer user instruction. Neither
the checkpoint, a skill nor a roadmap independently authorizes additional work.
Do not start a game, skeleton, editor, dependency installation or content expansion
when the requested task is only rules, documentation or archiving.

Update `PROJECT-STATE.md` at task handoff/completion and meaningful checkpoints in
long work. Record the current task, authorization/stopping point, actual changes,
checks that ran, remaining work and blockers. Preserve uncertainty; do not record
a planned change or an unrun check as completed.

## Project containment (mandatory)

- All project code, plans, skills, dependencies, toolchains, worktrees, caches,
  logs, temporary files and automated browser profiles stay inside this project.
  Resolve paths first; symlinks/junctions must not escape the project.
- Install no project tool or package globally, into a user profile, AppData,
  Windows directories, or an external Codex skill directory. Do not change
  machine/user PATH, registry, global package configuration or system services.
- Python packages belong only in this checkout's isolated `.venv`, with system
  site packages disabled. Bootstrap with `python -B tools/setup.py`; thereafter
  use `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python`.
  Do not use global packages, `pip --user`, or `.cache/python` import injection.
- Other required tools use pinned portable/project-local distributions and local
  caches. Existing Python/browser executables may be invoked without installing
  or modifying them; tests use disposable profiles under project `.cache/tmp`.
  If a tool cannot comply, report the limitation; do not install outside.
- The repository skill is authoritative and is read through this file. Do not
  install or synchronize it outside the project. Any skill/workflow suggesting
  external installation is superseded by this user requirement.

## Current product direction

- Engine-free 2D side-scrolling exploration, hand-drawn/anime layered scenery.
- Desktop browser; every player operation works by keyboard. Mouse is optional.
- Redesign the UI. The legacy 3D direction and coastal replica layout/decorations
  are historical targets, superseded by the user's current direction.
- Establish detailed gameplay contracts, a maintainable skeleton, dedicated tools
  and resource workflows before expanding production content to all 12 weeks.
- Twelve weeks is the eventual product acceptance criterion, not the first milestone.

## Protected sources and archive

- Preserve approved files under `docs/design/narrative/` and `docs/design/gameplay/`
  unless the user explicitly asks to change them. Bible/GDD decisions govern the new
  gameplay; `RULES.md` retains its stated historical formula-sandbox scope.
- The old working tree is under `archive/legacy-2026-10-22/payload/`, including old
  art, generation inputs, tools, tests, drafts and earlier archives. Consult its
  README, inventory and verification report before reuse.
- Archived plans, instructions and implementation are reference material. Do not
  automatically restore the old runtime or treat its roadmap as the current brief.
- Preserve archive bytes. Extract a separate copy for changes; retain source paths
  and verify hashes when moving or restoring artifacts.
- Reference-only history pointers preserve links from the approved documents; the
  original historical documents remain inside the archive.

## When future implementation is requested

- [CODING-RULES.md](docs/engineering/CODING-RULES.md) is mandatory for code, data,
  resource managers and authoring tools. If a needed manager/contract is absent,
  implement the focused data/validation/resolution path within the authorized
  feature; do not hardcode its payload as a temporary production shortcut.
- Keep player-facing strings in a shared locale catalog and definitions/balance in
  content. Use stable technical IDs; labels never determine gameplay rules.
- Keep immutable domain transitions independent of DOM, storage, network and
  animation APIs. Commands go through a session boundary such as `GameSession`.
- Validate state/world replacements before assigning a live session. Review save
  versioning and migrations for new persisted fields.
- Share content contracts/validators across editor, generation and runtime. Keep
  authoring drafts/playtests separate from player saves.
- Add focused extension points for actual features. Keep the formula sandbox
  ruleset separate if legacy behavior is reused; preserve its historical baselines.
- Verify changed contracts with appropriate domain/content, keyboard browser,
  save/migration, authoring round-trip and lifecycle checks. Report actual runs.
- Legacy checkers are archived; run them from the archived payload root only when
  checking that historical product. Their results do not certify a new runtime.
