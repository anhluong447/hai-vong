"""
Audio Synthesis Engine for "CLB Báo Chí" (Ask) Game Soundtrack.
Generates 4 high-fidelity, complex, evocative BGM tracks matching the game's lore,
characters, and atmosphere in Hải Vọng coastal town & Tĩnh Tâm High School.
"""

import math
import random
import wave
import struct
import numpy as np

SAMPLE_RATE = 44100

def note_to_freq(note_str):
    """Convert note name like 'C4', 'F#3', 'Bb5' to Hz."""
    note_names = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
                  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
                  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    letter = note_str[:-1]
    octave = int(note_str[-1])
    semitone = note_names[letter]
    midi = 12 + octave * 12 + semitone
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))

class SynthEngine:
    def __init__(self, sr=SAMPLE_RATE):
        self.sr = sr

    def create_empty(self, duration_sec):
        samples = int(self.sr * duration_sec)
        return np.zeros((2, samples), dtype=np.float32)

    # ------------------ INSTRUMENT SOUND GENERATORS ------------------

    def piano_note(self, freq, duration, velocity=0.8):
        """Rich additive harmonic piano with hammer transient, body resonance and stereo depth."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Fundamental + overtones with realistic decay rates
        sig = np.zeros_like(t)
        harmonics = [
            (1.0, 1.0, 1.2),    # fundamental
            (2.0, 0.65, 1.8),   # 1st octave
            (3.0, 0.40, 2.4),   # 5th
            (4.0, 0.25, 3.2),   # 2nd octave
            (5.0, 0.15, 4.0),   # 3rd
            (6.0, 0.08, 4.8),
            (7.0, 0.04, 5.5),
            (8.0, 0.02, 6.0),
        ]
        decay_factor = 2.2 / (1.0 + freq / 440.0)
        for h, amp, rate in harmonics:
            env = np.exp(-t * rate * decay_factor)
            # slight inharmonicity for real string feel
            h_freq = freq * h * math.sqrt(1 + 0.0004 * (h ** 2))
            sig += amp * np.sin(2 * np.pi * h_freq * t) * env

        # Piano hammer hit (percussive click)
        hammer_decay = np.exp(-t * 85.0)
        hammer = np.sin(2 * np.pi * 320.0 * t) * 0.3 * hammer_decay
        sig += hammer

        # Attack envelope
        attack_len = int(self.sr * 0.006)
        if len(sig) > attack_len:
            sig[:attack_len] *= np.linspace(0.05, 1.0, attack_len)

        # Release damping
        rel_len = int(self.sr * 0.05)
        if len(sig) > rel_len:
            sig[-rel_len:] *= np.linspace(1.0, 0.0, rel_len)

        # Gentle soft clip
        sig = np.tanh(sig * 1.3) * velocity
        return sig

    def rhodes_note(self, freq, duration, velocity=0.75):
        """Fender Rhodes electric piano (FM synthesis with tine bite & bell chime)."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # FM: modulator at ratio 4.0 (bell/tine) decaying fast, carrier at 1.0
        mod_decay = np.exp(-t * 6.5)
        mod_index = 2.2 * mod_decay * velocity
        modulator = np.sin(2 * np.pi * (freq * 4.0) * t) * mod_index
        carrier = np.sin(2 * np.pi * freq * t + modulator)

        # Body tine
        carrier2 = 0.4 * np.sin(2 * np.pi * (freq * 2.0) * t) * np.exp(-t * 2.0)
        total = (carrier + carrier2) * np.exp(-t * (1.1 + freq / 800.0))

        # Soft attack
        att = int(self.sr * 0.008)
        if len(total) > att:
            total[:att] *= np.linspace(0, 1, att)
        return total * velocity

    def nylon_guitar_note(self, freq, duration, velocity=0.8):
        """Plucked nylon acoustic guitar with body warmth."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Pluck transient + warm harmonics
        sig = np.zeros_like(t)
        harms = [(1, 1.0, 1.5), (2, 0.7, 2.8), (3, 0.45, 4.2), (4, 0.2, 5.5), (5, 0.1, 7.0)]
        for h, amp, dec in harms:
            env = np.exp(-t * dec * 1.8)
            sig += amp * np.sin(2 * np.pi * (freq * h) * t) * env

        # Pluck noise
        pluck = (np.random.rand(len(t)) * 2 - 1) * np.exp(-t * 90.0) * 0.2
        sig += pluck
        att = int(self.sr * 0.005)
        if len(sig) > att:
            sig[:att] *= np.linspace(0, 1, att)
        return np.tanh(sig) * velocity

    def upright_bass_note(self, freq, duration, velocity=0.85):
        """Warm wooden upright bass with deep punch and acoustic string resonance."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Fundamental + slight 2nd harmonic
        f1 = np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.6)
        f2 = 0.5 * np.sin(2 * np.pi * (freq * 2.0) * t) * np.exp(-t * 2.8)
        f3 = 0.18 * np.sin(2 * np.pi * (freq * 3.0) * t) * np.exp(-t * 4.5)
        # Pluck thud
        thud = np.sin(2 * np.pi * (freq * 0.8) * t) * np.exp(-t * 30.0) * 0.4
        total = (f1 + f2 + f3 + thud) * velocity
        # Gentle tube warmth
        total = np.tanh(total * 1.4) * 0.9
        return total

    def vibraphone_note(self, freq, duration, velocity=0.75):
        """Crystalline marimba / vibraphone tone with metallic ring and vibrato."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Tremolo / vibrato LFO
        lfo = 1.0 + 0.12 * np.sin(2 * np.pi * 5.0 * t)
        f1 = np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.4)
        f2 = 0.35 * np.sin(2 * np.pi * (freq * 4.0) * t) * np.exp(-t * 4.0) # tuned overtone
        f3 = 0.15 * np.sin(2 * np.pi * (freq * 9.8) * t) * np.exp(-t * 12.0) # bar strike
        sig = (f1 + f2 + f3) * lfo * velocity
        return sig

    def strings_pad_note(self, freq, duration, velocity=0.6):
        """Ensemble strings / warm synth pad with slow swelling attack and lush vibrato."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Ensemble detuned voices
        detunes = [-0.007, -0.003, 0.0, 0.003, 0.007]
        sig = np.zeros_like(t)
        for i, d in enumerate(detunes):
            vib = np.sin(2 * np.pi * (4.5 + i * 0.4) * t) * 0.003
            f = freq * (1.0 + d + vib)
            # Soft sawtooth-like spectrum
            sig += (np.sin(2 * np.pi * f * t) +
                    0.5 * np.sin(2 * np.pi * 2 * f * t) +
                    0.25 * np.sin(2 * np.pi * 3 * f * t) +
                    0.12 * np.sin(2 * np.pi * 4 * f * t)) / len(detunes)

        # Swell attack and gentle decay
        att_len = int(self.sr * 0.28)
        if len(sig) > att_len:
            sig[:att_len] *= np.linspace(0.0, 1.0, att_len)
        rel_len = int(self.sr * 0.35)
        if len(sig) > rel_len:
            sig[-rel_len:] *= np.linspace(1.0, 0.0, rel_len)
        return sig * velocity * 0.7

    def music_box_note(self, freq, duration, velocity=0.6):
        """Delicate music box bell / chime for emotional nostalgia."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        f1 = np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.8)
        f2 = 0.5 * np.sin(2 * np.pi * (freq * 3.0) * t) * np.exp(-t * 3.5)
        f3 = 0.25 * np.sin(2 * np.pi * (freq * 5.4) * t) * np.exp(-t * 6.0)
        sig = (f1 + f2 + f3) * velocity
        return sig

    def staccato_tense_note(self, freq, duration, velocity=0.85):
        """Urgent staccato piano/synth note for crisis countdown."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        f1 = np.sin(2 * np.pi * freq * t)
        f2 = 0.7 * np.sin(2 * np.pi * freq * 2 * t)
        f3 = 0.4 * np.sin(2 * np.pi * freq * 3 * t)
        f4 = 0.25 * np.sin(2 * np.pi * freq * 4 * t)
        env = np.exp(-t * 14.0) # very punchy staccato
        sig = (f1 + f2 + f3 + f4) * env * velocity
        return np.tanh(sig * 1.5)

    # ------------------ DRUMS & FOLEY ------------------

    def kick(self, duration=0.45, punch=1.0):
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        f_env = 145.0 * np.exp(-t * 36.0) + 42.0
        phase = 2 * np.pi * np.cumsum(f_env) / self.sr
        body = np.sin(phase) * np.exp(-t * 8.0)
        click = np.random.randn(len(t)) * np.exp(-t * 120.0) * 0.3
        sig = (body + click) * punch
        return np.tanh(sig * 1.4)

    def snare(self, duration=0.35, level=0.7):
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        tone = np.sin(2 * np.pi * 185.0 * t) * np.exp(-t * 22.0) * 0.4
        noise = (np.random.rand(len(t)) * 2 - 1) * np.exp(-t * 11.0)
        # filtered noise feel
        sig = (tone + noise) * level
        return np.tanh(sig)

    def hihat(self, duration=0.12, closed=True, level=0.4):
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        decay = 45.0 if closed else 12.0
        noise = (np.random.rand(len(t)) * 2 - 1)
        # Simple highpass emulation (differencing)
        hp = np.diff(noise, prepend=0)
        sig = hp * np.exp(-t * decay) * level
        return sig

    def typewriter_tap(self, duration=0.18, level=0.5):
        """Journalism typewriter mechanical tap."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        click = np.sin(2 * np.pi * 2400.0 * t) * np.exp(-t * 90.0) * 0.6
        clack = np.sin(2 * np.pi * 820.0 * t) * np.exp(-t * 45.0) * 0.4
        r = (np.random.rand(len(t)) * 2 - 1) * np.exp(-t * 70.0) * 0.3
        return (click + clack + r) * level

    def clock_tick(self, duration=0.1, high=True, level=0.45):
        """Clock ticking for deadline tension."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        freq = 3200.0 if high else 2100.0
        click = np.sin(2 * np.pi * freq * t) * np.exp(-t * 110.0)
        return click * level

    def sea_breeze_texture(self, duration, level=0.12):
        """Gentle coastal ocean wind from Hải Vọng bay."""
        t = np.linspace(0, duration, int(self.sr * duration), endpoint=False)
        # Low frequency noise wave
        brownian = np.cumsum(np.random.randn(len(t)))
        brownian = brownian - np.mean(brownian)
        brownian = brownian / (np.max(np.abs(brownian)) + 1e-6)
        # LFO swelling
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.12 * t)
        return brownian * lfo * level

    # ------------------ MIXING & FX ------------------

    def add_sound(self, buffer, sound, start_time, pan=0.0):
        """Add mono sound to stereo buffer with panning (-1.0 left to 1.0 right)."""
        start_idx = int(self.sr * start_time)
        end_idx = start_idx + len(sound)
        if start_idx >= buffer.shape[1]:
            return
        if end_idx > buffer.shape[1]:
            sound = sound[:buffer.shape[1] - start_idx]
            end_idx = buffer.shape[1]

        left_gain = math.cos((pan + 1.0) * math.pi / 4.0)
        right_gain = math.sin((pan + 1.0) * math.pi / 4.0)

        buffer[0, start_idx:end_idx] += sound * left_gain
        buffer[1, start_idx:end_idx] += sound * right_gain

    def apply_stereo_reverb(self, buffer, wet=0.22, decay_time=1.4):
        """Algorithmic feedback delay network / comb filter reverb."""
        samples = buffer.shape[1]
        delays = [int(self.sr * d) for d in [0.029, 0.037, 0.043, 0.053]]
        decay = math.exp(-3.0 / (decay_time * 10))

        out_left = np.copy(buffer[0])
        out_right = np.copy(buffer[1])

        # Apply comb filtering for rich room acoustics
        for d in delays:
            ring = np.zeros(samples)
            src = (buffer[0] + buffer[1]) * 0.5
            for i in range(d, samples):
                ring[i] = src[i - d] + ring[i - d] * decay * 0.72
            out_left += ring * wet * 0.5
            out_right += ring * wet * 0.5

        # Cross delay for stereo width
        cross_d = int(self.sr * 0.019)
        out_right[cross_d:] += out_left[:-cross_d] * (wet * 0.3)

        res = np.zeros_like(buffer)
        res[0] = out_left
        res[1] = out_right
        return res

    def master_audio(self, buffer, target_peak=0.92):
        """Soft saturation, highpass cleanup, and peak normalization."""
        # Warm tape-style saturation
        buffer = np.tanh(buffer * 1.15)
        # Peak normalization
        max_val = np.max(np.abs(buffer))
        if max_val > 1e-4:
            buffer = buffer * (target_peak / max_val)
        return buffer

    def save_wav(self, buffer, filepath):
        buffer = self.master_audio(buffer)
        int16_left = np.int16(np.clip(buffer[0], -0.99, 0.99) * 32767)
        int16_right = np.int16(np.clip(buffer[1], -0.99, 0.99) * 32767)
        interleaved = np.empty((buffer.shape[1] * 2,), dtype=np.int16)
        interleaved[0::2] = int16_left
        interleaved[1::2] = int16_right

        with wave.open(filepath, 'wb') as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(self.sr)
            wav.writeframes(interleaved.tobytes())
        print(f"-> Generated: {filepath} ({buffer.shape[1] / self.sr:.2f}s)")

