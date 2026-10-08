/**
 * Port contracts: what the application layer needs from the outside world.
 * Infrastructure and UI provide implementations; tests provide fakes.
 * (JSDoc only — JavaScript has no interfaces. Keep this file in sync.)
 *
 * @typedef {{ kind: string, speaker: string|null, speakerId: string|null, manner: string|null, text: string }} Line
 * @typedef {{ location: string, time: string, weather: string, season: string }} SceneSpec
 * @typedef {{ kind: 'on'|'exit', hotspot: string, prompt: string|null }} ExploreHandler
 * @typedef {{ index: number, stance: string, text: string }} ChoiceOption
 */

/**
 * ViewPort — 2D presentation (dialogue box, choices, cards, overlays).
 * Every Promise must resolve with CANCELLED when `cancel()` is called.
 * @typedef {object} ViewPort
 * @property {(line: Line & { character: object|null, seen: boolean }) => Promise<void|symbol>} say
 * @property {(options: ChoiceOption[]) => Promise<number|symbol>} choose
 * @property {(title: string, sub?: string|null) => Promise<void|symbol>} card
 * @property {(text: string) => void} toast
 * @property {(dir: 'in'|'out', ms: number) => Promise<void|symbol>} fade
 * @property {() => void} shake
 * @property {(scene: SceneSpec) => void} setScene      HUD: location / season / time
 * @property {(hint: string|null) => void} setObjective  HUD objective during exploration
 * @property {(ms: number) => Promise<void|symbol>} wait
 * @property {() => void} hideDialogue
 * @property {() => void} cancel
 * @property {(error: Error) => void} showError
 */

/**
 * WorldPort — the 3D world.
 * @typedef {object} WorldPort
 * @property {(scene: SceneSpec) => Promise<void>} loadScene
 * @property {(id: string, at: string, expr: string) => void} showCharacter
 * @property {(id: string) => void} hideCharacter          '*' hides everyone
 * @property {(id: string, to: string, speed: number) => Promise<void>} moveCharacter
 * @property {(id: string, target: string) => void} faceCharacter
 * @property {(speakerId: string|null) => void} focusSpeaker  cinematic framing for dialogue
 * @property {(preset: string, target: string|null) => void} setCamera
 * @property {(handlers: ExploreHandler[]) => Promise<string|symbol>} explore  resolves with a hotspot id
 * @property {() => void} cancelExplore
 */

/**
 * AudioPort
 * @typedef {object} AudioPort
 * @property {(id: string|null) => void} playBgm
 * @property {(id: string|null) => void} setAmbience
 * @property {(id: string) => void} playSfx
 * @property {() => void} stopAll
 */

/**
 * StoragePort — synchronous key/value JSON storage.
 * @typedef {object} StoragePort
 * @property {(key: string) => any} get
 * @property {(key: string, value: any) => void} set
 * @property {(key: string) => void} remove
 */

/**
 * ContentPort — loads authored content.
 * @typedef {object} ContentPort
 * @property {(path: string) => Promise<string>} loadText
 * @property {(path: string) => Promise<any>} loadJson
 */

/** Resolved by ports when a pending operation is aborted (e.g. loading a save mid-scene). */
export const CANCELLED = Symbol('cancelled');
