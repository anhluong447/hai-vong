/**
 * Composition root: the only file that knows every concrete class.
 * Creates adapters (infra, ui), injects them into the application layer,
 * and exposes `actions` for the UI.
 *
 * Dev URL params:
 *   ?chapter=c01            start directly at a chapter (skips the title)
 *   ?chapter=c01&label=x    ...at a label inside it
 *   ?debug                  show the debug panel (toggle with `)
 */
import { EventBus } from './core/events/EventBus.js';
import { CharacterRegistry } from './core/model/CharacterRegistry.js';
import { parseScript } from './core/script/ScriptParser.js';
import { ChapterRepository } from './app/ChapterRepository.js';
import { StoryDirector } from './app/StoryDirector.js';
import { GameSession } from './app/GameSession.js';
import { SaveService, SLOTS } from './app/SaveService.js';
import { Backlog } from './app/Backlog.js';
import { FetchContent } from './infra/content/FetchContent.js';
import { LocalStorageAdapter } from './infra/storage/LocalStorageAdapter.js';
import { WebAudioEngine } from './infra/audio/WebAudioEngine.js';
import { ThreeWorld } from './infra/render/ThreeWorld.js';
import { UIRoot } from './ui/UIRoot.js';
import { STRINGS } from './ui/strings.js';

async function boot() {
  const params = new URLSearchParams(location.search);
  const contentBase = new URL('./content/', document.baseURI);
  const content = new FetchContent(contentBase);

  const [manifest, charactersData, locationsMeta, notebook, audioManifest] = await Promise.all([
    content.loadJson('manifest.json'),
    content.loadJson('characters.json'),
    content.loadJson('locations.json'),
    content.loadJson('notebook.json'),
    content.loadJson('audio.json'),
  ]);
  await document.fonts?.ready; // canvas-drawn signs need the Vietnamese font

  // ---- core & infrastructure ------------------------------------------
  const bus = new EventBus();
  const characters = new CharacterRegistry(charactersData);
  const saves = new SaveService({ storage: new LocalStorageAdapter('clbhoi.') });
  const profile = saves.loadProfile();
  const audio = new WebAudioEngine({ manifest: audioManifest, baseUrl: contentBase, volume: profile.settings.masterVolume });
  const canvas = document.getElementById('world');
  const world = new ThreeWorld({ canvas, characters, locationsMeta, bus });
  const chapters = new ChapterRepository({ content, parse: parseScript, manifest });
  const backlog = new Backlog({ bus });

  // ---- UI ---------------------------------------------------------------
  let session; // assigned below; actions are only called after boot
  const guard = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      ui.showError(error);
    }
  };

  const actions = {
    newGame: guard(async () => { ui.hideTitle(); await session.newGame(); }),
    continue: guard(async () => { ui.hideTitle(); if (!(await session.continue())) ui.showTitle(); }),
    load: guard(async (slot) => { ui.hideTitle(); await session.load(slot); }),
    save: (slot) => session.save(slot),
    quicksave: () => {
      if (!session.active) return;
      session.quicksave();
      ui.toast(STRINGS.toasts.quickSaved);
    },
    quickload: () => (saves.describe(SLOTS.QUICK).savedAt ? actions.load(SLOTS.QUICK) : ui.toast(STRINGS.toasts.noQuickSave)),
    listSlots: () => saves.allSlots().map((slot) => saves.describe(slot)),
    hasSave: () => saves.latest() !== null,
    toTitle: () => {
      session.quit();
      audio.stopAll();
      ui.showTitle();
    },
    getSettings: () => ({ ...profile.settings }),
    applySettings: (settings) => {
      Object.assign(profile.settings, settings);
      audio.setVolume(profile.settings.masterVolume);
      saves.saveProfile(profile);
    },
    getBacklog: () => backlog.entries(),
    getState: () => session.state,
    locationName: (id) => (id ? locationsMeta[id]?.name ?? id : ''),
    onModal: (blocking) => world.setInputEnabled(!blocking),
    interact: () => world.requestInteract(),
    uiSound: () => audio.playSfx('ui_select'),
    toast: (text) => ui.toast(text),
  };

  const ui = new UIRoot({
    root: document.getElementById('ui'),
    shakeTarget: document.getElementById('app'),
    canvas,
    bus,
    locationsMeta,
    notebook,
    settings: profile.settings,
    profile,
    actions,
    debug: params.has('debug'),
  });

  // ---- application --------------------------------------------------------
  const director = new StoryDirector({
    chapters, characters, view: ui, world, audio, bus, profile,
    onCheckpoint: () => session.autosave(),
  });
  session = new GameSession({ chapters, director, saves, profile, bus });

  // ---- cross-cutting wiring --------------------------------------------------
  bus.on('world:step', () => audio.playSfx('step'));
  const unlockAudio = () => audio.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('beforeunload', () => saves.saveProfile(profile));
  window.game = { session, profile, bus, world, chapters }; // for the browser console

  document.getElementById('boot')?.remove();
  if (params.has('chapter')) {
    ui.hideTitle();
    await session.newGame({ chapterId: params.get('chapter'), label: params.get('label') ?? undefined });
  } else {
    ui.showTitle();
  }
}

boot().catch((error) => {
  console.error(error);
  const boot = document.getElementById('boot');
  if (boot) {
    boot.textContent = `Không khởi động được: ${error.message}`;
    boot.classList.add('failed');
  }
});