# ==============================================================================
# COMPOSITIONS FOR CLB BÁO CHÍ SOUNDTRACK SUITE
# ==============================================================================

def compose_hoi_am_theme(engine):
    """
    Track 1: 'Hồi Âm Trong Gió Biển' (Echoes of Sea Wind)
    Setting: Căn phòng CLB cũ, ánh nắng chiều, gió biển Hải Vọng, niềm tin phục hưng.
    Tempo: 76 BPM (4/4). D Major / B Minor.
    """
    bpm = 76.0
    beat = 60.0 / bpm
    bars = 12
    total_time = bars * 4 * beat + 2.5 # with natural ringout
    buf = engine.create_empty(total_time)

    # Ambient sea breeze layer
    breeze = engine.sea_breeze_texture(total_time, level=0.08)
    engine.add_sound(buf, breeze, 0.0, pan=0.0)

    # Chords definition (per bar)
    chords_prog = [
        # Bar 1-4
        (['D3', 'F#3', 'A3', 'C#4', 'E4'], 'Dmaj9'),
        (['B2', 'F#3', 'A3', 'C#4', 'D4'], 'Bm9'),
        (['G2', 'B3', 'D4', 'F#4'], 'Gmaj7'),
        (['A2', 'E3', 'G3', 'C#4'], 'A7'),
        # Bar 5-8
        (['F#2', 'C#3', 'A3', 'C#4', 'E4'], 'F#m7'),
        (['B2', 'F#3', 'A3', 'D4'], 'Bm7'),
        (['E2', 'B2', 'G3', 'D4', 'F#4'], 'Em9'),
        (['A2', 'G3', 'C#4', 'F#4'], 'A13'),
        # Bar 9-12 (Culmination & Cadence)
        (['G2', 'B3', 'D4', 'F#4', 'A4'], 'Gmaj9'),
        (['F#2', 'C#3', 'A3', 'E4'], 'F#m7'),
        (['E2', 'B2', 'G3', 'D4'], 'Em7'),
        (['D3', 'F#3', 'A3', 'C#4', 'E4'], 'Dmaj9'),
    ]

    for bar_idx, (chord_notes, name) in enumerate(chords_prog):
        t_bar = bar_idx * 4 * beat

        # Upright Bass root
        root_freq = note_to_freq(chord_notes[0])
        bass_snd = engine.upright_bass_note(root_freq, beat * 3.6, velocity=0.72)
        engine.add_sound(buf, bass_snd, t_bar, pan=-0.1)

        # Strings Pad on each bar
        for n in chord_notes[1:4]:
            f = note_to_freq(n)
            pad_snd = engine.strings_pad_note(f, beat * 4.2, velocity=0.45)
            engine.add_sound(buf, pad_snd, t_bar, pan=0.15)

        # Piano Arpeggios (Left & Right hands flowing)
        arp_pattern = [0, 1, 2, 3, 2, 1, 2, 4] if len(chord_notes) >= 5 else [0, 1, 2, 3, 2, 1, 2, 3]
        for step, p_idx in enumerate(arp_pattern):
            t_note = t_bar + step * (beat * 0.5)
            p_note = chord_notes[p_idx % len(chord_notes)]
            f = note_to_freq(p_note)
            vel = 0.52 if step % 2 == 0 else 0.42
            p_snd = engine.piano_note(f, beat * 2.2, velocity=vel)
            pan_val = -0.3 + (step / 8.0) * 0.6
            engine.add_sound(buf, p_snd, t_note, pan=pan_val)

        # Soft brush percussion on beats 2 & 4
        sn1 = engine.snare(level=0.22)
        engine.add_sound(buf, sn1, t_bar + beat * 1.0, pan=-0.2)
        engine.add_sound(buf, sn1, t_bar + beat * 3.0, pan=0.2)

        # Gentle kick on beat 1 & 3
        k1 = engine.kick(punch=0.45)
        engine.add_sound(buf, k1, t_bar, pan=0.0)
        if bar_idx % 2 == 1:
            engine.add_sound(buf, k1, t_bar + beat * 2.0, pan=0.0)

    # Lead Melodies (Piano / Music Box nostalgia theme)
    # Motifs: Câu chủ đề da diết của CLB Hồi Âm
    melody_events = [
        # Bar 1: F#4 -> A4 -> E5
        (0.0 * beat, 'F#4', 1.0 * beat, 0.75),
        (1.0 * beat, 'A4', 1.0 * beat, 0.8),
        (2.0 * beat, 'E5', 2.0 * beat, 0.88),
        # Bar 2: D5 -> C#5 -> B4 -> A4
        (4.0 * beat, 'D5', 1.5 * beat, 0.82),
        (5.5 * beat, 'C#5', 0.5 * beat, 0.75),
        (6.0 * beat, 'B4', 1.0 * beat, 0.78),
        (7.0 * beat, 'A4', 1.0 * beat, 0.72),
        # Bar 3: B4 -> D5 -> F#5
        (8.0 * beat, 'B4', 1.0 * beat, 0.78),
        (9.0 * beat, 'D5', 1.0 * beat, 0.82),
        (10.0 * beat, 'F#5', 2.0 * beat, 0.9),
        # Bar 4: E5 -> D5 -> E5
        (12.0 * beat, 'E5', 2.5 * beat, 0.85),
        (14.5 * beat, 'D5', 0.5 * beat, 0.75),
        (15.0 * beat, 'E5', 1.0 * beat, 0.8),
        # Bar 5-6: A4 -> F#5 -> E5 -> D5 -> F#5
        (16.0 * beat, 'A4', 1.0 * beat, 0.8),
        (17.0 * beat, 'F#5', 1.5 * beat, 0.88),
        (18.5 * beat, 'E5', 0.5 * beat, 0.78),
        (19.0 * beat, 'D5', 2.0 * beat, 0.85),
        (21.0 * beat, 'F#5', 1.5 * beat, 0.82),
        (22.5 * beat, 'A5', 1.5 * beat, 0.92),
        # Bar 7-8: G5 -> F#5 -> E5 -> D5 -> C#5 -> D5
        (24.0 * beat, 'G5', 1.5 * beat, 0.88),
        (25.5 * beat, 'F#5', 0.5 * beat, 0.8),
        (26.0 * beat, 'E5', 1.0 * beat, 0.78),
        (27.0 * beat, 'D5', 1.0 * beat, 0.75),
        (28.0 * beat, 'C#5', 2.0 * beat, 0.82),
        (30.0 * beat, 'D5', 2.0 * beat, 0.85),
        # Bar 9-10: (Cao trào sáng bừng hy vọng)
        (32.0 * beat, 'B5', 1.5 * beat, 0.92),
        (33.5 * beat, 'A5', 0.5 * beat, 0.85),
        (34.0 * beat, 'F#5', 2.0 * beat, 0.88),
        (36.0 * beat, 'A5', 1.5 * beat, 0.85),
        (37.5 * beat, 'F#5', 0.5 * beat, 0.8),
        (38.0 * beat, 'D5', 2.0 * beat, 0.88),
        # Bar 11-12: (Hồi kết lắng đọng về căn phòng)
        (40.0 * beat, 'E5', 1.5 * beat, 0.82),
        (41.5 * beat, 'F#5', 0.5 * beat, 0.8),
        (42.0 * beat, 'E5', 1.0 * beat, 0.78),
        (43.0 * beat, 'D5', 1.0 * beat, 0.75),
        (44.0 * beat, 'D5', 4.0 * beat, 0.85),
    ]

    for t_start, note, dur, vel in melody_events:
        f = note_to_freq(note)
        # Piano lead
        lead_snd = engine.piano_note(f, dur + beat * 1.2, velocity=vel)
        engine.add_sound(buf, lead_snd, t_start, pan=0.0)
        # Music box chime echo (sparkle in the dust)
        chime_snd = engine.music_box_note(f * 2.0, dur + beat * 0.8, velocity=vel * 0.35)
        engine.add_sound(buf, chime_snd, t_start + 0.03, pan=0.35)

    return engine.apply_stereo_reverb(buf, wet=0.25, decay_time=1.8)


