# Player shell and resumable saves (Phase 0 / T07)

The development page starts in the main menu. New run, continue, settings, manual
save/load, backup load, import/export, backlog and dialogue automation use native
keyboard-focusable controls. Tab/Shift+Tab stays inside the active modal. Escape
uses the configured back action; text fields also have a focusable Back button.
Bindings and on-screen exploration hints come from the same preference state.
These screens and the geometric world remain development fixtures.

`content/ui/navigation.json` owns slot counts (currently 10 manual / 3 rotating
autosaves), history capacity, auto delay, preference choices and menu definitions.
`content/input/actions.json` owns translated action/locale/audio-bus labels.
Regenerate the en-XA stress locale after editing Vietnamese strings with:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/pipeline/expanded_locale.py
```

## Ownership and transactions

- `GameSession` owns validated immutable gameplay/story state. Successful domain
  commands discard stale saved browser projections; a capture supplies fresh ones.
- `SaveService` serializes operations. Capture freezes clocks for the synchronous
  copy and preserves queued player input, then resumes while checksum hashing and
  storage complete. Restore clears stale input. A pending scene
  is represented by the last committed world plus its continuation intent.
- Restore verifies checksum/version/content, explicitly migrates, validates, then
  freezes play while preparing replacement World2D, audio and sequence owners.
  Existing owners remain intact until synchronous session/view replacement succeeds.
  Failed preparation keeps the old state; failed commit rolls back. Old-owner
  disposal runs after commit and cannot misreport that committed load as a failure.
- Old asynchronous scene completions cannot commit into a replacement world.
  Accepted cue intents are captured even while audio is still decoding. A browser
  autoplay restriction retains the cue/offset until a valid user gesture.
- Save snapshots contain IDs/plain JSON, not browser nodes or audio buffers. They
  preserve exploration position, fractional reveal, choices, menu, tween elapsed,
  committed animation state, cue offsets and pending travel. They do not promise
  an identical GPU frame or audio sample. Auto/skip stop when opening/loading menus.

`hoi-am.player-saves` contains slots and rotation metadata in IndexedDB. Slot write,
previous-valid backup and rotation update use one compare-and-swap transaction.
Failed validation, quota errors or concurrent writes preserve the previous record.
Autosaves run after committed scene/chapter/choice/effect checkpoints; merely opening
the page does not overwrite an existing run. Gameplay day checkpoints extend this
policy when the calendar is implemented.

`hoi-am.player-preferences` separately owns preferences, profile flags and read
anchors. Authoring drafts have another database. Loading an old player slot cannot
roll back profile flags or preference settings. Backlog stores keyed lines/parameters
and is read-only. Skip stops on unread anchors, choices and before effects/transitions;
auto waits for reveal plus the managed delay and never chooses an answer.

## Compatibility and recovery

T07 RunSnapshot 1 added optional history/read-anchor/browser-view fields. Missing fields
mean empty history/default presentation for an already valid declared scene. This
is not an automatic conversion of historical 3D saves. A different schema/layout
requires an explicitly registered, tagged migration; unsupported data remains
export-only. Unknown content revisions and removed unmapped anchors are rejected.

`MigrationRegistry` accepts exact schema/content steps. Anchor maps apply to the
cursor, history, read markers and execution ledger; flag rename/type conversions
are explicit. Authors must map every renamed reward identity as well as cursor
anchors. An arbitrary story edit is not automatically save-compatible. No production
content-release migration is registered yet. RunSnapshot 3 retains T08's explicit
known-v1 upgrade and adds a tagged-v2 migration for hearings; see
[gameplay](GAMEPLAY-CONTRACT.md) and [hearings](HEARING-CONTRACT.md).
T12 adds source-revision fingerprints; T13
replaces the current development build identifier with release metadata.

Export shows the exact JSON in a selectable textarea. Import parses and validates
before a slot transaction; invalid JSON leaves the prior record untouched. This
avoids an automatic write to an external Downloads folder. Copy/export valuable
saves deliberately: browser storage may be evicted. A corrupt/incompatible current
slot is never silently replaced with its backup; choose the explicit backup action.

## Verification

Slot menu records are prepared during checkpoint preparation, alongside replacement
browser owners. Commit renders the prepared menu synchronously before reporting
load success or thawing input. A late asynchronous slot read must not replace that
menu or steal focus from an immediately activated Back control. Rollback also has
prepared data for the previous screen.

Use `tools/check.py unit`, `browser`, `authoring`, `content` and `architecture` through
the project venv. Browser tests use disposable profiles under `.cache/tmp`. The
player-flow suite drives native keys, corrupt/valid JSON import, remap conflict and
defaults, profile reload, pending scene restore, repeated-owner cleanup and a long
locale with actual 27px text. PNG evidence is stored under `.cache/test/screenshots`.
This proves tested browser behavior, not physical monitor performance or finished art.
