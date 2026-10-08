/** The three answer stances from the story bible (section "Hệ thống lựa chọn"). */
export const STANCES = Object.freeze({
  AVOID: 'avoid',     // NÉ TRÁNH
  SINCERE: 'sincere', // THẬT LÒNG
  WRY: 'wry',         // MỈA MAI
  NEUTRAL: 'neutral', // plain choice, not counted as a stance
});

/** Accepts both English keys and the Vietnamese tags used in chapter drafts. */
export const STANCE_ALIASES = Object.freeze({
  avoid: STANCES.AVOID,
  sincere: STANCES.SINCERE,
  wry: STANCES.WRY,
  neutral: STANCES.NEUTRAL,
  'né tránh': STANCES.AVOID,
  'thật lòng': STANCES.SINCERE,
  'mỉa mai': STANCES.WRY,
});

export const SEASONS = Object.freeze(['autumn', 'winter', 'spring', 'summer']);
export const TIMES = Object.freeze(['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night']);
export const WEATHERS = Object.freeze(['clear', 'fog', 'rain', 'overcast']);

export const LINE_KINDS = Object.freeze({
  DIALOGUE: 'dialogue',   // Name: "..."
  THOUGHT: 'thought',     // (inner monologue of the protagonist)
  NARRATION: 'narration', // plain prose
  DIRECTION: 'direction', // [stage direction, sound, scene]
});

/** Roots a condition expression may reference, e.g. `bond.van >= 2`. */
export const CONDITION_ROOTS = Object.freeze([
  'flag', 'bond', 'stance', 'cost', 'costs', 'fragment', 'fragments', 'notebook', 'profile',
]);
