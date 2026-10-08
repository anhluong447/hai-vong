import { test, assert } from './harness.js';
import { FakeView, FakeWorld, silentAudio } from './fakes.js';
import { StoryDirector } from '../src/app/StoryDirector.js';
import { EventBus } from '../src/core/events/EventBus.js';
import { CANCELLED } from '../src/app/ports.js';
import { GameState } from '../src/core/state/GameState.js';
import { PresentationClock } from '../src/ui/PresentationClock.js';
import { DialogueView } from '../src/ui/DialogueView.js';
import { ModalStack } from '../src/ui/Modals.js';
import { Canvas2DWorld } from '../src/infra/render2d/Canvas2DWorld.js';
import { CharacterRegistry } from '../src/core/model/CharacterRegistry.js';
import { LocalStorageAdapter } from '../src/infra/storage/LocalStorageAdapter.js';
import { SpriteFactory, SPRITE_W, SPRITE_H, WALK_FRAMES } from '../src/infra/render2d/SpriteFactory.js';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('director: stopping during fade never loads the cancelled scene', async () => {
  const view = new FakeView(), world = new FakeWorld();
  const director = new StoryDirector({ view, world, audio: silentAudio, bus: new EventBus(), profile: {} });
  await director.restore({ scene: { location: 'gate' }, cast: {}, audio: {} });
  let release;
  view.fade = () => new Promise(resolve => { release = resolve; });
  view.cancel = () => release?.(CANCELLED);
  const runner = { state: { chapterId: 'test' }, program: { meta: {} }, next: () => ({ type: 'scene', scene: { location: 'hallway' } }) };
  const running = director.run(runner);
  director.stop();
  await running;
  assert.deepEqual(world.scenes, ['gate']);
});

test('saves: presentation snapshot survives serialization and old saves remain compatible', () => {
  const state = new GameState({ presentation: { location: 'room0', player: { x: 2, z: 3, dir: 2 }, camera: { preset: 'wide' } } });
  assert.deepEqual(GameState.fromJSON(state.toJSON()).presentation, state.presentation);
  assert.equal(GameState.fromJSON({ version: 1, chapterId: 'c01' }).presentation, null);
});

test('presentation: pause preserves timer and resume completes it', async () => {
  const clock = new PresentationClock();
  let elapsed = false;
  clock.setTimeout(() => elapsed = true, 30);
  clock.setPaused(true);
  await sleep(60);
  assert.equal(elapsed, false);
  clock.setPaused(false);
  await sleep(60);
  assert.equal(elapsed, true);
});

