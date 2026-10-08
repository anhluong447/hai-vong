import { test, assert } from './harness.js';
import { MemoryStorage } from './fakes.js';
import { SaveService, SLOTS } from '../src/app/SaveService.js';
import { GameState, SAVE_VERSION } from '../src/core/state/GameState.js';

test('saves: round-trip a GameState through a slot', () => {
  let now = 1000;
  const saves = new SaveService({ storage: new MemoryStorage(), clock: () => now });
  const state = new GameState({ chapterId: 'c01', pc: 42 });
  state.setFlag('metLong');
  state.addBond('van', 2);
  state.recordStance('sincere');
  state.payCost('safety');
  state.collectFragment(3);
  state.updateNotebook('ask', 9);
  state.cast = { van: { at: 'board', expr: 'neutral' } };

  saves.save(SLOTS.manual(1), state, { chapterTitle: 'Chap 1' });
  const loaded = saves.load(SLOTS.manual(1));
  assert.deepEqual(loaded.state.toJSON(), state.toJSON());
  assert.equal(loaded.meta.chapterTitle, 'Chap 1');
  assert.equal(loaded.state.resolve(['notebook', '9', 'asked']), true);
  assert.equal(loaded.state.resolve(['cost', 'safety']), 1);
  assert.equal(loaded.state.resolve(['fragment', '3']), true);

  now = 2000;
  saves.save(SLOTS.AUTO, state);
  assert.equal(saves.latest().slot, 'auto');
  assert.equal(saves.load('slot2'), null);
});

test('saves: rejects saves from a newer version', () => {
  assert.throws(() => GameState.fromJSON({ version: SAVE_VERSION + 1 }), /newer version/);
});

test('saves: profile persists separately from slots', () => {
  const storage = new MemoryStorage();
  const saves = new SaveService({ storage });
  const profile = saves.loadProfile();
  profile.unlockEnding('van.true');
  profile.markSeen('c01#3');
  saves.saveProfile(profile);
  const again = new SaveService({ storage }).loadProfile();
  assert.equal(again.resolve(['routes']), 1);
  assert.ok(again.hasSeen('c01#3'));
});
