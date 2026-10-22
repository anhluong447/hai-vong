# Foundation authoring workspace

Run from the implementation worktree, currently `.worktrees/phase-0` in the original
checkout. Python 3.12+ and local Chrome/Edge/Chromium are required. No Node required.

```powershell
python tools/dev.py --authoring --port 8080
```

Open `http://127.0.0.1:8080/tools/workspace/index.html`. The server binds loopback.
Without `--authoring`, the same page supports isolated edits/drafts/preview but
source writes are disabled. The exported player will never contain this write service.

1. Select a source document. Edit its JSON and Apply; the shared project validator
   checks the entire candidate project. Invalid input stays editable and sources stay intact.
2. Undo/redo use validated document history. Applied edits persist to a separate
   authoring IndexedDB draft store; Recover draft validates before replacing a document.
3. Start a preview and advance/choose through the chapter. It uses a new in-memory
   GameSession, never a player save. Stop/restart after editing; undo/redo also stop it.
4. Save source sends the expected source SHA-256. The loopback host checks Host,
   Origin, per-session token, allowlisted path and current hash, then validates the
   full candidate using the same JavaScript validator in a separate browser.
5. A conflict/validation failure preserves the source. Reload external changes and
   reconcile them before saving again; stale drafts require deliberate reconciliation.

Current inspectors edit JSON; dedicated scene/resource/story/gameplay/hearing editors
are T10/T11. Keyboard users can Tab through native controls, edit text and activate
buttons without pointer gestures. Production UI appearance is still a later design.

Only existing declared content documents are writable. Generated outputs, schemas,
project manifests, archive and outside-root paths are not write targets. New IDs can
be added within the declared source; changes to schema/capabilities need code review.
Writes use a temp sibling, fsync and atomic replace. A second hash check catches
external edits during validation; source control is still required for historical backup.

Checks:

```powershell
python tools/check.py architecture
python tools/check.py content
python tools/check.py unit
python tools/check.py authoring --base-url http://127.0.0.1:8080
```

The `--base-url` readiness check fails if the requested server is unavailable. Browser
harnesses otherwise use their own temporary loopback origin and storage. HTTP tests
exercise actual validated writes against a temporary project, including invalid source,
conflict, cross-origin/token/Host denial and outside-root Windows junction/symlink escape.
On this Windows agent, run Chrome/temp-directory tests outside the filesystem sandbox;
do not disable Chrome's own sandbox or weaken source validation to get a green run.
