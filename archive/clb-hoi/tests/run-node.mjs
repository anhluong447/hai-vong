// Runs the test suite under Node:   node tests/run-node.mjs [report-file]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runAll } from './all.js';

const contentRoot = new URL('../content/', import.meta.url);
const loadText = (path) => readFile(fileURLToPath(new URL(path, contentRoot)), 'utf8');

const results = await runAll({ loadText });
const failed = results.filter((r) => !r.ok);
const report = [
  ...results.map((r) => `${r.ok ? 'ok  ' : 'FAIL'} ${r.name} (${r.ms}ms)${r.ok ? '' : `\n     ${r.error?.stack ?? r.error}`}`),
  '',
  `${results.length - failed.length}/${results.length} passed`,
].join('\n');

console.log(report);
if (process.argv[2]) await writeFile(process.argv[2], report);
process.exitCode = failed.length ? 1 : 0;
