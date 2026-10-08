import { test, assert } from './harness.js';
import { parseCondition, evaluate, ConditionError } from '../src/core/state/conditions.js';

const values = {
  'flag.metLong': true,
  'flag.silence': false,
  'bond.van': 3,
  'stance.sincere': 2,
  'stance.avoid': 1,
};
const resolve = (path) => values[path.join('.')];
const run = (src) => evaluate(parseCondition(src), resolve);

test('conditions: flags and negation', () => {
  assert.equal(run('flag.metLong'), true);
  assert.equal(run('!flag.silence'), true);
  assert.equal(run('flag.unknown'), undefined);
});

test('conditions: comparisons and precedence', () => {
  assert.equal(run('bond.van >= 3'), true);
  assert.equal(run('bond.van > 3'), false);
  assert.equal(run('stance.sincere > stance.avoid && flag.metLong'), true);
  assert.equal(run('flag.silence || bond.van == 3'), true);
  assert.equal(run('!(bond.van < 2)'), true);
  assert.equal(run('flag.silence && bond.van == 3 || flag.metLong'), true);
});

test('conditions: missing values compare as zero', () => {
  assert.equal(run('bond.nhi == 0'), true);
  assert.equal(run('bond.nhi < 1'), true);
});

test('conditions: string literals', () => {
  values['flag.mood'] = 'angry';
  assert.equal(run('flag.mood == "angry"'), true);
});

test('conditions: reject unknown roots and bad syntax', () => {
  const roots = ['flag', 'bond'];
  assert.throws(() => parseCondition('bnod.van > 1', { roots }), /Unknown "bnod"/);
  assert.throws(() => parseCondition('bond.van >', { roots }), /Unexpected end/);
  assert.throws(() => parseCondition('(flag.a', { roots }), /Missing "\)"/);
  assert.throws(() => parseCondition('flag.a $ 1', { roots }), /Unexpected character/);
  assert.ok(new ConditionError('x') instanceof Error);
});
