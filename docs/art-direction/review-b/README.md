# G1 playable Review B

Status: current-source and static checks verified; user visual approval pending.

Run from the active checkout:

```powershell
.venv/Scripts/python.exe -B -X utf8 tools/dev.py --port 8080
```

Open http://127.0.0.1:8080/. Start a new game; use A/D to walk, E to interact,
Enter to reveal/advance, and Escape for the menu. Follow the existing first-day
route through the office, classroom and corridor to Room 3. No debug flags are
needed. The genuine old-save fixtures in `tests/fixtures/g1/` can also be imported
through the save menu to inspect exploration or the partial Van warning.

[Window capture](window.png) and [large-text capture](large.png) come from the
native keyboard journey against the actual player runtime. They show the same
warning with the managed portrait, standing sprites, layers and token-driven UI.
The large capture uses a 1920x1080 browser viewport and 27px text. It is a viewport
emulation, not proof of the browser Fullscreen API. Actual fullscreen appearance
still needs a human check.

Review the coastal-school atmosphere, sprite density/proportions and scale,
face readability, animation at the playable size, and the dialogue panel. Review A
selected 192px visible native height / 152 logical display height, Van at 92%.
Review B has not been approved by a screenshot or automated test.

The room uses three independent layers; furniture/props are part of the interior
layer. Actual background masters are about 1930x814. The remaining locations,
later-day generic NPC, synthetic audio and broad HUD/menu styling remain fixtures.
Speaker prefixes still in the original dialogue copy are retained intentionally.
Dynamic lighting, complete cast/maps, music and final UI belong to later goals.

The measured native window run accounted for 22,175,640 bytes of world RGBA image
surfaces plus a 1,048,576-byte portrait canvas. This excludes decoder overhead,
duplicate preparation surfaces, GPU memory and audio; it is not total process RAM.
Four authored day-two room round trips stayed at seven resources / eight references,
with zero pending loads; disposal returned all three counts to zero. Controlled
step CPU samples (120) measured about 0.1ms median / 0.2ms p95 on this Windows
Chromium 156 run. These are CPU samples with a controlled clock, not live FPS or
lower-spec hardware certification. Scene arrival including the door-walk procedure
was about 97-99ms in the local run; this is not a network cold-load benchmark.

Raw local reports live under the G1 scoped execution ledger (`t08-*.json`). Final
gate/static artifact evidence and any review findings are recorded in
[G1-ART-ACCEPTANCE.md](../../testing/G1-ART-ACCEPTANCE.md).
