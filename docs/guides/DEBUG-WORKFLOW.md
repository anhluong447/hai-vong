# Development playtests, reload and diagnostics

Use the active checkout and its private venv. All server processes, browser
profiles, reports, caches and asset outputs remain inside this project.

```powershell
.venv/Scripts/python.exe -B tools/dev.py --authoring --port 8080
```

Open `/tools/workspace/`. The debug section is reachable by normal Tab navigation.
Start a managed fixture before using its console. Its GameSession, world renderer,
resources and command trace are separate from player saves/preferences and from
authoring drafts. Closing the workspace disposes their owners and polling.

## Work from a known checkpoint

Choose a fixture and start it. Chapter/node selectors jump using that fixture's
validated precondition state; ordinary story commands then execute at the chosen
anchor. Missing conditions, facts or resources remain errors. A jump does not invent
quest completion or hearing evidence. Typed flag overrides apply only to this
explicitly enabled developer session. Invalid values preserve the current state.

The JSON console submits ordinary GameSession commands. Skip has a managed step
budget and stops at choices, transitions, endings or failed guards; it does not
solve hearing puzzles. State and revision are visible. Export Trace contains bounded
commands, outcomes, failed guards and checkpoints. Replaying that JSON validates
the initial state and checks the actual resulting states/outcomes against the trace.
When older entries are trimmed, the first retained checkpoint is the replay origin.

## Apply sources safely

**Apply working copy** uses current validated editor documents without saving them,
clearing their history or changing their dirty status. Compatible revisions keep
the cursor, flags and committed gameplay state; the real world/text preview is
prepared before adoption. Invalid definitions, stale preparations and edits made
during preparation retain the current preview. Prepared resource owners are released
when a candidate loses ownership.

Removed anchors, changed flag types or incompatible gameplay need a reviewed
content migration or an explicit restart. Paste a full migration step with `from`,
`to` and the mappings described in [ADDING-CONTENT.md](ADDING-CONTENT.md), and bump
the source content revision deliberately. A node-rename draft is a candidate to
review, not an automatically approved save conversion. Restart resets only this
isolated playtest. A debug snapshot whose world has no committed scene and has a
pending scene request currently requires restart in the visual workspace; the
application reload contract itself preserves validated checkpoints through its
resource preparation port.

**Reload saved sources** requires a clean workspace. A source change or dirty edit
during preparation blocks replacement. Recover/undo/save that work explicitly;
reload does not overwrite it. A clean external revision resets source edit history,
and old draft base hashes still detect conflicts on recovery.

## Watch JSON, PNG and cues

Watch is off by default. On the opt-in authoring host, enable it after starting a
fixture. The owned loopback poll hashes declared project/pack/schema/master/browser
asset inputs; it never scans the archive. The interval is managed in `ui.debug`.
Changing a declared PNG master or import recipe invokes the existing incremental
generator and shared manifest validation. Valid JSON/cue/source changes and new
hash-named renditions can then replace the isolated preview without a full-game
build. Audio audition remains in the Audio panel; the debug world preview does not
start a hidden audio/simulation loop.

A failed conversion retains the last-good generated manifest. Invalid source or
dirty-workspace errors stop Watch and keep the last-good preview. Fix the source,
then enable Watch again. Stopping/restarting Watch invalidates old responses; a
late response cannot adopt an older revision. The exported player has no authoring
revision endpoint or mutation-debug module dependency.

## Local crash packages

The workspace reporter records errors in a bounded local ring. Export Crash makes
the latest JSON available in its text area: original error/stack, revision,
checkpoint, trace and a Canvas PNG when available. Screenshot or context capture
failure is recorded without dropping the original error. Copy a useful package
into the project's `.cache/reports/` when retaining it. There is no automatic remote
upload or Downloads write. This is development tooling; it does not claim a shipped
player crash-report menu or remote telemetry service.

## Traversal and keyboard gates

```powershell
.venv/Scripts/python.exe -B tools/pipeline/bot.py --pack foundation-demo
.venv/Scripts/python.exe -B tools/check.py bot --pack foundation-demo
```

The CLI probes real browser renditions/hashes/decoding, traverses story choices with
state memoization and explicit budgets, and replays managed gameplay fixtures.
It writes current JSON under `.cache/reports/bot/`. Scope is the complete declared
project graph, including pack dependencies; `--pack` verifies the requested declared
entry exists rather than silently selecting another project. Limits are managed in
`content/pipeline/bot.json`.

Coverage reports seen/total nodes, choices, assets and fixtures, representative
terminal paths, loops, limits, degraded optional assets and unexplored conditions.
Unexplored or failed required resources make the report unsuccessful. A declared
optional fallback/silence is explicit degradation, not invented successful evidence.
Domain traversal does not certify focus or frame rendering. The bot gate separately
runs the maintained native keyboard player journey. Full chapter/branch/release
acceptance remains T14; the current source fixture has one authored choice, while
bot behavior tests also exercise a two-branch pack.

## Verification commands

```powershell
.venv/Scripts/python.exe -B tools/check.py architecture
.venv/Scripts/python.exe -B tools/check.py content
.venv/Scripts/python.exe -B tools/check.py unit
.venv/Scripts/python.exe -B tools/check.py browser
.venv/Scripts/python.exe -B tools/check.py authoring
.venv/Scripts/python.exe -B tools/check.py bot --pack foundation-demo
```

Architecture checks include player import reachability and reject mutation-debug
modules, authoring imports and unresolved dynamic imports. The module scanner is a
conservative literal ES-module check, not a JavaScript compiler. Release packaging
and artifact inclusion checks are T13. Browser timeout reports include requested
paths, process status and stderr; intermittent platform startup failures are not
automatically treated as passes or retried away.
