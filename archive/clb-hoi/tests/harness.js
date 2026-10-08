/**
 * Dependency-free test harness that runs in the browser (tests/index.html)
 * and in Node (tests/run-node.mjs).
 */
const registry = [];

export function test(name, fn) {
  registry.push({ name, fn });
}

export const assert = {
  ok(value, message = 'expected truthy value') {
    if (!value) throw new Error(message);
  },
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message ?? `expected ${fmt(expected)}, got ${fmt(actual)}`);
    }
  },
  deepEqual(actual, expected, message) {
    if (!deepEqual(actual, expected)) {
      throw new Error(message ?? `expected ${fmt(expected)}, got ${fmt(actual)}`);
    }
  },
  throws(fn, pattern, message) {
    try {
      fn();
    } catch (err) {
      if (pattern && !pattern.test(err.message)) {
        throw new Error(message ?? `error "${err.message}" does not match ${pattern}`);
      }
      return err;
    }
    throw new Error(message ?? 'expected function to throw');
  },
};

/** @param {object} context passed to every test (e.g. { loadText }) */
export async function runAll(context = {}) {
  const results = [];
  for (const { name, fn } of registry) {
    const started = Date.now();
    try {
      await fn(context);
      results.push({ name, ok: true, ms: Date.now() - started });
    } catch (error) {
      results.push({ name, ok: false, ms: Date.now() - started, error });
    }
  }
  return results;
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => deepEqual(a[k], b[k]));
}

const fmt = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};
