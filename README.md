# Hoi Am — engine-free 2D preparation

The old implementation is archived. The intended game is a hand-drawn/anime 2D
side-scrolling narrative exploration game for desktop browsers, with a redesigned
UI and complete keyboard operation. The immediate priority is a sound gameplay
foundation, resource management and dedicated authoring tools; all 12 weeks are
the eventual product goal.

Phase 0 T01–T14 implementation and local acceptance are complete, including
resource pipelines, dedicated editors, saves/migrations, both hearing phases and
the playable First3Days chapter. The chapter's art and audio remain development
fixtures. Hosted CI was explicitly deferred; see PROJECT-STATE.md and
[acceptance evidence](docs/testing/PHASE-0-ACCEPTANCE.md) for results and limits.

For a fresh Windows x64 clone of `feat/phase-0-skeleton-tools`, follow
[contained setup](docs/guides/SETUP.md) to provision local tools, restore bundled
assets and rebuild renditions. Then start the player from the clone root:

```powershell
.\.venv\Scripts\python.exe -B tools/dev.py --port 8080
```

Open http://127.0.0.1:8080/. A fresh clone does not require the original machine's
`.worktrees/phase-0` path. Browser saves and uncommitted authoring drafts are local
data and are not transferred by Git.

- [Current state and stopping point](PROJECT-STATE.md)
- [Play the 2D fixture / browser contract](docs/engineering/BROWSER-PLATFORM.md)
- [Player controls, saves and recovery](docs/engineering/PLAYER-SAVES.md)
- [Gameplay definitions and state contracts](docs/engineering/GAMEPLAY-CONTRACT.md)
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

The user approved Phase 0 execution on 2026-10-22 and selected First3Days as the
T14 narrative source. Protected design sources and the legacy archive remain
unchanged. Narrative source documents are retained in `docs/history/narrative/`;
adding them to Git does not authorize further gameplay or story expansion.
