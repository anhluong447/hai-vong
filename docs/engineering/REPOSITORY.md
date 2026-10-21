# Git and local asset policy

Git stores the game's JavaScript, HTML, CSS, content and translations, tests and
baselines, reusable authoring tools, architecture/development documentation,
small SVG art, JSON manifests, generation prompts and license records.

Binary images, audio/BGM (including MIDI and soundfonts), fonts, videos, large
authoring files, packaged builds, captures and temporary files stay local.
Plans/roadmaps and generated `docs/ui-reviews/` evidence also stay local;
review README files remain tracked. The historical `archive/clb-hoi/` snapshot
is preserved under the project instructions.

Removing these files from the Git index does not remove them from the current
working directory. Keep a separate backup of local assets and generation inputs;
GitHub no longer backs up later changes to ignored files. Git has no native
size-based ignore rule, so these rules use file types and output directories.

## Setting up another machine

A fresh clone needs the local asset pack at the same relative paths before
visual previews, asset builders and the full browser suite can work. Copy it
from your development backup. Missing plan/reference/review files are local
authoring documents; some links in development documentation require that pack.

`repository-local-files.json` inventories previously tracked files removed by
this cleanup, their local byte sizes and SHA-256 hashes. It also records the Git
revision holding their earlier committed versions. Newly created ignored files
are not included in that historical inventory.

The inventory retains paths from that historical cleanup. Documentation moved
again on 2026-10-21; see the current [documentation index](../README.md) and
[move/delete inventory](../maintenance/2026-10-21-reorganization.json).

If a local backup is unavailable, extract an earlier committed file without
changing the current checkout (replace the sample path):

```powershell
git archive --format=zip --output="$env:TEMP/ask-local-asset.zip" fec64cd -- assets/pixel/characters-anime.png
Expand-Archive -LiteralPath "$env:TEMP/ask-local-asset.zip" -DestinationPath . -Force
```

Earlier committed bytes can differ from the inventory's local working bytes.
The inventory's hash verifies the local version present during cleanup.

## Repository size

This policy reduces the files tracked at the latest revision and prevents future
binary churn. Existing binaries remain in older Git commits, so an ordinary
full clone still downloads that history. Use a shallow clone when appropriate:

```powershell
git clone --depth 1 https://github.com/anhluong447/hai-vong.git
```

Rewriting published history is a separate migration and is not part of this
cleanup. Assets needed to distribute a playable game belong in a separately
backed-up asset pack and packaged release.
