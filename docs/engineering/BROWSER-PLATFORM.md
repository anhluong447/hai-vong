# Browser platform contract (T06)

Run from the active implementation checkout, currently `.worktrees/phase-0`:

```powershell
.venv/Scripts/python.exe -B tools/dev.py --port 8080
```

The player is at `http://127.0.0.1:8080/`; JSON authoring remains at
`/tools/workspace/index.html`. Authoring writes still require `--authoring`.
Use the private venv; tools, profiles, screenshots and caches stay inside project.

## Scene and coordinates

`content/project.json` selects a runtime configuration. That definition references
the initial scene/spawn, actor, movement tuning, input catalog, UI and audio buses.
The development pack uses a logical 960 by 540 viewport. This is a reviewable
geometric fixture, not the final art, palette or typography approval.

Scenes declare bounds, spawn positions, floor baseline, layers/parallax, optional
ambient motion, foreground layers, actors, decorations and interactions. Actor
clip pivots attach sprites to their feet; interaction radii are independent.
Scenes/actors/input/sequences have checked-in schemas and shared semantic validation.
Register a new technical action/handler before authoring its use; unknown actions fail.

GameSession owns movement, range checks, story entry and scene transitions. Walking
uses supplied presentation seconds and cannot mutate gameplay flags/calendar/energy.
The browser clock caps catch-up and resets after blur/hidden state. Input sampling,
domain movement and drawing are separate. A bounded camera follows world units;
CanvasAdapter alone maps logical coordinates through CSS letterboxing to device pixels.

Scene request keeps the committed world intact. World2D prepares a resource lease,
then a matching session receipt and view commit replace the scene. Any subsequent
prepare, including a failed lookup, invalidates older candidates. Every scene has
explicit load ownership and disposal; the world adapter consumes AssetService ports
directly for its single prepared group rather than adding another manager framework.

## Keyboard, text and presentation

Physical defaults live in `content/input/defaults.json`. The fixture uses arrows/A/D,
E/Enter, Escape and F. Context changes, composition and blur clear held keys; repeats
do not retrigger actions. Native buttons retain Tab/Enter defaults. FocusRouter owns
modal nesting, boundary wrapping and opener restoration.

Text comes through TextService. Locale entries contain either `value` or bounded
`runs` with `text`, `strong`, `emphasis` kinds and parameter declarations. Rendering
uses text nodes and permitted elements; authored HTML never executes. TextView uses
graphemes for reveal, can snapshot/restore reveal progress, and waits for font readiness
before measuring reflow. System-font fallback is exercised; no custom font asset or
font converter is claimed. The earlier corrupted development locale was repaired to
UTF-8, with independent Unicode escape expectations in tests.

AnimationPlayer has data-owned timing/pivots and explicit pause, completion, loop,
clip replacement, snapshot/restore and disposal. SequencePlayer consumes data-owned
tween/wait/cue/scene steps; scene steps await matching receipts. Skip/cancel cannot
grant gameplay outcomes or duplicate already emitted signals. The fixture entry
sequence drives the curtain and cue through bootstrap ports. Motion can be reduced.

AudioAdapter owns Web Audio nodes and leases. Buses, loop points, gains and fades
are authored. Cue intent/offset survives an unsuccessful resume; a user gesture can
retry. The tests inject a NotAllowedError at the resume boundary, then use a trusted
key event and real AudioContext for loop, mute/gain, crossfade and resource cleanup.
All save/restore operations on adapters are serialized by their application caller;
the whole-runtime transactional save service is T07, not supplied by this adapter.

## Snapshot review and evidence

RunSnapshot version 1 retains its existing fields. `world.pending` and `world.moving`
are optional additions; old uninitialized-world snapshots still validate. Replacements
now reject undeclared scene IDs, out-of-bounds positions and invalid facing/spawns.
Earlier codec tests using imaginary scene names were replaced with declared fixtures.
Legacy 3D coordinates are not treated as compatible side-scrolling positions.
Adapter snapshots contain IDs/numbers/booleans, never Canvas, images or AudioNodes.
T07 must compose them into atomic capture/restore, migrations and persistent slots.

Automated browser tests cover keyboard exploration/dialogue/door/pause, stale loads,
repeated entry/disposal, text, focus, IME, timing, animation, audio and timeline behavior.
The real-page display probe uses a headless browser viewport of 1280 by 1000 at DPR 2:
canvas CSS 1068 by 600.75; backing store 2136 by 1202. Its PNG is saved by the tokened
harness to `.cache/test/screenshots/8fdb99069a1ca48e.png`. This is actual browser layout
and raster evidence, separate from injected-time movement tests; it is not physical
monitor/FPS or low-spec performance evidence. Performance/release gates remain T13.
