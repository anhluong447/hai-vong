# Hearing foundation contract

T09 is a technical fixture of the approved Defense/Attack rules. Production Boss
content remains at week 3, end of week 7 and week 12. No production art or final
balance is established by these fixtures.

## Data and ownership

`content/gameplay/hearings/` declares Defense accusations, evidence relevance,
ethics choices, Attack recaps/words/questions, required Main findings, scripted HP,
projectile schedules, atmosphere and provisional tuning. JSON schemas and shared
`validateHearings` validate both source and cross-references. `content/ui/hearing.json`
owns UI references, field geometry and tokens; all copy resolves through locales.
The presentation views receive resolved data and emit `hearing.command` intents.

`GameSession` owns immutable hearing transitions. Other world, story and gameplay
commands are rejected while a hearing exists, including its terminal screen.
Main facts are preflighted before Defense; Attack never depends on optional cards.
Successful hearings dismiss explicitly. Defense defeat retains load/main-menu
recovery rather than introducing an undocumented restart policy.

## Defense

Accusation damage happens before choosing one card. Relevance is resolved before
quality; a wrong high-quality card cannot produce a Win. Published Side/General
articles yield separate high/standard Defense cards. Main findings are separate.
Card use and its discard commit together. Empty archives apply the declared Lose
penalty without presenting a phantom choice. Scores clamp to the authored bounds.

The first bottom triggers a one-use ethics bailout. A successful pre-response
bailout resumes the current response; a post-response bailout resumes after the
committed card use. The explicit pipeline in Defense section 4 governs the
conflicting continuation sentence in section 6.2. A second bottom defeats
immediately. Ending above zero automatically transfers the tiered 0/1/2 bonus
hearts and atmosphere to Attack. The +50 Side/+20 General Win table is provisional.

## Attack and time

Wrong words/questions cost half a heart; wrong questions lock. Correct replies
consume required Main findings already represented in their authored questions
and apply fixed HP damage. Exactly 50% remains the first phase; below 50% triggers
BGH confrontation. All flaws must be resolved before crash out. Fixture mercy
restores three hearts at the current round, retains solved HP and replays recap;
the GDD leaves this recovery tuning open.

Normal is the default two-lane, explicit-block mode. Easy blocks automatically in
the matching lane. Thirty seconds of active play uses independent mini HP. Failure
retries the mini only. Final Shot lasts three seconds and wins with zero taps.
These durations/lanes are fixture choices within the GDD's permitted ranges.
All active timers are serializable domain values. Pause, browser blur/visibility,
capture and restore do not advance them; resume does not catch up absent time.

## Keyboard and saves

Native buttons support Tab/Shift+Tab and Enter/Space. During the mini, managed
bindings provide W/Up, S/Down, Space deflect and Escape menu. The field has its own
focus target. Focus is trapped in the hearing, relinquished to pause/settings and
returned to a surviving hearing control on resume. Mouse buttons issue the same
intents. Remapping identifies each action's context.

RunSnapshot **3** adds `gameplay.hearing`. The explicit tagged-v2 migration adds
only a missing null hearing; the known v1 side-scroll migration chains through v2.
Unknown legacy/3D shapes remain export-only. Envelope/profile versions remain
separate. A declared input-definition prefix `[11]` extends known old remaps with
new defaults, preserving old codes; reordered or ambiguous definitions reject.

Snapshots retain accusation history, pending bailout continuation, used cards,
word/locked questions, solved prefix, hearts/HP, mini mode/time/lane/projectile
ownership and Final Shot time/taps. Shared validation reconstructs Defense history
through pure commands and validates authored Attack progress and projectile ownership
before session replacement. Hearing checkpoints autosave; ticks, moves, blocks and
taps do not generate per-frame saves. Victory's flag/receipt commits once.

## Verification scope

Focused tests cover relevance/quality, bailout timing, clamps/heart tiers, empty
cards, wrong-answer locking, recovery, scripted phase thresholds, independent mini
HP/retry, Easy/Normal and cadence boundaries. Native browser tests traverse the full
hearing with keys, resume damage/card/word/question/projectile positions, pause and
simulate the document visibility boundary. That simulation is not a physical OS
background-tab measurement. Browser screenshots remain development fixture evidence.
