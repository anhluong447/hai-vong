# G1 Review B R1 — integration and verification

Status: implementation integrated; verification in progress. Art/game-feel approval
still belongs to the user. G1 remains open; no G2 work is authorized by this report.

Normal player entry now uses content **0.0.4** and RunSnapshot **4** (envelope **1**).
New Game still starts at the Gate in the morning with original flags, costs and
story order. [C2](../art-direction/review-b-r1/c2/README.md) remains a separate save
namespace and starts at Room3 only for tuning.

| Director criterion | Implemented evidence | Acceptance limit |
| --- | --- | --- |
| Independent desk / occlusion | Managed props and stable authored depth; native opaque/hole tests; C1 desk toggle | Composition still needs final user review |
| Waist-height furniture / floor contact | Desk64 units, door205, eye-line board; managed furniture and actor shadows | Final art judgement pending |
| Soft camera | Delta-time follow and1.07 encounter zoom; blur rendition; new/legacy restore and actual authoring reload | User comfort/tuning pending |
| Acceleration / natural stop | Pure exact integration: .09s acceleration, .08s stop, 160units/s, 96unit cadence | Proposed tuning, not user-approved final values |
| Wood footsteps / no First3 tone | Four CC0 recorded-shoe cuts prepared with scene; isolated foundation tone preserved | User listening review pending; silence is not finished BGM |

The support-foot renderer uses optional authored sole anchors and a knee line to
deform lower legs on an integer native canvas. It preserves original atlas bytes
and gameplay positions. Actual atlas-pixel checks in both directions sample96
positions per plant: worst drift **1 logical pixel**, within the2unit target.
This proves the measured sole edge; it does not approve the appearance of the
deformed six poses. Native buffer399,360bytes, released with actor.

R07 checks run: all JS units **176/176**; focused authoring **7/7**, including actual
zoom/context reload, pixel furniture preview, day restart, foley and superseded
reload while foley fetch is pending. Real authenticated grouped source writer
**1 Python test** passes: scene/clip/preset reopen, stale hash and invalid reference
leave all good source bytes intact. Source creation templates share runtime validation.

Fresh `.cache/tmp/r1-recovery-20261027` started without sources, exports or venv.
Its own offline private venv restored64 source files from V2 and rebuilt49 outputs
byte-identical to active outputs. Repeat build rebuilt nothing; bundle bytes and
audit match. V1 remains separate. Raw proof: own plan ledger `r07-recovery.json`.

Native New Game → office/classroom → corridor → Room3 check passes, including
prepared furniture/foley, save/load at dialogue zoom, exactly-once notice material,
day2 and three repeated home/Room3 trips with stable resources; dispose returns0.
Full CI, static artifact, final review and additional performance proof are pending.

Initial Room3 real-RAF measurement:180 intervals each, Chromium156 headless with
GPU disabled, viewport1280×1100, logical960×540. Reference p95 idle16.7ms,
walk16.8ms (180 moving frames). CPU4x idle/walk p9550.1ms: **FAIL** versus33.34ms;
the walk sample reached a bound and had47moving frames, so a reset-position run is
still required. These are CPU-throttle simulations, not physical low-spec hardware
or fullscreen measurements. Keep this miss visible even if functional CI passes.
Active scene image estimates22,699,952RGBAbytes, atmosphere cache2,764,800bytes,
18dust particles;19resources/19references/0pending, all0afterdispose. These are
owned buffer/resource counts, not retained browser heap measurements.

Historical captures and failed test reports remain in this plan's own ledger.
Do not treat earlier C1/C2 receipts as current-source certification.
