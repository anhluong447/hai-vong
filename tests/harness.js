const tests = [];
export function test(name,run) { tests.push({name,run}); }
export const assert = {
  ok(value,message = 'Expected truthy value') { if (!value) throw new Error(message); },
  equal(actual,expected) { if (!Object.is(actual,expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
  near(actual,expected,tolerance = 1e-8) { if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) throw new Error(`Expected ${expected}, got ${actual}`); },
  throws(fn,pattern) { try { fn(); } catch(error) { if (pattern && !pattern.test(error.message)) throw error; return; } throw new Error('Expected exception'); },
};
export async function runAll({onProgress=()=>{}} = {}) {
  const results = [];
  for (const test of tests) { onProgress(test.name); try { await test.run(); results.push({ name:test.name,ok:true }); } catch(error) { results.push({ name:test.name,ok:false,error:error.stack }); } }
  return results;
}
