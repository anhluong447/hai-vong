import * as THREE from 'three';

/**
 * Lighting and atmosphere from (time, weather, season, indoor).
 * The same location looks different across the four seasons of the story:
 * Thu (làm quen) - Đông (tổn thương) - Xuân (hiểu) - Hạ (chia tay).
 */
const TIMES = {
  dawn:      { sky: '#f1c9a8', sun: '#ffd0a0', sunI: 1.6, hemiSky: '#ffe3c8', hemiGround: '#5a4a3c', hemiI: 0.9, elevation: 10, azimuth: -70 },
  morning:   { sky: '#c4d9e6', sun: '#fff0d8', sunI: 2.4, hemiSky: '#e6f0ff', hemiGround: '#6a604e', hemiI: 1.1, elevation: 28, azimuth: -45 },
  noon:      { sky: '#b6d4ec', sun: '#ffffff', sunI: 2.8, hemiSky: '#eef5ff', hemiGround: '#6e6552', hemiI: 1.2, elevation: 65, azimuth: -10 },
  afternoon: { sky: '#e5d3ae', sun: '#ffe2b0', sunI: 2.3, hemiSky: '#fff0d8', hemiGround: '#6a5a44', hemiI: 1.0, elevation: 30, azimuth: 40 },
  dusk:      { sky: '#e39a6e', sun: '#ff9458', sunI: 1.5, hemiSky: '#ffc49a', hemiGround: '#3f2e2a', hemiI: 0.7, elevation: 8, azimuth: 70 },
  night:     { sky: '#0e1628', sun: '#9fb4ff', sunI: 0.35, hemiSky: '#2a3a66', hemiGround: '#0b0d14', hemiI: 0.35, elevation: 45, azimuth: 20 },
};

const WEATHER = {
  clear:    { fog: 0.010, sun: 1.0, grey: 0.0 },
  overcast: { fog: 0.022, sun: 0.45, grey: 0.35 },
  fog:      { fog: 0.050, sun: 0.35, grey: 0.45 },
  rain:     { fog: 0.035, sun: 0.25, grey: 0.5 },
};

const PALETTES = {
  autumn: { foliage: '#5f7440', leaf: '#c58a3e', grass: '#6f7445', soil: '#6b5a44' },
  winter: { foliage: '#44573f', leaf: '#8e3b2a', grass: '#5b6150', soil: '#58524a' },
  spring: { foliage: '#5e9446', leaf: '#a9cf73', grass: '#6f8f4a', soil: '#655a42' },
  summer: { foliage: '#3b7535', leaf: '#4f9a3f', grass: '#6a8a3f', soil: '#77694c' },
};

const GREY = new THREE.Color('#9aa3ab');

export function seasonPalette(season) {
  return PALETTES[season] ?? PALETTES.autumn;
}

/**
 * @param {{ scene: THREE.Scene, hemi: THREE.HemisphereLight, sun: THREE.DirectionalLight }} target
 * @param {{ time: string, weather: string, season: string }} spec
 * @param {{ indoor: boolean }} options
 */
export function applyEnvironment({ scene, hemi, sun }, spec, { indoor }) {
  const time = TIMES[spec.time] ?? TIMES.morning;
  const weather = WEATHER[spec.weather] ?? WEATHER.clear;

  const sky = new THREE.Color(time.sky).lerp(GREY, weather.grey);
  if (indoor) {
    const interior = new THREE.Color('#2a2420').lerp(sky, 0.15);
    scene.background = interior;
    scene.fog = new THREE.FogExp2(interior, 0.018);
  } else {
    scene.background = sky;
    scene.fog = new THREE.FogExp2(sky, weather.fog);
  }

  hemi.color.set(time.hemiSky).lerp(GREY, weather.grey * 0.5);
  hemi.groundColor.set(time.hemiGround);
  hemi.intensity = time.hemiI * (indoor ? 1.25 : 1);

  sun.color.set(time.sun);
  sun.intensity = time.sunI * weather.sun * (indoor ? 0.7 : 1);
  const el = THREE.MathUtils.degToRad(time.elevation);
  const az = THREE.MathUtils.degToRad(time.azimuth);
  sun.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(40);
  sun.target.position.set(0, 0, 0);

  return seasonPalette(spec.season);
}
