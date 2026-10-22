# Phase 0 contracts

T01 establishes executable checks and protocol shapes; it does not claim a playable world.

The browser executes ES modules directly. Python 3.12+ provides hosting and orchestration.
Use `HOIAM_BROWSER` to override the detected local Chrome/Edge/Chromium executable.
The harness launches a fresh profile on an ephemeral loopback server; a tokened POST
collects JSON results. Empty suites, timeouts and module load failures fail the run.
No Node, package manager, downloaded browser or dependency install is required.

## Boundaries

Domain consumes contracts and domain; application consumes domain/contracts. Concrete
browser/resource/storage adapters are wired only at bootstrap through explicit ports.
Presentation sends commands and consumes state/outcomes. No global service locator.
`Diagnostic`, `Result`, `ContentBundle`, `RunSnapshot`, `SaveEnvelope` JSDoc shapes live
in `src/contracts/`; version constants there are protocol values, not balance data.

Story opcodes are centralized in `Commands.js`. New opcodes require schema, handler,
validator, editor and save-semantic review. Authored content is JSON, never executable JS.
Details and save cursor anchors follow the Phase 0 plan section 3.

## Running checks

First bootstrap with `python -B tools/setup.py`. Every `python` command below means
the private `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python` (POSIX).
Global/user package imports are forbidden. Temporary files, pip/tool caches and
test browser profiles live inside this checkout's `.cache/`, never system TEMP or
the person's browser profile. Do not install project tools or skills outside the
project, change PATH/registry, or rely on an external package install.

`python tools/check.py architecture` scans layer imports/cycles, inner browser APIs,
obvious literal UI copy/asset URLs and direct view mutation. This is a conservative
lexical guardrail, not proof of purity or completeness; behavioral tests and review
remain mandatory. Deliberate violations are exercised in Python tests.
`python tools/check.py unit` runs Python tests and discovered browser unit modules.
Requested unfinished suites return nonzero `not-implemented`; `all` includes every gate.
`python tools/dev.py --port 8080` serves read-only sources on loopback with no write API.
Internal/archived paths and traversal are denied; browser profiles/results are temporary.

## Initial capability evidence

Windows/Python 3.12.10; local Chrome and Edge available, Node absent in PATH.
Runtime requires ES modules, structuredClone, Canvas2D, DOM, IndexedDB, Web Audio
and Intl.Segmenter. The initial automated browser family is Chromium (minimum major
120 in toolchain metadata); a pinned CI browser and Firefox smoke evidence arrive T13.
Asset tool choices remain empty until T05 measures actual conversion inputs/outputs.
