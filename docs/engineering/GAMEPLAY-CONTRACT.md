# Gameplay foundation (T08)

This is the small technical fixture used to prove gameplay contracts before
production story expansion. The approved Bible/GDD bytes are unchanged. Fixture
members, quests, activities, costs, durations, rewards and scores are not finalized
production balance. There is no full gameplay menu or 12-week authored campaign yet.

## Sources and boundary

`runtime.foundation.gameplayConfigId` selects `content/gameplay/balance.json`.
The balance references typed team, progression and publication definitions. Quests
and NPC schedules have their own catalogs and shared structural/semantic validators.
Player text remains in locales; technical IDs select rules, never translated labels.

`GameSession.execute({type:'gameplay.command', action, ...parameters})` applies pure,
immutable transitions. The browser facade's `execute(command)` also synchronizes
presentation and queues checkpoint saves for committed rewards and day changes.
It rejects mutations while asynchronous restore prepares replacement owners.
Isolated tool/playtest sessions use GameSession directly. Effects registered as
`gameplay.activity` invoke the same managed activity through the story effect ledger.
No domain module reads a browser clock or owns storage/rendering.

| Catalog | Owns |
| --- | --- |
| `balance` | Calendar periods/days, working days, energy 10/5, player ID, cost floor and required Main routes |
| `quests` | Ordered material steps, source schedules, costs/floors/skills, prerequisites, article inputs, evidence/findings and rewards |
| `team` | Member availability, base stats, declared one-time operating fee and feedback keys |
| `schedules` | NPC scene and day/period availability for direct material collection |
| `publication` | Automatic weekday/period, score formula factors and caps |
| `progression` | Six stat IDs, skill thresholds/modifiers, equipment/consumables, activities, bond caps and starting wallet |

Schemas live in `src/contracts/schemas/`; editor, build and runtime use the same
`validateProject`. Quest diagnostics identify the actual document and JSON pointer.
Validation rejects missing evidence/material provenance, wrong quality, cross-phase
ID reuse, invalid schedules/costs, cycles and required Main routes depending on Side
or General. An invalid source is never a playable alternative interpretation.

## Calendar, energy and work

The calendar is action-driven: morning -> afternoon -> evening -> night. Walking,
rendering and idle reading spend no energy or days. Weekday morning ends through
the school/story action; weekend morning is free. Both fast return and walking home
create a pending confirmation. Cancel preserves the period; matching confirmation
changes it. Return/rest remain available at zero energy. Period changes do not refill.

Sleep sets next-day energy to 10; study/game set it to 5 regardless of leftovers.
Night study/game use declared benefits and no old-day energy charge: their explicit
fixture tradeoff is the next-day reduction. Day 84 ends without creating day 85.

General assignment requires listening, selecting a member, inspecting the quote
and confirming its identity. Listening/assignment energy and one-time fees are
managed data. Stale quotes and insufficient funds/energy fail atomically. Main/Side
can only be performed by the player; self-General keeps standard evidence quality.

The fixture processes delegated work once on entry to each new day. Assignment
starts on subsequent working days, so Friday + two workdays quotes Tuesday.
Weekend feedback says resting, with zero progress. An unsuitable worker reports
blocked and no invented ETA. Gear/skill changes affect real capacity; daily feedback
recomputes remaining work and ETA. This coarse daily policy is provisional; it does
not claim a simulation of worker movement or exact intra-day NPC meetings.

Direct steps check the declared source scene, day and period before charging energy.
Costs may decrease with skill, while managed per-step floors preserve positive costs
and keep the complete self-General path cheaper than Main/Side even at high skill.
Feedback never needs acknowledgement before sleep and never grants rewards on read.

## Completion and publication

Complete materials commit the quest, once-only ledger, performer XP, optional items,
concrete evidence and automatic article handoff together. Side cards are high,
General cards standard, independent of performer. Main produces separate Attack
findings and no Defense cards. Separate IDs/material provenance identify both stores.

Completion does not itself increase audience. The fixture publishes automatically
on Friday afternoon, including new handoffs during that period. Late Friday handoff
waits for the next Friday. No player writing/editorial/queue-approval/publish action
exists. The reference score uses attraction, exploitation/verification, article type,
packaging and a cap; all factors remain managed/provisional. Team skill can affect
article input while evidence quality remains determined by quest type.

Defense eligibility includes only unused archived cards linked to articles published
inside the requested hearing window. Publication neither deletes nor duplicates
cards. Replay, feedback, save/load and duplicate completion cannot award XP/items/
cards/audience twice. Hearing consumption and relevance rules extend this in T09.

## Progression and persistence

There is one wallet. Activities, operating fees and purchases validate energy and
money before committing. Skill XP levels and equipment modifiers derive effective
stats; equip/unequip/load never stack them into base stats. Consumables cap recovery
at the shared energy maximum. Personal hangouts affect one bond; collective bond
is limited to Main rewards and explicit special events. Direct repeatable actions
require an execution identity; replaying the same identity has no second cost/reward.

RunSnapshot is now version 2 with `formatTag: hoi-am.side-scroll`. The gameplay block
adds calendar, energy, wallet, members, quests, delegated jobs/feedback, queued and
published articles, audience, evidence and progression. Shared validation checks
IDs, bounds, quest/material/ledger consistency, evidence origin, equipment ownership,
article linkage and audience totals before live replacement or slot writes.

`SaveMigrationPolicy` explicitly upgrades the known untagged Phase-0 v1 shape with
nested missing-field defaults from current definitions. Existing flags, cursor,
world, presentation and ledger survive. Tagged unknown legacy saves and 3D coordinate
layouts remain export-only. Envelope/profile versions are separate. Future content
renames or balance revisions still require release-specific migration review.

Tests use `tests/fixtures/foundation/gameplay.json` with the actual managed content.
The real-browser round trip covers delegation across a weekend, completion, publication
and next-day autosave. Full suite reports record actual runs under `.cache/test/`;
this contract alone is not acceptance evidence for later hearing/editor/release work.