def compose_investigation(engine):
    """
    Track 2: 'Góc Khuất Tĩnh Tâm' (Fieldwork & Investigative Theme)
    Setting: Tác nghiệp ngoài hiện trường, lần tìm manh mối, phỏng vấn, đối chiếu tài liệu.
    Style: Sophisticated Neo-Soul / Investigative Acid Jazz (Persona / Ace Attorney vibe).
    Tempo: 98 BPM (swing feel). C Minor.
    """
    bpm = 98.0
    beat = 60.0 / bpm
    bars = 16
    total_time = bars * 4 * beat + 2.0
    buf = engine.create_empty(total_time)

    # 16 bars progression in C Minor
    chords_data = [
        # Bar 1-4: Inquiry starts
        (['C3', 'Eb3', 'G3', 'Bb3', 'D4'], 'Cm9'),
        (['F2', 'Eb3', 'G3', 'Ab3', 'C4'], 'Fm9'),
        (['Bb2', 'D3', 'Ab3', 'C4', 'G4'], 'Bb13'),
        (['Eb3', 'G3', 'Bb3', 'D4', 'A4'], 'Ebmaj7#11'),
        # Bar 5-8: Uncovering clues
        (['Ab2', 'C3', 'Eb3', 'G3', 'C4'], 'Abmaj7'),
        (['D3', 'F3', 'Ab3', 'C4'], 'Dm7b5'),
        (['G2', 'B2', 'F3', 'A#3', 'Eb4'], 'G7alt'),
        (['C3', 'Eb3', 'G3', 'Bb3', 'D4'], 'Cm9'),
        # Bar 9-12: Pressure mounts & cross-examination
        (['Bb2', 'Db3', 'F3', 'Ab3', 'C4'], 'Bbm9'),
        (['Eb2', 'G2', 'Db3', 'F3', 'Bb3'], 'Eb9'),
        (['Ab2', 'C3', 'Eb3', 'G3', 'Bb3'], 'Abmaj9'),
        (['Db3', 'F3', 'Ab3', 'B3', 'Eb4'], 'Db9'),
        # Bar 13-16: Resolution loop
        (['D3', 'F3', 'Ab3', 'C4'], 'Dm7b5'),
        (['G2', 'B2', 'F3', 'Ab3', 'D4'], 'G7b9'),
        (['C3', 'Eb3', 'G3', 'Bb3', 'D4'], 'Cm9'),
        (['C2', 'G2', 'C3', 'Eb3'], 'Cm'),
    ]

    # Walking Upright Bass notes per bar (Swing syncopated rhythm)
    bass_lines = [
        ['C2', 'Eb2', 'G2', 'Bb2'],
        ['F2', 'Ab2', 'C3', 'Eb2'],
        ['Bb2', 'D3', 'F2', 'Ab2'],
        ['Eb2', 'G2', 'Bb2', 'D3'],
        ['Ab2', 'C3', 'Eb2', 'G2'],
        ['D2', 'F2', 'Ab2', 'C3'],
        ['G2', 'B2', 'D3', 'F2'],
        ['C2', 'G2', 'Eb2', 'D2'],
        ['Bb2', 'Db3', 'F2', 'Ab2'],
        ['Eb2', 'G2', 'Db3', 'Bb2'],
        ['Ab2', 'C3', 'Eb2', 'G2'],
        ['Db2', 'F2', 'Ab2', 'B2'],
        ['D2', 'F2', 'Ab2', 'C3'],
        ['G2', 'B2', 'D3', 'F2'],
        ['C2', 'Eb2', 'G2', 'Bb2'],
        ['C2', 'C2', 'Eb2', 'D2'],
    ]

    for bar_idx in range(bars):
        t_bar = bar_idx * 4 * beat
        chord_notes = chords_data[bar_idx][0]

        # Walking bassline
        b_notes = bass_lines[bar_idx]
        for step, b_note in enumerate(b_notes):
            t_b = t_bar + step * beat
            # swing feel on odd steps
            if step % 2 == 1:
                t_b += beat * 0.06
            f_b = note_to_freq(b_note)
            b_snd = engine.upright_bass_note(f_b, beat * 1.1, velocity=0.8)
            engine.add_sound(buf, b_snd, t_b, pan=-0.15)

        # Rhodes comping chords (stabs on syncopated off-beats: 1.5 beat & 3.0 beat)
        comp_times = [t_bar + beat * 0.75, t_bar + beat * 2.25]
        for ct in comp_times:
            for cn in chord_notes[1:4]:
                fc = note_to_freq(cn)
                rhodes_snd = engine.rhodes_note(fc, beat * 1.4, velocity=0.55)
                engine.add_sound(buf, rhodes_snd, ct, pan=0.25)

        # Journalism Typewriter & Detective Percussion Groove
        # 16th note typewriter mechanical taps
        for sixteenth in range(16):
            t_tw = t_bar + sixteenth * (beat * 0.25)
            # slight shuffle
            if sixteenth % 2 == 1:
                t_tw += beat * 0.03
            lvl = 0.25 if sixteenth % 4 == 0 else 0.12
            tw = engine.typewriter_tap(level=lvl)
            engine.add_sound(buf, tw, t_tw, pan=0.35)

        # Kick on 1 & 3-and
        engine.add_sound(buf, engine.kick(punch=0.8), t_bar, pan=0.0)
        engine.add_sound(buf, engine.kick(punch=0.6), t_bar + beat * 2.5, pan=0.0)

        # Crisp Snare / Rimshot on 2 & 4
        engine.add_sound(buf, engine.snare(level=0.55), t_bar + beat * 1.0, pan=-0.1)
        engine.add_sound(buf, engine.snare(level=0.55), t_bar + beat * 3.0, pan=-0.1)

        # Hi-hat swing pattern
        for hh_step in range(8):
            t_hh = t_bar + hh_step * (beat * 0.5)
            if hh_step % 2 == 1:
                t_hh += beat * 0.05
            closed = (hh_step != 6)
            engine.add_sound(buf, engine.hihat(closed=closed, level=0.3), t_hh, pan=0.2)

    # Vibraphone / Marimba Investigative Melodic Riffs (Catchy & Inquisitive)
    vib_riffs = [
        # Bar 1-2: C5 -> Eb5 -> D5 -> G4
        (0.0 * beat, 'C5', 0.5 * beat, 0.8),
        (0.75 * beat, 'Eb5', 0.5 * beat, 0.85),
        (1.5 * beat, 'D5', 1.0 * beat, 0.78),
        (3.0 * beat, 'G4', 1.5 * beat, 0.82),
        (5.0 * beat, 'Bb4', 0.5 * beat, 0.75),
        (6.0 * beat, 'C5', 1.5 * beat, 0.85),
        # Bar 3-4: F5 -> D5 -> Eb5 -> C5
        (8.0 * beat, 'F5', 0.75 * beat, 0.85),
        (9.0 * beat, 'D5', 0.75 * beat, 0.8),
        (10.0 * beat, 'Eb5', 1.0 * beat, 0.82),
        (11.5 * beat, 'C5', 2.0 * beat, 0.88),
        # Bar 5-6: Ab4 -> C5 -> Eb5 -> G5 -> F#5
        (16.0 * beat, 'Ab4', 0.5 * beat, 0.78),
        (17.0 * beat, 'C5', 0.5 * beat, 0.8),
        (18.0 * beat, 'Eb5', 0.75 * beat, 0.85),
        (19.25 * beat, 'G5', 0.75 * beat, 0.9),
        (20.5 * beat, 'F#5', 1.5 * beat, 0.88),
        # Bar 7-8: F5 -> D5 -> B4 -> C5 (Tension resolves to Cm)
        (24.0 * beat, 'F5', 0.5 * beat, 0.82),
        (25.0 * beat, 'D5', 0.5 * beat, 0.8),
        (26.0 * beat, 'B4', 1.0 * beat, 0.85),
        (27.5 * beat, 'C5', 2.5 * beat, 0.92),
        # Bar 9-10: (Shift to deeper mystery)
        (32.0 * beat, 'Db5', 0.75 * beat, 0.85),
        (33.0 * beat, 'F5', 0.75 * beat, 0.88),
        (34.5 * beat, 'Eb5', 1.5 * beat, 0.82),
        (37.0 * beat, 'C5', 1.0 * beat, 0.8),
        (38.5 * beat, 'Ab4', 1.5 * beat, 0.85),
        # Bar 11-12:
        (40.0 * beat, 'Bb4', 0.5 * beat, 0.8),
        (41.0 * beat, 'Db5', 0.5 * beat, 0.85),
        (42.0 * beat, 'C5', 1.0 * beat, 0.88),
        (44.0 * beat, 'G4', 2.0 * beat, 0.82),
        # Bar 13-14:
        (48.0 * beat, 'Ab4', 0.5 * beat, 0.78),
        (49.0 * beat, 'D5', 0.75 * beat, 0.85),
        (50.5 * beat, 'Eb5', 0.5 * beat, 0.88),
        (51.5 * beat, 'F5', 1.5 * beat, 0.85),
        # Bar 15-16: Final statement loop back
        (56.0 * beat, 'G5', 0.75 * beat, 0.92),
        (57.0 * beat, 'Eb5', 0.75 * beat, 0.85),
        (58.0 * beat, 'D5', 1.0 * beat, 0.82),
        (59.5 * beat, 'C5', 3.0 * beat, 0.95),
    ]

    for t_v, note, dur, vel in vib_riffs:
        fv = note_to_freq(note)
        vib_snd = engine.vibraphone_note(fv, dur + beat * 0.8, velocity=vel)
        engine.add_sound(buf, vib_snd, t_v, pan=0.1)

    return engine.apply_stereo_reverb(buf, wet=0.2, decay_time=1.3)


