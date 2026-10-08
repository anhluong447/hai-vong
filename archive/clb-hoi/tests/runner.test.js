import { test, assert } from './harness.js';
import { parseScript } from '../src/core/script/ScriptParser.js';
import { ScriptRunner } from '../src/core/script/ScriptRunner.js';
import { GameState } from '../src/core/state/GameState.js';
import { Profile } from '../src/core/state/Profile.js';

function setup(source) {
  const program = parseScript(source, { file: 'test.vns' });
  program.meta = { season: 'autumn', ...program.meta };
  const state = new GameState();
  const runner = new ScriptRunner({ state, profile: new Profile() });
  runner.start('t', program);
  return { runner, state, program };
}

test('runner: state ops run silently, presentation ops are returned', () => {
  const { runner, state } = setup('@flag a\n@bond van +2\nHello\n@bond van -1\nBye');
  const first = runner.next();
  assert.equal(first.type, 'say');
  assert.equal(first.line.text, 'Hello');
  assert.equal(state.flags.a, true);
  assert.equal(state.bonds.van, 2);
  runner.next();
  assert.equal(state.bonds.van, 1);
  assert.equal(runner.next().type, 'end');
});

test('runner: conditions select branches', () => {
  const { runner } = setup('@bond van +3\n@if bond.van >= 3\nHigh\n@else\nLow\n@endif');
  assert.equal(runner.next().line.text, 'High');
  assert.equal(runner.next().type, 'end');
});

test('runner: choice records stance and jumps', () => {
  const { runner, state } = setup([
    '@choice',
    '> [THẬT LÒNG] "Yes" -> yes',
    '> [NÉ TRÁNH] "No" -> no if flag.never',
    '@endchoice',
    '== yes', 'Chose yes', '@end',
    '== no', 'Chose no',
  ].join('\n'));
  const choice = runner.next();
  assert.equal(choice.type, 'choice');
  assert.deepEqual(choice.options.map((o) => o.index), [0], 'hidden option filtered out');
  assert.equal(runner.next().type, 'choice', 'choice blocks until resolved');
  runner.choose(0);
  assert.equal(state.stances.sincere, 1);
  assert.equal(runner.next().line.text, 'Chose yes');
  assert.equal(runner.next().type, 'end');
  assert.throws(() => runner.choose(0), /No pending @choice/);
});

test('runner: explore "on" handlers return to the explore, "exit" leaves', () => {
  const { runner, state } = setup([
    '@explore',
    '  on sign -> sign_first if !flag.readSign',
    '  on sign -> sign_again',
    '  exit door -> outside',
    '@endexplore',
    '== sign_first', 'A sign.', '@flag readSign', '@return',
    '== sign_again', 'Same sign.', '@return',
    '== outside', 'Outside.',
  ].join('\n'));
  let cmd = runner.next();
  assert.equal(cmd.type, 'explore');
  assert.deepEqual(cmd.handlers.map((h) => h.hotspot), ['sign', 'door']);

  assert.ok(runner.interact('sign'));
  assert.equal(runner.next().line.text, 'A sign.');
  assert.equal(runner.next().type, 'explore');
  assert.equal(state.callStack.length, 0);

  runner.interact('sign');
  assert.equal(runner.next().line.text, 'Same sign.');
  assert.equal(runner.next().type, 'explore');

  assert.equal(runner.interact('nothing'), false);
  runner.interact('door');
  assert.equal(runner.next().line.text, 'Outside.');
});

test('runner: scene inherits time/weather/season and clears the cast', () => {
  const { runner, state } = setup('@scene gate time=dusk weather=fog\n@show long\n@scene hallway\nx');
  const a = runner.next();
  assert.deepEqual(a.scene, { location: 'gate', time: 'dusk', weather: 'fog', season: 'autumn' });
  runner.next();
  assert.deepEqual(Object.keys(state.cast), ['long']);
  const b = runner.next();
  assert.deepEqual(b.scene, { location: 'hallway', time: 'dusk', weather: 'fog', season: 'autumn' });
  assert.deepEqual(state.cast, {});
});

test('runner: resume re-presents the current line', () => {
  const { runner, state, program } = setup('@bond van +1\nOne\n@bond van +1\nTwo\nThree');
  runner.next();
  runner.next(); // "Two" is on screen
  const saved = JSON.parse(JSON.stringify(state.toJSON()));

  const restored = GameState.fromJSON(saved);
  const again = new ScriptRunner({ state: restored, profile: new Profile() });
  again.resume(program);
  assert.equal(again.next().line.text, 'Two');
  assert.equal(restored.bonds.van, 2);
  assert.equal(again.next().line.text, 'Three');
});

test('runner: starting at a label rebuilds the stage from earlier instructions', () => {
  const program = parseScript([
    '@scene gate time=dusk', '@show long at=behind', '@ambience sea_wind', 'Gate line',
    '@scene hallway', '@show long at=board_side', '@show van at=far', '@hide van',
    '== here', 'Hallway line',
  ].join('\n'));
  program.meta = { season: 'winter' };
  const state = new GameState();
  const runner = new ScriptRunner({ state, profile: new Profile() });
  runner.start('t', program, { label: 'here' });
  assert.deepEqual(state.scene, { location: 'hallway', time: 'dusk', weather: 'clear', season: 'winter' });
  assert.deepEqual(state.cast, { long: { at: 'board_side', expr: 'neutral' } });
  assert.equal(state.audio.ambience, 'sea_wind');
  assert.equal(runner.next().line.text, 'Hallway line');
});

test('runner: detects silent infinite loops', () => {
  const { runner } = setup('== top\n@flag x\n@goto top');
  assert.throws(() => runner.next(), /loops without showing anything/);
});

test('runner: endings unlock in the profile', () => {
  const { runner } = setup('@ending van.true "Cốc Trà Trên Sân Thượng"');
  const cmd = runner.next();
  assert.equal(cmd.type, 'ending');
  assert.equal(runner.profile.resolve(['routes']), 1);
  assert.equal(runner.test({ type: 'path', path: ['profile', 'ending', 'van', 'true'] }), true);
});
