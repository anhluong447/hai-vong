import './core.test.js';
import {runAll} from './harness.js';
const results=await runAll();
for(const r of results) console.log(`${r.ok?'ok':'FAIL'} ${r.name}${r.error?'\n'+r.error:''}`);
console.log(`${results.filter(r=>r.ok).length}/${results.length} passed`);
process.exitCode=results.every(r=>r.ok)?0:1;
