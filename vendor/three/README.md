# Three.js — pinned local runtime

Version **0.180.0 / r180**, MIT license. Upstream:
https://github.com/mrdoob/three.js/releases/tag/r180

`r180/three.module.js` imports `r180/three.core.js`; both are vendored unchanged.
The included LICENSE and [inventory](INVENTORY.json) record upstream URLs,
byte counts and SHA-256 hashes. Game startup requires no CDN, Node or bundler.
Keep the files from this release together when updating. Do not modify upstream
modules to change game behavior; adapters belong under `src/world3d/`.
