import { test, assert } from './harness.js';
import { MemoryStorage, FakeView, FakeWorld, silentAudio } from './fakes.js';
import { EventBus } from '../src/core/events/EventBus.js';
import { CharacterRegistry } from '../src/core/model/CharacterRegistry.js';
import { parseScript } from '../src/core/script/ScriptParser.js';
import { ChapterRepository } from '../src/app/ChapterRepository.js';
import { StoryDirector } from '../src/app/StoryDirector.js';
import { GameSession } from '../src/app/GameSession.js';
import { SaveService } from '../src/app/SaveService.js';
import { Backlog } from '../src/app/Backlog.js';

/** Wires the real application layer with fake ports, like src/main.js does with real ones. */
async function createGame({ loadText }, { onChoose } = {}) {
  const content = {
    loadText,
    loadJson: async (path) => JSON.parse(await loadText(path)),
  };
  const manifest = await content.loadJson('manifest.json');
  const characters = new CharacterRegistry(await content.loadJson('characters.json'));
  const bus = new EventBus();
  const saves = new SaveService({ storage: new MemoryStorage() });
  const profile = saves.loadProfile();
  const view = new FakeView({ onChoose });
  const world = new FakeWorld();
  const chapters = new ChapterRepository({ content, parse: parseScript, manifest });
  const director = new StoryDirector({ chapters, characters, view, world, audio: silentAudio, bus, profile });
  const session = new GameSession({ chapters, director, saves, profile, bus });
  director.onCheckpoint = () => session.autosave();
  const backlog = new Backlog({ bus });

  const finished = () => new Promise((resolve, reject) => {
    bus.on('story:end', resolve);
    bus.on('story:error', reject);
  });
  return { session, view, world, saves, profile, backlog, finished, characters };
}

test('content: every chapter in the manifest compiles', async ({ loadText }) => {
  const manifest = JSON.parse(await loadText('manifest.json'));
  for (const [id, entry] of Object.entries(manifest.chapters)) {
    const program = parseScript(await loadText(entry.file), { file: entry.file });
    assert.ok(program.instructions.length > 0, `${id} is empty`);
  }
});

test('content: every named speaker in chapters is a known character', async ({ loadText }) => {
  const manifest = JSON.parse(await loadText('manifest.json'));
  const characters = new CharacterRegistry(JSON.parse(await loadText('characters.json')));
  const unknown = new Set();
  for (const entry of Object.values(manifest.chapters)) {
    const program = parseScript(await loadText(entry.file), { file: entry.file });
    for (const ins of program.instructions) {
      if (ins.op !== 'say' || ins.kind !== 'dialogue') continue;
      const ok = ins.speakerId ? characters.has(ins.speakerId) : characters.resolveSpeaker(ins.speaker);
      if (!ok) unknown.add(`${entry.file}:${ins.line} ${ins.speaker}`);
    }
  }
  assert.deepEqual([...unknown], []);
});

for (const [index, stance] of [[0, 'avoid'], [1, 'sincere'], [2, 'wry']]) {
  test(`story: chapter 1 plays to the end choosing ${stance}`, async (ctx) => {
    const game = await createGame(ctx, { onChoose: () => index });
    const done = game.finished();
    await game.session.newGame();
    await done;

    const { state } = game.session;
    assert.equal(game.view.error, undefined);
    assert.equal(state.stances[stance], 1);
    assert.equal(state.flags.metLong, true);
    assert.equal(state.flags.sawVanHallway, true);
    assert.equal(state.notebook[1]?.unlocked, true);
    assert.deepEqual([...new Set(game.world.scenes)], ['gate', 'hallway', 'room0']);
    assert.ok(game.view.cards.includes('Hết Chap 1'));
    assert.ok(game.saves.describe('auto').savedAt, 'checkpoints autosave');
    assert.ok(game.backlog.entries().some((e) => e.type === 'choice'));
    if (stance === 'sincere') {
      assert.equal(state.bonds.van, 2);
      assert.equal(state.costs.length, 1);
    }
    if (stance === 'avoid') {
      assert.ok(!game.world.visited.has('chair'), 'avoid route leaves the room directly');
    }
  });
}

test('story: save at the choice, load, and pick differently', async (ctx) => {
  const game = await createGame(ctx, {
    onChoose: (options, call) => {
      if (call === 1) {
        game.session.save('slot1');
        return 1;
      }
      return 2;
    },
  });
  const done = game.finished();
  await game.session.newGame();
  await done;
  assert.equal(game.session.state.flags.vanKnowsGrandpa, true);

  const again = game.finished();
  assert.ok(await game.session.load('slot1'));
  await again;
  const { state } = game.session;
  assert.equal(game.view.chooseCalls, 2, 'the choice is presented again after loading');
  assert.equal(state.flags.c01_wry, true);
  assert.equal(state.flags.vanKnowsGrandpa, undefined, 'state from the discarded branch is gone');
  assert.equal(state.stances.wry, 1);
  assert.equal(state.stances.sincere, 0);
});

test('story: speakers resolve to characters', async (ctx) => {
  const game = await createGame(ctx);
  const done = game.finished();
  await game.session.newGame();
  await done;
  const byText = (t) => game.view.lines.find((l) => l.text.startsWith(t));
  assert.equal(byText('Ê! Học sinh mới').character.id, 'long', 'explicit [long] hint');
  assert.equal(byText('Bạn học mới, cài lại').character.id, 'van', 'alias "Thanh Vân"');
  assert.equal(byText('Chắc người nghĩ ra').character.id, 'khue', 'thoughts belong to the protagonist');
});
