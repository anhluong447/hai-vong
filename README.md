# Hoi Am — engine-free 2D preparation

The old implementation is archived. The intended game is a hand-drawn/anime 2D
side-scrolling narrative exploration game for desktop browsers, with a redesigned
UI and complete keyboard operation. The immediate priority is a sound gameplay
foundation, resource management and dedicated authoring tools; all 12 weeks are
the eventual product goal.

The Phase 0 foundation is being implemented: validated content, an immutable story
session, checkpoint saves, the first authoring workspace and a keyboard-driven 2D
fixture world with NPC dialogue/doors. Persistent player menus and the remaining
gameplay/tools are next. See PROJECT-STATE.md for actual task evidence.

- [Current state and stopping point](PROJECT-STATE.md)
- [Play the 2D fixture / browser contract](docs/engineering/BROWSER-PLATFORM.md)
- [Asset toolchain and recovery](docs/guides/ASSETS.md)
- [Authoring workspace setup](docs/guides/AUTHORING.md)
- [Phase 0: skeleton and tools plan](docs/superpowers/plans/2026-10-22-phase-0-skeleton-tools.md)
- [Mandatory coding and post-compaction rules](docs/engineering/CODING-RULES.md)
- [Project recovery skill](skills/hoi-am-engine-free-development/SKILL.md)
- [Protected narrative/gameplay documents](docs/README.md)
- [Legacy snapshot, inventory and recovery](archive/legacy-2026-10-22/README.md)

The project skill stays in this repository and is loaded through root AGENTS.md.
Do not install or synchronize it into a user/global Codex directory. Project tools,
dependencies, caches and temporary files also stay inside the project folder;
Python packages use a private `.venv` without system site packages.

The user approved Phase 0 execution on 2026-10-22. Protected design sources and the
legacy archive remain unchanged. The development chapter is a technical fixture,
not an expansion or rewrite of the finalized story.
