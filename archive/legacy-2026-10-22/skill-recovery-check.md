# Recovery-skill validation

Date: 2026-10-22. Read-only agent probes; no product implementation or external action.

## Baseline without the new skill

A fresh-context agent read the discoverable root instructions and legacy documentation. It recovered "continuing the gradual move to a fully 3D web game with mesh environments and characters" and the isolated `world3d.html` newsroom milestone, while preserving the coastal UI.

That is a faithful reading of the former files but fails to recover the user's newer decisions from this conversation. Evidence cited by the probe included the old `docs/design/README.md`, the 2026-10-21 3D foundation design and the old world3d review.

## Forward check with the skill

A separate fresh-context agent read the new skill and project state. It recovered:

- Engine-free hand-drawn/anime 2D side-scrolling exploration.
- Desktop browser, complete keyboard operation, optional mouse, redesigned UI.
- Foundations/tooling first; 12 weeks as the eventual product goal.
- Author NPC/dialogue/quest, bind resources, validate, play, save/resume, rerun safely, diagnose broken references and restore source assets as the foundation acceptance workflow.
- Protected narrative/gameplay documents, resource/tool scope and strict stop after verified archiving.

It correctly identified that archiving was still in progress, not complete. It flagged a possible ambiguity between repository-relative and skill-relative links; the skill was amended to distinguish them explicitly. It also flagged stale coastal instructions at the root; those instructions are archived and replaced by the new root recovery pointer.

## Structural validation

The bundled skill validator could not run because PyYAML is absent. No dependency was installed for this task. The included dependency-free check validates this skill's simple frontmatter, naming, local links, UI metadata and installed/source SHA-256 equality. Its report is `skill-verification.json`.
