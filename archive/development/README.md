# Development archive

The 2026-10-09 refactor relocated 40 historical PNG review images from `tools/`
and five completed one-time migration/inventory scripts. `manifest.json` records
their original paths, new paths, sizes and SHA-256 hashes. All 45 relocated files
were verified after moving. The link-update script is stored beside the migration
record as well.

`reviews/` contains evidence from earlier map, dialogue and animation checks.
Current docs link here, and dialogue review generators write their output here.
`migrations/2026-10-09/` records the transformation used for this refactor. These
are historical one-time scripts; do not rerun them against the migrated tree.

Active game assets, original art sources, reusable tools, tests and baseline reports
remain outside this folder. The separate `../clb-hoi/` legacy snapshot is unchanged.
