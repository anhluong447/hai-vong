# Adding a story and gameplay unit

Work in the active checkout. Start the opt-in local authoring server as described
in [RESOURCE-WORKFLOW.md](RESOURCE-WORKFLOW.md). Every source goes through the same
schemas and semantic validation as runtime; previews have separate sessions and
never open player databases. Protected Bible/GDD files remain the authority.

## Sources and stable names

Use namespaced IDs: `actor.chapter.person`, `scene.chapter.place`,
`quest.chapter.subject`, `flag.chapter.decision`, `evidence.chapter.subject` and
`finding.chapter.subject`. Story node and command IDs are anchors within a chapter;
keep them stable across wording, art and layout edits. Choose visible text keys
from locale catalogs. A name or translated label never selects a gameplay rule.

The resource browser opens the relevant inspector. Fields with references use
selects/multiple selects; JSON fields cover structured commands, conditions, flag
declarations and arrays. This is a keyboard flow editor and property inspector;
there is no drag-only graph or separate scripting language. Raw source import is
the complete format fallback and uses the same validation.

## Recipe: NPC → branch → quest → hearing

1. Open the actor source. Export its JSON, add an actor with a unique ID using the
   existing schema shape, assign managed clips, and import the whole candidate.
   Open a scene; add its actor placement and a distinct interaction region. The
   baseline/pivot is visual; the interaction position/range controls interaction.
   A dialogue interaction references a chapter ID. Preview the scene and walk to it.
2. Open a story source. Select its node in the flow list; edit commands using typed
   fields. `say` requires a text key and matching parameters. `choose` needs stable
   choice IDs, existing targets and optional typed flag conditions. `jump` points
   to a node. Every intentional terminal ends with `end`.
3. Select the target flag source and use **Add flag** with a full declaration:
   type, default, run/profile scope and
   enum values or integer bounds when appropriate. A reference to an undeclared
   flag or a value of the wrong type is rejected. To change several mutually
   dependent fields, import a complete valid candidate or use a Workspace group.
4. The branch form selects an existing `choose` command and creates a new terminal
   node plus incoming choice in one operation. There is no temporary orphan node.
   Select that node and replace its command array with dialogue, typed effects and
   a terminal. Existing choice target selects reconnect nodes; undo/redo covers the
   full group. Dead targets and accidental unterminated endings are errors.
5. Open the quest source. Add a full quest definition with unique step/material/
   article/output IDs, date window, prerequisites, costs, schedules and rewards.
   Main and Side are direct work; General may be delegated. Schedule definitions
   reference member, scene, working days and periods. Cost/reward/progression and
   publication inspectors edit the actual runtime definitions, not a preview copy.
6. Side emits `high` Defense cards; General emits `standard`, including delegated
   completion. Each card identifies collected source material and the quest/article.
   Main supplies separate Attack findings. Required Main routes must supply every
   required Boss fact without Side prerequisites. Moving a required finding to
   Side yields `quest.mainRoute.invalid` at the balance route source.
7. Open Defense/Attack definitions. Set accusation type/relevance mappings before
   quality scores, and keep the two evidence stores separate. Attack rounds refer
   to Main findings and declare their recap words, four questions, correct IDs and
   scripted damage. The shared validator rejects broken mapping/progression.
8. Select a managed fixture and hearing checkpoint. The preview earns materials,
   completes quests, advances days, publishes and reaches that checkpoint by
   replaying ordinary commands. Rebuttal and word/question buttons reuse the actual
   player views. Restart creates a fresh session. Edited costs and evidence mappings
   affect the result. Failed guards include the fixture command index; a failed
   fixture replacement retains the previous isolated session.
9. Follow a diagnostic to its exact source/node/property, fix it, and rerun. Validate
   and preview both branches, export/reopen the sources, play the same definitions
   through the keyboard player and save/resume. Save source groups on the authoring
   host or copy the exported JSON; no control writes to Downloads.

## Playtest data and commands

`content/dev/foundation/playtests.json` is a `playtests` document, explicitly
`authoringOnly`. Each fixture has `initial` calendar/energy/scene/spawn, a command
array, and named checkpoints with `after` command counts and hearing IDs. Initial
state uses the normal state/world validators. The replay stops on the first failed
command and reports its JSON pointer. The fixture is test context, never a player
reward shortcut or a change to canonical Boss scheduling.

The gameplay preview accepts one JSON command at a time. For example, start a quest
through `gameplay.command` / `quest.start`, then collect an existing step through
`quest.collect`. Failed actions preserve state. The managed fixture `playtest.fixture.hearing`
starts on day 17, earns Main/Side/General outputs and publishes on day 19 before the
hearing. Choosing `defense.second` replays the preceding response and damage;
`attack.first` reaches its recap with earned Main findings. The output includes
committed state/outcomes and rejected guard diagnostics. Timed actions are manual
steps in this editor; it does not run a hidden simulation loop.

## Version and migration review

Wording/presentation changes retain IDs. Removing/renaming a scene, quest, flag or
story anchor can invalidate existing saves even when source validation passes.
The node-rename form updates its incoming edges and exports an `anchorMap` candidate
for every command in that node. Copy and review that draft; it does not update old
save files or select content versions automatically. Undoing/reworking the rename
also requires reviewing the exported candidate against the final source.
Before a release, bump the content revision and author explicit mappings through
the `SaveMigrationPolicy`/`MigrationRegistry` contracts described in
[PLAYER-SAVES.md](../engineering/PLAYER-SAVES.md). Review anchor maps, flag maps and
typed value conversions; test both the old snapshot and the expected new state.
Unmapped/unknown saves remain exportable and are not silently reset.

Persisted state shape changes also require RunSnapshot schema-version review and
an explicit schema migration. Save envelopes and profiles have separate versions.
Authoring fixtures add no player state field. Editor resource renames update source
references atomically; they do not create save migrations automatically.

## Verify

```powershell
.venv/Scripts/python.exe -B tools/check.py content
.venv/Scripts/python.exe -B tools/check.py unit
.venv/Scripts/python.exe -B tools/check.py authoring
.venv/Scripts/python.exe -B tools/check.py browser
```

See [FIRST-THREE-DAYS.md](FIRST-THREE-DAYS.md) for the real authored acceptance
chapter, workspace-to-source round trip, native routes, traversal and export tests.
The 12-week game remains outside Phase 0.

## Typed gameplay effects and content defaults

Story `emitEffect` can select `gameplay.command` with an `action` and its registered
fields (calendar/home/rest, quest listen/start/collect). `gameplay.assign` takes
`questId` and `memberId`; it obtains a fresh assignment quote
and confirms atomically. These capabilities use the ordinary guards, costs and
transitions, preserving the exact story continuation. Give each effect a stable
`executeOnce` anchor. Failed guards grant no outcome; reload cannot replay a reward.
`src/contracts/GameplayActions.js` is the bounded technical capability contract;
quest IDs, costs, schedule and outcome payloads belong in content.

For additive content revisions, the runtime's `migrationConfigId` selects a
`config.kind = save-migrations` definition. Each `steps` entry declares `from`,
`to`, `addFlags` and `addQuests`; shared validation checks references and a chain
to the current version. The resolver obtains defaults from the new catalogs and
adds only missing entries. Renames/removals require reviewed mappings through the
existing migration interfaces; additive defaults cannot repair removed anchors.
Test an actual old slot, not just a newly fabricated current snapshot.
