import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
// One real I/O read per harness; each domain case receives independently mutable data.
// Loader/decoder and native browser suites continue to exercise their actual I/O.
const original=loadProject('/content/project.json');
export async function projectSource(){return structuredClone(await original);}
