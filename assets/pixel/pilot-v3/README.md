# Khuê in-game walk trial

2026-10-06. Active left-walk trial, 256×384. Restored after the expanded [pilot-v4](../pilot-v4/README.md) was rejected for distorted artwork. This is the previous trial, not a completed four-direction replacement.

Only row 1 (zero-based), the eight-frame left walk, is replaced with the contraction/expansion cycle from `../walk-cycle-probe/`. Its upper 24px use the approved left idle master from pilot-v2, exactly matching the probe's head-lock preview; lower 24px are the generated cycle after fixed-canvas/palette import. Pose geometry was not altered during packing.

Right/up/down walk and all idle/talk rows remain pixel-identical to `../pilot-v2/khue.png`. No mirrored right-facing animation was fabricated: the pilot includes only the left-facing direction. Vân retains pilot-v2. Original sheets remain available for rollback.

Rebuild with `tools/install_walk_cycle_probe.ps1` after importing the probe. Generated sources, nine prompts and motion limitations are recorded in `../walk-cycle-probe/README.md`. The sheet is an in-game trial, not a production-approved character set.

Movement speed, 48px walk-cycle distance, collision pivot, saves and gameplay remain as before. The probe's 40px/s and 32px/cycle demonstration settings were not applied to the game.