def compose_golden_hour(engine):
    """
    Track 3: 'Hoàng Hôn Hải Vọng' (Golden Hour & Slow-burn Romance)
    Setting: Chiều tà ven bờ biển, tiệm sách cũ, quán nước vỉa hè, tình cảm thanh xuân trong sáng.
    Style: Dreamy Lofi Nostalgia & Acoustic Guitar / Fender Rhodes Warmth.
    Tempo: 82 BPM. F# Major / Eb Minor.
    """
    bpm = 82.0
    beat = 60.0 / bpm
    bars = 12
    total_time = bars * 4 * beat + 2.5
    buf = engine.create_empty(total_time)

    # Ambient gentle ocean breeze
    buf_breeze = engine.sea_breeze_texture(total_time, level=0.06)
    engine.add_sound(buf, buf_breeze, 0.0, pan=0.0)

    # Chord Progression: F#maj9 -> Bmaj7 -> C#7sus4 -> D#m9 ...
    chords_gh = [
        # Bar 1-4
        (['F#2', 'A#3', 'C#4', 'F4', 'G#4'], 'F#maj9'),
        (['B2', 'F#3', 'A#3', 'D#4'], 'Bmaj7'),
        (['C#3', 'G#3', 'B3', 'F#4'], 'C#7sus4'),
        (['D#3', 'A#3', 'C#4', 'F4', 'F#4'], 'D#m9'),
        # Bar 5-8
        (['G#2', 'D#3', 'F#3', 'B3', 'D#4'], 'G#m9'),
        (['C#3', 'G#3', 'B3', 'F4', 'A#4'], 'C#13'),
        (['F#2', 'A#3', 'C#4', 'F4', 'G#4'], 'F#maj9'),
        (['F#2', 'C#3', 'E3', 'A#3', 'C#4'], 'F#7'),
        # Bar 9-12 (Romantic climax & resolution)
        (['B2', 'F#3', 'A#3', 'D#4', 'F#4'], 'Bmaj9'),
        (['A#2', 'F3', 'G#3', 'C#4'], 'A#m7'),
        (['G#2', 'D#3', 'F#3', 'B3'], 'G#m7'),
        (['C#3', 'G#3', 'B3', 'F4', 'F#4'], 'C#7sus4'),
    ]

    for bar_idx, (chord_notes, name) in enumerate(chords_gh):
        t_bar = bar_idx * 4 * beat

        # Upright Bass
        f_bass = note_to_freq(chord_notes[0])
        bass_snd = engine.upright_bass_note(f_bass, beat * 3.8, velocity=0.7)
        engine.add_sound(buf, bass_snd, t_bar, pan=-0.2)

        # Warm Strings Pad
        for cn in chord_notes[1:4]:
            fc = note_to_freq(cn)
            pad_snd = engine.strings_pad_note(fc, beat * 4.2, velocity=0.38)
            engine.add_sound(buf, pad_snd, t_bar, pan=0.2)

        # Nylon Acoustic Guitar Arpeggio (Gentle fingerpicking)
        # 8 eighth notes per bar
        pick_pattern = [0, 1, 2, 3, 1, 2, 3, 2] if len(chord_notes) >= 4 else [0, 1, 2, 1, 0, 1, 2, 1]
        for step, p_idx in enumerate(pick_pattern):
            t_pick = t_bar + step * (beat * 0.5)
            p_note = chord_notes[p_idx % len(chord_notes)]
            f_pick = note_to_freq(p_note)
            vel = 0.55 if step % 2 == 0 else 0.42
            gtr_snd = engine.nylon_guitar_note(f_pick, beat * 2.0, velocity=vel)
            pan_val = -0.3 + (step / 8.0) * 0.5
            engine.add_sound(buf, gtr_snd, t_pick, pan=pan_val)

        # Lofi Drums: Soft kick, rimshot snare, subtle hi-hat
        engine.add_sound(buf, engine.kick(punch=0.55), t_bar, pan=0.0)
        engine.add_sound(buf, engine.kick(punch=0.4), t_bar + beat * 2.25, pan=0.0)
        engine.add_sound(buf, engine.snare(level=0.35), t_bar + beat * 1.0, pan=0.1)
        engine.add_sound(buf, engine.snare(level=0.35), t_bar + beat * 3.0, pan=0.1)

        for hh_step in range(4):
            t_hh = t_bar + hh_step * beat + beat * 0.5
            engine.add_sound(buf, engine.hihat(closed=True, level=0.2), t_hh, pan=-0.25)

    # Rhodes & Piano Lead Melody (Sweet, heartfelt slow-burn youth melody)
    romance_melody = [
        # Bar 1-2: F4 -> G#4 -> F#4 -> C#4
        (0.0 * beat, 'F4', 1.0 * beat, 0.75),
        (1.0 * beat, 'G#4', 1.0 * beat, 0.8),
        (2.0 * beat, 'F#4', 2.0 * beat, 0.88),
        (4.0 * beat, 'C#4', 1.5 * beat, 0.75),
        (5.5 * beat, 'D#4', 0.5 * beat, 0.72),
        (6.0 * beat, 'F4', 2.0 * beat, 0.82),
        # Bar 3-4: F#4 -> A#4 -> G#4 -> F#4 -> F4 -> D#4
        (8.0 * beat, 'F#4', 1.0 * beat, 0.8),
        (9.0 * beat, 'A#4', 1.0 * beat, 0.85),
        (10.0 * beat, 'G#4', 2.0 * beat, 0.9),
        (12.0 * beat, 'F#4', 1.5 * beat, 0.82),
        (13.5 * beat, 'F4', 0.5 * beat, 0.75),
        (14.0 * beat, 'D#4', 2.0 * beat, 0.85),
        # Bar 5-6: F4 -> G#4 -> B4 -> A#4 -> G#4 -> F#4
        (16.0 * beat, 'F4', 1.0 * beat, 0.8),
        (17.0 * beat, 'G#4', 1.0 * beat, 0.82),
        (18.0 * beat, 'B4', 1.5 * beat, 0.88),
        (19.5 * beat, 'A#4', 0.5 * beat, 0.8),
        (20.0 * beat, 'G#4', 2.0 * beat, 0.85),
        (22.0 * beat, 'F#4', 2.0 * beat, 0.82),
        # Bar 7-8: F4 -> C#4 -> F#4
        (24.0 * beat, 'F4', 1.5 * beat, 0.8),
        (25.5 * beat, 'D#4', 0.5 * beat, 0.75),
        (26.0 * beat, 'C#4', 2.0 * beat, 0.82),
        (28.0 * beat, 'F#4', 4.0 * beat, 0.9),
        # Bar 9-10 (Tender confession moment / Ánh hoàng hôn buông)
        (32.0 * beat, 'A#4', 1.5 * beat, 0.92),
        (33.5 * beat, 'B4', 0.5 * beat, 0.85),
        (34.0 * beat, 'C#5', 2.0 * beat, 0.95),
        (36.0 * beat, 'A#4', 1.5 * beat, 0.85),
        (37.5 * beat, 'G#4', 0.5 * beat, 0.8),
        (38.0 * beat, 'F#4', 2.0 * beat, 0.88),
        # Bar 11-12 (Ending cadence)
        (40.0 * beat, 'G#4', 1.5 * beat, 0.82),
        (41.5 * beat, 'A#4', 0.5 * beat, 0.8),
        (42.0 * beat, 'G#4', 1.0 * beat, 0.78),
        (43.0 * beat, 'F4', 1.0 * beat, 0.75),
        (44.0 * beat, 'F#4', 4.0 * beat, 0.88),
    ]

    for t_m, note, dur, vel in romance_melody:
        fm = note_to_freq(note)
        # Fender Rhodes Lead
        rhodes_lead = engine.rhodes_note(fm, dur + beat * 1.0, velocity=vel)
        engine.add_sound(buf, rhodes_lead, t_m, pan=0.0)
        # Gentle Acoustic Piano harmonic doubling
        p_double = engine.piano_note(fm, dur + beat * 0.6, velocity=vel * 0.4)
        engine.add_sound(buf, p_double, t_m + 0.02, pan=-0.2)

    return engine.apply_stereo_reverb(buf, wet=0.28, decay_time=1.7)


