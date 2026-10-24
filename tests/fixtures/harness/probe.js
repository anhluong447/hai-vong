import {test,assert,params} from '/tests/harness.js';
test('harness propagates a deliberate assertion failure',()=>assert(!params.has('fail'),'deliberate harness probe'));
