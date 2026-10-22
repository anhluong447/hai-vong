# Legacy project snapshot — 2026-10-22

This archive preserves the complete previous working tree, including local/ignored art, audio, fonts, drafts, tools, temporary test profiles and older archives. Git metadata stays at the repository root and is not part of the payload. The new recovery skill and `PROJECT-STATE.md` are outside this legacy inventory.

The active project direction is now engine-free 2D side-scrolling exploration with a redesigned UI and full keyboard operation. No replacement runtime has been created. The user's authorized task ends at verified archiving; wait for the next instruction.

## Layout

| Path | Meaning |
| --- | --- |
| [payload/](payload/) | Original working-tree layout and original file bytes |
| [inventory.json](inventory.json) | Original paths, SHA-256, sizes, tracked status and retained-document flags, captured before moving |
| [verification.json](verification.json) | Full post-move byte verification and protected-document comparison |
| [verification-initial.json](verification-initial.json) | Initial ordinary-path checker result, retained for diagnosis of the Windows path-length issue |
| [move-journal.json](move-journal.json) | Completed top-level moves |
| [skill-verification.json](skill-verification.json) | Skill/source installation comparison and structural validation |
| [skill-recovery-check.md](skill-recovery-check.md) | Independent context-recovery probes |
| [maintenance/](maintenance/) | Inventory/verifier and native PowerShell movement procedure |

Protected documents under `docs/design/narrative/` and `docs/design/gameplay/` remain at the active project root, byte-identical to their archived copies. They include the uncommitted Bible/GDD updates from this conversation. The inventory captures working-copy bytes, not just Git HEAD.

Earlier archives remain byte-preserved under `payload/archive/`, including `clb-hoi/`. The pre-archive `AGENTS.md`, `.gitignore`, `.gitattributes` and `README.md` are also in the payload. They describe the former workspace and do not override the new root instructions.

## Recovery and inspection

For original path `src/world3d/World3D.js`, read `payload/src/world3d/World3D.js`; the same mapping applies to assets, tools, tests and documentation. The old relative layout is intact, so internal runtime imports and document links retain their original targets within the payload.

To inspect an old browser entry, work from `payload/` and serve that directory as the static server root. Historical `tools/serve.py`, browser runners and checks are retained there. Do not use their result as evidence that a new 2D runtime exists. No old preview, server or game is started by the archive operation.

For a full recovery, copy payload contents into a separate empty working directory and verify the inventory before editing. Do not extract over the current project or replace its Git metadata. The archive is kept local; ignored binaries and temporary profiles have not been published or committed.

Recheck preservation from the active root with:

```powershell
python archive/legacy-2026-10-22/maintenance/archive_inventory.py verify
```

Do not regenerate the inventory to conceal a mismatch. Existing empty directories and filesystem metadata are not part of the file SHA-256 contract; every inventoried file byte is.

The first verification reported 15 missing browser-cache files whose new paths
were 262–266 characters long. Checking those files through Windows extended-length
paths established that every file existed and matched the original SHA-256.
The verifier now uses extended-length paths for file I/O and enumeration. The
original inventory is unchanged; consult the final `verification.json` for the
complete rerun result.
