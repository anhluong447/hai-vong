/**
 * Procedural placeholder sounds, used until real audio files are listed in
 * content/audio.json. Each recipe receives (ctx, destination).
 * Sfx recipes play once; ambience recipes return a stop() function.
 */

function noiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown-ish noise
    data[i] = last * 3.5;
  }
  return buffer;
}

function envelope(ctx, gain, { attack = 0.005, peak = 1, decay = 0.2 }) {
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return t + attack + decay;
}

function burst(ctx, out, { freq, q = 1, type = 'bandpass', peak = 0.8, decay = 0.15, seconds = 0.5 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  src.connect(filter).connect(gain).connect(out);
  const end = envelope(ctx, gain, { peak, decay });
  src.start();
  src.stop(end + 0.05);
}

function tone(ctx, out, { freq, type = 'sine', peak = 0.2, decay = 0.4, at = 0 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  osc.connect(gain).connect(out);
  const t = ctx.currentTime + at;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

function loopNoise(ctx, out, { freq, q = 0.7, level = 0.25, lfo = 0.08, lfoDepth = 0.4 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 4);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = level;
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  mod.frequency.value = lfo;
  modGain.gain.value = level * lfoDepth;
  mod.connect(modGain).connect(gain.gain);
  src.connect(filter).connect(gain).connect(out);
  src.start();
  mod.start();
  return () => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0, t, 0.4);
    src.stop(t + 2);
    mod.stop(t + 2);
  };
}

export const SFX = {
  slap: (ctx, out) => burst(ctx, out, { freq: 1800, q: 0.8, peak: 1, decay: 0.12 }),
  heels: (ctx, out) => {
    for (let i = 0; i < 4; i++) setTimeout(() => burst(ctx, out, { freq: 3200, q: 4, peak: 0.5, decay: 0.05 }), i * 420);
  },
  creak: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(95, ctx.currentTime + 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 700;
    filter.Q.value = 6;
    const gain = ctx.createGain();
    osc.connect(filter).connect(gain).connect(out);
    const end = envelope(ctx, gain, { attack: 0.05, peak: 0.25, decay: 0.6 });
    osc.start();
    osc.stop(end + 0.05);
  },
  tick: (ctx, out) => {
    tone(ctx, out, { freq: 2400, type: 'square', peak: 0.05, decay: 0.03 });
    tone(ctx, out, { freq: 2000, type: 'square', peak: 0.04, decay: 0.03, at: 0.5 });
  },
  chime: (ctx, out) => {
    tone(ctx, out, { freq: 880, peak: 0.15, decay: 1.2 });
    tone(ctx, out, { freq: 1320, peak: 0.08, decay: 1.4, at: 0.05 });
  },
  step: (ctx, out) => burst(ctx, out, { freq: 400, q: 1.2, peak: 0.25, decay: 0.07, seconds: 0.2 }),
  ui_select: (ctx, out) => tone(ctx, out, { freq: 660, peak: 0.06, decay: 0.12 }),
};

export const AMBIENCE = {
  sea_wind: (ctx, out) => {
    const stops = [
      loopNoise(ctx, out, { freq: 380, q: 0.5, level: 0.22, lfo: 0.07 }),
      loopNoise(ctx, out, { freq: 1200, q: 0.9, level: 0.06, lfo: 0.13 }),
    ];
    return () => stops.forEach((stop) => stop());
  },
  hallway_crowd: (ctx, out) => loopNoise(ctx, out, { freq: 650, q: 2.5, level: 0.12, lfo: 0.9, lfoDepth: 0.6 }),
  room_quiet: (ctx, out) => loopNoise(ctx, out, { freq: 240, q: 0.4, level: 0.05, lfo: 0.05 }),
};