def compose_deadline_crisis(engine):
    """
    Track 4: 'Trước Giờ Lên Khuôn' (Deadline Crunch & Political Threat)
    Setting: Hạn chót xuất bản số báo, đối mặt Phan Gia Huy & Hội học sinh, nguy cơ đình bản.
    Style: Dramatic Cinematic Suspense & Fast Rhythmic Piano Ostinato.
    Tempo: 120 BPM. D Minor.
    """
    bpm = 120.0
    beat = 60.0 / bpm
    bars = 16
    total_time = bars * 4 * beat + 2.0
    buf = engine.create_empty(total_time)

    # Chord progression for 16 bars (D Minor Drama)
    crisis_chords = [
        # Bar 1-4: The clock starts ticking
        (['D2', 'D3', 'F3', 'A3', 'D4'], 'Dm'),
        (['C2', 'C3', 'E3', 'G3', 'C4'], 'C/D'),
        (['Bb1', 'Bb2', 'D3', 'F3', 'Bb3'], 'Bb'),
        (['A1', 'A2', 'C#3', 'E3', 'A3'], 'A7'),
        # Bar 5-8: Threats from Student Council
        (['G1', 'G2', 'D3', 'Bb3', 'D4'], 'Gm'),
        (['A1', 'A2', 'C#3', 'G3', 'A3'], 'A7'),
        (['D1', 'D2', 'A2', 'F3', 'D4'], 'Dm'),
        (['D1', 'F2', 'A2', 'D3'], 'Dm/F'),
        # Bar 9-12: The race against time
        (['Bb1', 'Bb2', 'F3', 'Ab3', 'D4'], 'Bb7'),
        (['C2', 'C3', 'G3', 'Bb3', 'E4'], 'C7'),
        (['D1', 'D2', 'A2', 'F3', 'D4'], 'Dm'),
        (['D1', 'D2', 'A2', 'F3', 'A4'], 'Dm'),
        # Bar 13-16: Final standoff before the press rolls
        (['G1', 'G2', 'Bb2', 'D3', 'F3'], 'Gm7'),
        (['A1', 'A2', 'D3', 'E3', 'A3'], 'Asus4'),
        (['A1', 'A2', 'C#3', 'E3', 'G3'], 'A7'),
        (['D1', 'D2', 'F2', 'A2', 'D3'], 'Dm'),
    ]

    # Ostinato Staccato Piano notes (16th notes relentless driving pattern)
    ostinato_notes = ['D4', 'F4', 'A4', 'D5', 'F4', 'A4', 'D4', 'F4']

    for bar_idx in range(bars):
        t_bar = bar_idx * 4 * beat
        chord_notes = crisis_chords[bar_idx][0]

        # Heavy Driving Bass on beats 1, 2, 3, 4
        f_bass = note_to_freq(chord_notes[0])
        for b_step in range(4):
            t_b = t_bar + b_step * beat
            vel_b = 0.9 if b_step == 0 else 0.75
            b_snd = engine.upright_bass_note(f_bass, beat * 0.9, velocity=vel_b)
            engine.add_sound(buf, b_snd, t_b, pan=0.0)

        # Relentless 16th Staccato Ostinato (The deadline clock)
        for sixteenth in range(16):
            t_ost = t_bar + sixteenth * (beat * 0.25)
            n_ost = ostinato_notes[sixteenth % len(ostinato_notes)]
            f_ost = note_to_freq(n_ost)
            vel_ost = 0.85 if sixteenth % 4 == 0 else 0.6
            stacc_snd = engine.staccato_tense_note(f_ost, beat * 0.4, velocity=vel_ost)
            pan_val = -0.25 if sixteenth % 2 == 0 else 0.25
            engine.add_sound(buf, stacc_snd, t_ost, pan=pan_val)

        # Clock Ticking on every eighth note
        for tick_step in range(8):
            t_tick = t_bar + tick_step * (beat * 0.5)
            is_high = (tick_step % 2 == 0)
            clk = engine.clock_tick(high=is_high, level=0.4)
            engine.add_sound(buf, clk, t_tick, pan=0.35)

        # Dramatic Strings / Brass Stabs on beats 1 and 3
        stab_times = [t_bar, t_bar + beat * 2.0]
        for st in stab_times:
            for cn in chord_notes[1:4]:
                fc = note_to_freq(cn)
                stab_snd = engine.staccato_tense_note(fc, beat * 0.8, velocity=0.7)
                engine.add_sound(buf, stab_snd, st, pan=-0.3)

        # Heavy Cinematic Drums
        # Kick on 1, 2&, 3, 4
        engine.add_sound(buf, engine.kick(punch=1.0), t_bar, pan=0.0)
        engine.add_sound(buf, engine.kick(punch=0.75), t_bar + beat * 1.5, pan=0.0)
        engine.add_sound(buf, engine.kick(punch=0.9), t_bar + beat * 2.0, pan=0.0)
        engine.add_sound(buf, engine.kick(punch=0.75), t_bar + beat * 3.0, pan=0.0)

        # Sharp Snare on 2 and 4
        engine.add_sound(buf, engine.snare(level=0.85), t_bar + beat * 1.0, pan=0.0)
        engine.add_sound(buf, engine.snare(level=0.85), t_bar + beat * 3.0, pan=0.0)

        # Rapid Typewriter Strikes (Journalists frantic typing before press release)
        for tw_step in [3, 7, 11, 15]:
            t_tw = t_bar + tw_step * (beat * 0.25)
            engine.add_sound(buf, engine.typewriter_tap(level=0.38), t_tw, pan=-0.35)

    # Dramatic Melody / Warning Stabs (Khuê and the team holding the line)
    dramatic_theme = [
        # Bar 1-2: D5 -> F5 -> E5 -> D5
        (0.0 * beat, 'D5', 1.5 * beat, 0.95),
        (1.5 * beat, 'F5', 1.5 * beat, 0.92),
        (3.0 * beat, 'E5', 2.0 * beat, 0.9),
        (5.0 * beat, 'D5', 2.5 * beat, 0.92),
        # Bar 3-4: Bb4 -> C5 -> D5 -> C#5
        (8.0 * beat, 'Bb4', 1.5 * beat, 0.88),
        (9.5 * beat, 'C5', 1.5 * beat, 0.9),
        (11.0 * beat, 'D5', 2.0 * beat, 0.92),
        (13.0 * beat, 'C#5', 3.0 * beat, 0.95),
        # Bar 5-6: G5 -> F5 -> E5 -> D5
        (16.0 * beat, 'G5', 1.5 * beat, 0.95),
        (17.5 * beat, 'F5', 1.5 * beat, 0.9),
        (19.0 * beat, 'E5', 2.0 * beat, 0.88),
        (21.0 * beat, 'D5', 2.5 * beat, 0.92),
        # Bar 7-8: F5 -> E5 -> D5 -> C#5 -> D5
        (24.0 * beat, 'F5', 1.5 * beat, 0.9),
        (25.5 * beat, 'E5', 1.5 * beat, 0.88),
        (27.0 * beat, 'D5', 1.5 * beat, 0.85),
        (28.5 * beat, 'C#5', 1.5 * beat, 0.9),
        (30.0 * beat, 'D5', 2.0 * beat, 0.95),
        # Bar 9-12 (Climactic Confrontation with Council)
        (32.0 * beat, 'F5', 1.0 * beat, 0.95),
        (33.0 * beat, 'G5', 1.0 * beat, 0.95),
        (34.0 * beat, 'A5', 2.0 * beat, 1.0),
        (36.0 * beat, 'Bb5', 1.5 * beat, 1.0),
        (37.5 * beat, 'A5', 1.5 * beat, 0.95),
        (39.0 * beat, 'G5', 2.0 * beat, 0.92),
        (41.0 * beat, 'F5', 2.0 * beat, 0.9),
        (43.0 * beat, 'E5', 2.0 * beat, 0.92),
        # Bar 13-16 (Standoff & The Press Is Rolling!)
        (48.0 * beat, 'D5', 1.0 * beat, 0.92),
        (49.0 * beat, 'E5', 1.0 * beat, 0.92),
        (50.0 * beat, 'F5', 2.0 * beat, 0.95),
        (52.0 * beat, 'E5', 2.0 * beat, 0.95),
        (54.0 * beat, 'C#5', 2.0 * beat, 0.98),
        (56.0 * beat, 'D5', 6.0 * beat, 1.0),
    ]

    for t_dt, note, dur, vel in dramatic_theme:
        f_dt = note_to_freq(note)
        # Intense piano lead
        p_lead = engine.piano_note(f_dt, dur + beat * 0.5, velocity=vel)
        engine.add_sound(buf, p_lead, t_dt, pan=0.0)
        # Octave lower string reinforcement for dramatic weight
        p_sub = engine.staccato_tense_note(f_dt * 0.5, dur, velocity=vel * 0.8)
        engine.add_sound(buf, p_sub, t_dt, pan=-0.2)

    return engine.apply_stereo_reverb(buf, wet=0.22, decay_time=1.5)


