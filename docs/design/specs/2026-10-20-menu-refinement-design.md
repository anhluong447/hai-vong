# Coastal menu refinement — approved design

The user approved the in-chat design and explicitly requested a written plan
followed by implementation on 2026-10-20. This records that approved scope.

## Outcome

All six menu tabs share the current Hồ sơ palette, paper, brush, iconography,
typography, scenic layers and wave decorations. Each remaining tab follows its
own reference in `docs/ui-concepts/coastal-editorial-menu-prototypes-v2/`.
The design stage remains 1672 × 941 and scales uniformly.

- Resources: money stays below energy in the sidebar, on one aligned line,
  above the foreground waves; large values must remain readable.
- Skills: authored circular nodes and connecting stems, branch labels and a
  paper detail card. Retain six branches × five ranks. Hide scrollbars; arrow
  navigation automatically reveals the selected node. Enter moves to the learn
  action, Enter confirms, Escape returns to the tree. Disabled/locked actions
  must remain explanatory and must not execute.
- Equipment: six illustrated slots arranged in two columns, paper item detail,
  item preview, real stats and comparisons. Arrows select by spatial direction;
  Enter opens the item picker and confirms an available item; Escape returns
  from the picker to the selected slot. Empty inventories remain navigable.
- Team: portrait strip, large approved character portrait, paper dossier with
  name/nickname, bond, current assignments, stats and biography.
- Map: opaque cream labels; hover/focus uses opaque warm gold with dark text,
  selected labels have a distinct border. Retain existing travel confirmation.
- Settings: illustrated category buttons, layered paper, icons, separators and
  clearly disabled placeholder settings. Existing reduced motion/save/load work.
- Keyboard: Tab/Shift+Tab move between functional regions in this menu, arrows
  select within them, Enter activates, Escape returns/closes. Mouse remains usable.
  Focus must be visible, preserved across rerenders and confined to the overlay.

## Boundaries

Keep gameplay commands through GameSession; no domain, balance, save-schema or
baseline changes. All new player-facing copy belongs in `content/locales/vi.js`.
Presentation metadata belongs in `content/ui/`. Keep original concepts untouched.
Use existing scene art and character registry; decorative Khuê is excluded by
the established concept adjustment. New item illustrations extend the native SVG
asset system. Asset source and exports remain reviewable.

## Acceptance

Native captures for all six tabs and item picker; keyboard-only skill learning
and equip/unequip/cancel; disabled/empty states; map hover with opaque fill; large
money bounds; stable focus after rerenders; reduced motion and lifecycle retained.
Run architecture, main browser suite then baseline, asset checks and focused
menu checks. Record actual results and any environment limitations. Captures do
not certify pixel parity or physical-device 60 FPS.