if (typeof document !== 'undefined') {
  test('UI: closing confirm resolves false; accepting resolves true', async () => {
    const root = document.createElement('div');
    const stack = new ModalStack({ root, onChange() {} });
    const dismissed = stack.confirm('test'); stack.pop();
    assert.equal(await dismissed, false);
    const accepted = stack.confirm('test'); root.querySelector('.primary').click();
    assert.equal(await accepted, true);
  });

  test('CSS: HUD allows canvas clicks and touch gestures through its empty areas', async () => {
    const style = document.createElement('link');
    style.rel = 'stylesheet'; style.href = new URL('../styles/main.css', import.meta.url);
    const loaded = new Promise((resolve, reject) => { style.onload = resolve; style.onerror = reject; });
    document.head.append(style); await loaded;
    const app = document.createElement('div'); app.id = 'app';
    const canvas = document.createElement('canvas'); canvas.id = 'world';
    const ui = document.createElement('div'); ui.id = 'ui';
    const hud = document.createElement('div'); hud.className = 'hud';
    ui.append(hud); app.append(canvas, ui); document.body.append(app);
    try {
      assert.equal(getComputedStyle(hud).pointerEvents, 'none');
      assert.equal(getComputedStyle(canvas).touchAction, 'none');
      assert.equal(document.elementFromPoint(innerWidth / 2, innerHeight / 2), canvas);
    } finally { app.remove(); style.remove(); }
  });

  test('UI: stale skip timer cannot resolve a new unread line', async () => {
    const root = document.createElement('div');
    const dialogue = new DialogueView({ root, settings: { textSpeed: 120, autoDelayMs: 5 } });
    dialogue.setSkipping(true);
    dialogue.say({ kind: 'narration', text: 'seen', seen: true }); dialogue.cancel();
    let advanced = false;
    dialogue.say({ kind: 'narration', text: 'unread', seen: false }).then(() => advanced = true);
    await sleep(70);
    assert.equal(advanced, false);
    dialogue.cancel();
  });

  test('UI: auto waits while a modal pauses the presentation clock', async () => {
    const clock = new PresentationClock();
    const dialogue = new DialogueView({ root: document.createElement('div'), settings: { textSpeed: 120, autoDelayMs: 5 }, clock });
    let advanced = false;
    dialogue.say({ kind: 'narration', text: 'x', seen: false }).then(() => advanced = true);
    dialogue.advance(); dialogue.setAuto(true);
    dialogue.setPaused(true); clock.setPaused(true);
    await sleep(80); assert.equal(advanced, false);
    dialogue.setPaused(false); clock.setPaused(false);
    await sleep(80); assert.equal(advanced, true);
  });

  test('storage: quota failure reaches caller instead of reporting a successful save', () => {
    const storage = new LocalStorageAdapter('ask.test.');
    const original = Storage.prototype.setItem;
    try {
      Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
      assert.throws(() => storage.set('slot', { value: 1 }), /Không thể lưu/);
    } finally { Storage.prototype.setItem = original; }
  });

  test('2D world: scene cleanup, stable zoom, snapshot restore and disabled interaction', async ({ loadText }) => {
    const originalRAF = window.requestAnimationFrame;
    const frames = [];
    window.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
    const canvas = document.createElement('canvas');
    const registry = new CharacterRegistry(JSON.parse(await loadText('characters.json')));
    try {
      const world = new Canvas2DWorld({ canvas, characters: registry, locationsMeta: {}, bus: new EventBus() });
      const ctx = canvas.getContext('2d'), scale = ctx.scale.bind(ctx);
      let zoom;
      ctx.scale = (x, y) => { zoom ??= x; scale(x, y); };
      frames.shift()(performance.now()); const baseZoom = zoom;
      world.setCamera('wide'); world.setCamera('wide');
      zoom = undefined;
      frames.shift()(performance.now());
      assert.equal(zoom, baseZoom * .85);
      world.setCamera('follow'); zoom = undefined; frames.shift()(performance.now());
      assert.equal(zoom, baseZoom);
      await world.loadScene({ location: 'hallway' }); world.showCharacter('long', 'board_side');
      const movement = world.moveCharacter('long', 'far');
      world.cancelPending(); assert.equal(await movement, CANCELLED);
      await world.loadScene({ location: 'room0' });
      assert.deepEqual(world.snapshot().actors, {});
      const saved = world.snapshot(); saved.player = { x: 2, z: 3, dir: 2 };
      saved.camera = { x: 64, y: -96, preset: 'wide' };
      world.restoreSnapshot(saved);
      assert.deepEqual(world.snapshot().player, saved.player);
      world.setCamera('wide'); world.setCamera('wide');
      assert.equal(world.snapshot().camera.preset, 'wide');
      await world.loadScene({ location: 'room0' });
      let interacted = false;
      const exploring = world.explore([{ hotspot: 'door', prompt: 'door' }]).then(value => { interacted = value !== CANCELLED; });
      frames.shift()(performance.now());
      await sleep(300); world.setInputEnabled(false); world.requestInteract();
      await Promise.resolve(); assert.equal(interacted, false);
      world.cancelExplore(); await exploring;
    } finally { window.requestAnimationFrame = originalRAF; }
  });

  test('sprites: all registered characters render every direction and walking frame', async ({ loadText }) => {
    const data = JSON.parse(await loadText('characters.json'));
    const factory = new SpriteFactory();
    await factory.preload(data.characters);
    for (const character of data.characters) {
      const sheet = factory.getSpriteSheet(character);
      assert.equal(sheet.width, SPRITE_W * WALK_FRAMES);
      assert.equal(sheet.height, SPRITE_H * 4);
      const ctx = sheet.getContext('2d');
      for (let dir = 0; dir < 4; dir++) for (let frame = 0; frame < WALK_FRAMES; frame++) {
        const pixels = ctx.getImageData(frame * SPRITE_W, dir * SPRITE_H, SPRITE_W, SPRITE_H).data;
        assert.ok(pixels.some((value, index) => index % 4 === 3 && value > 0), `${character.id}: empty frame`);
      }
    }
  });
}