def main():
    import os
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print("==================================================")
    print("CLB BAO CHI - COMPOSING & GENERATING BGM SUITE")
    print("==================================================")
    engine = SynthEngine()
    out_dir = r"C:\Users\anhlh52\AndroidStudioProjects\Ask\assets\audio\bgm"
    os.makedirs(out_dir, exist_ok=True)

    tracks = [
        ("bgm_hoi_am_theme.wav", compose_hoi_am_theme, "Theme CLB Hồi Âm & Gió Biển Hải Vọng (Clubroom / Main Theme)"),
        ("bgm_investigation.wav", compose_investigation, "Góc Khuất Tĩnh Tâm (Investigation / Fieldwork Theme)"),
        ("bgm_golden_hour.wav", compose_golden_hour, "Hoàng Hôn Hải Vọng (Hangout & Slow-burn Romance Theme)"),
        ("bgm_deadline_crisis.wav", compose_deadline_crisis, "Trước Giờ Lên Khuôn & Áp Lực Đình Bản (Crisis / Tension Theme)"),
    ]

    for filename, composer_func, desc in tracks:
        print(f"\n[Composing] {desc}...")
        buf = composer_func(engine)
        filepath = os.path.join(out_dir, filename)
        engine.save_wav(buf, filepath)

    print("\n[SUCCESS] Completed generating 4-track BGM Suite!")

if __name__ == "__main__":
    main()

