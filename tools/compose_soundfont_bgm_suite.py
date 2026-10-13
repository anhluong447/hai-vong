"""
SoundFont BGM Composer & Master Suite for "CLB Báo Chí - Hồi Âm".
Composes and masters 4 authentic, theme-specific soundtrack tracks:
  - Track 1: Hải Vọng Biển Chiều (Thành phố biển Hải Vọng - biển, hoài niệm, lãng đãng)
  - Track 2: CLB Báo Chí Tĩnh Tâm (Phòng CLB Báo chí Tĩnh Tâm - đời thường học đường, ấm cúng)
  - Track 3: Tác Nghiệp Hiện Trường (Tác nghiệp hiện trường - tập trung, nhịp điệu điều tra)
  - Track 4: Đêm Tĩnh Lặng & Hẹn Hò (Đêm tĩnh lặng / Hẹn hò - thư thái, nhẹ nhàng)

Uses SoundFont samples (TimGM6mb.sf2), multi-track stem rendering, individual gain staging,
stereo soundstage panning, and pydub mastering to output pristine .mid and .wav files.
"""

import os
import sys
import math
import mido
import sf2_loader
import numpy as np
from pydub import AudioSegment
from pydub.effects import normalize

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

TICKS_PER_BEAT = 480

def note_to_midi(name):
    """Convert note name like 'C4', 'F#3', 'Bb5' to MIDI pitch."""
    notes = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
             'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
             'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    letter = name[:-1]
    octave = int(name[-1])
    return 12 + (octave + 1) * 12 + notes[letter]


def to_ascii(s):
    """Sanitize string for standard MIDI Latin-1 meta messages."""
    import unicodedata
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii').strip() or "Track"

class StemWriter:
    """Manages note events for an individual instrument stem."""
    def __init__(self, name, program, bpm, channel=0):
        self.name = name
        self.program = program
        self.bpm = bpm
        self.channel = channel
        self.events = []

    def add_note(self, note, start_beat, duration_beats, velocity=64):
        midi_note = note_to_midi(note) if isinstance(note, str) else note
        start_tick = int(start_beat * TICKS_PER_BEAT)
        dur_tick = int(duration_beats * TICKS_PER_BEAT)
        end_tick = start_tick + dur_tick
        self.events.append((start_tick, mido.Message('note_on', note=midi_note, velocity=velocity, channel=self.channel, time=0)))
        self.events.append((end_tick, mido.Message('note_off', note=midi_note, velocity=0, channel=self.channel, time=0)))

    def add_pedal(self, start_beat, end_beat):
        """Damper sustain pedal (CC 64)."""
        start_tick = int(start_beat * TICKS_PER_BEAT)
        end_tick = int(end_beat * TICKS_PER_BEAT)
        self.events.append((start_tick, mido.Message('control_change', control=64, value=127, channel=self.channel, time=0)))
        self.events.append((max(0, end_tick - 10), mido.Message('control_change', control=64, value=0, channel=self.channel, time=0)))

    def export_stem_midi(self, filepath):
        """Export single stem MIDI for SoundFont rendering."""
        mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
        track = mido.MidiTrack()
        track.append(mido.MetaMessage('track_name', name=to_ascii(self.name), time=0))
        track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        track.append(mido.Message('program_change', program=self.program, channel=self.channel, time=0))

        self.events.sort(key=lambda x: x[0])
        last_tick = 0
        for abs_tick, msg in self.events:
            delta = max(0, abs_tick - last_tick)
            msg.time = delta
            track.append(msg)
            last_tick = abs_tick

        mid.tracks.append(track)
        mid.save(filepath)


def export_combined_midi(stems, bpm, filepath, title="BGM"):
    """Export a unified multi-track General MIDI file containing all instruments."""
    mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)

    # Tempo track
    tempo_track = mido.MidiTrack()
    tempo_track.append(mido.MetaMessage('track_name', name=to_ascii(title), time=0))
    tempo_track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
    tempo_track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
    mid.tracks.append(tempo_track)

    for ch_idx, stem in enumerate(stems):
        tr = mido.MidiTrack()
        tr.append(mido.MetaMessage('track_name', name=to_ascii(stem.name), time=0))
        # Ensure separate MIDI channels for multitrack playback
        ch = ch_idx if ch_idx < 9 else (ch_idx + 1) # Skip channel 9 (percussion)
        tr.append(mido.Message('program_change', program=stem.program, channel=ch, time=0))

        stem.events.sort(key=lambda x: x[0])
        last_tick = 0
        for abs_tick, msg in stem.events:
            delta = max(0, abs_tick - last_tick)
            msg_copy = msg.copy(time=delta, channel=ch)
            tr.append(msg_copy)
            last_tick = abs_tick
        mid.tracks.append(tr)

    mid.save(filepath)


# ==============================================================================
# AUDIO SYNTHESIS TEXTURES FOR ATMOSPHERE
# ==============================================================================

def generate_sea_breeze(duration_sec, sample_rate=44100):
    """Gentle coastal ocean wind from Hải Vọng bay."""
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    brownian = np.cumsum(np.random.randn(len(t)))
    brownian = brownian - np.mean(brownian)
    brownian = brownian / (np.max(np.abs(brownian)) + 1e-6)
    lfo = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.12 * t))
    sig = brownian * lfo * 0.12
    int16_sig = np.int16(np.clip(sig, -0.95, 0.95) * 32767)
    stereo = np.empty((len(sig) * 2,), dtype=np.int16)
    stereo[0::2] = int16_sig
    stereo[1::2] = int16_sig
    return AudioSegment(data=stereo.tobytes(), sample_width=2, frame_rate=sample_rate, channels=2)


def generate_typewriter_track(duration_sec, bpm=100.0, sample_rate=44100):
    """Subtle mechanical typewriter clicks for investigative journalism cadence."""
    total_samples = int(sample_rate * duration_sec)
    buf = np.zeros(total_samples, dtype=np.float32)
    beat_sec = 60.0 / bpm
    sixteenth_sec = beat_sec * 0.25

    tap_len = int(sample_rate * 0.08)
    t_tap = np.linspace(0, 0.08, tap_len, endpoint=False)
    click = (np.sin(2 * np.pi * 2400.0 * t_tap) * np.exp(-t_tap * 110.0) * 0.35 +
             np.sin(2 * np.pi * 880.0 * t_tap) * np.exp(-t_tap * 60.0) * 0.25 +
             (np.random.rand(tap_len) * 2 - 1) * np.exp(-t_tap * 80.0) * 0.2)

    num_steps = int(duration_sec / sixteenth_sec)
    for step in range(num_steps):
        if step % 4 in [0, 2] or (step % 8 == 5 and step % 16 != 13):
            start_idx = int(step * sixteenth_sec * sample_rate)
            end_idx = min(total_samples, start_idx + tap_len)
            actual_len = end_idx - start_idx
            if actual_len > 0:
                lvl = 0.22 if step % 4 == 0 else 0.12
                buf[start_idx:end_idx] += click[:actual_len] * lvl

    int16_sig = np.int16(np.clip(buf, -0.95, 0.95) * 32767)
    stereo = np.empty((len(buf) * 2,), dtype=np.int16)
    stereo[0::2] = np.int16(int16_sig * 0.7)
    stereo[1::2] = np.int16(int16_sig * 1.0)
    return AudioSegment(data=stereo.tobytes(), sample_width=2, frame_rate=sample_rate, channels=2)


# ==============================================================================
# BGM 1: THÀNH PHỐ BIỂN HẢI VỌNG (Biển, Hoài niệm, Lãng đãng)
# ==============================================================================

def compose_hai_vong_sea():
    """
    Track 1: Thành phố biển Hải Vọng
    Chủ đề: Biển, hoài niệm, lãng đãng (coastal, nostalgic, breezy).
    Tone: G Major / E Minor, 70 BPM. 16 bars.
    Nhạc cụ: Nylon Guitar, Grand Piano, Cello mộc, Upright Bass, Flute gió biển.
    """
    bpm = 70
    guitar = StemWriter("Nylon Guitar", program=24, bpm=bpm)
    piano = StemWriter("Grand Piano", program=0, bpm=bpm)
    cello = StemWriter("Cello", program=42, bpm=bpm)
    bass = StemWriter("Upright Bass", program=32, bpm=bpm)
    flute = StemWriter("Flute", program=73, bpm=bpm)

    # 16-bar harmony in G Major
    # Bar 1-4: Gmaj7 -> Cmaj7 -> Bm7 -> Em9
    # Bar 5-8: Am7 -> D7sus4 -> Bm7 -> Em7
    # Bar 9-12: Cmaj7 -> D/C -> Bm7 -> Em9
    # Bar 13-16: Am9 -> D7 -> Gmaj7 -> Gmaj7
    guitar_patterns = [
        ['G2', 'D3', 'B3', 'F#4', 'B3', 'D3', 'G3', 'D3'],
        ['C3', 'G3', 'E4', 'B4', 'E4', 'G3', 'C4', 'G3'],
        ['B2', 'F#3', 'D4', 'A4', 'D4', 'F#3', 'B3', 'F#3'],
        ['E2', 'B2', 'G3', 'D4', 'F#4', 'D4', 'G3', 'B2'],

        ['A2', 'E3', 'C4', 'G4', 'C4', 'E3', 'A3', 'E3'],
        ['D2', 'A2', 'D3', 'G3', 'C4', 'G3', 'D3', 'A2'],
        ['B2', 'F#3', 'D4', 'A4', 'D4', 'F#3', 'B3', 'F#3'],
        ['E2', 'B2', 'G3', 'D4', 'G3', 'B2', 'E3', 'B2'],

        ['C3', 'G3', 'E4', 'B4', 'E4', 'G3', 'C4', 'G3'],
        ['C3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'C4', 'A3'],
        ['B2', 'F#3', 'D4', 'F#4', 'D4', 'F#3', 'B3', 'F#3'],
        ['E2', 'B2', 'G3', 'D4', 'F#4', 'D4', 'G3', 'B2'],

        ['A2', 'E3', 'G3', 'B3', 'C4', 'B3', 'G3', 'E3'],
        ['D2', 'A2', 'C3', 'F#3', 'C4', 'F#3', 'C3', 'A2'],
        ['G2', 'D3', 'B3', 'F#4', 'B3', 'D3', 'G3', 'D3'],
        ['G2', 'D3', 'G3', 'B3', 'D4', 'F#4', 'G4', 'B4'],
    ]

    for bar_idx, pattern in enumerate(guitar_patterns):
        t_bar = bar_idx * 4.0
        for step, n in enumerate(pattern):
            vel = 74 if step % 2 == 0 else 66
            guitar.add_note(n, t_bar + step * 0.5, 0.95, velocity=vel)

    # Bassline: Gentle root plucks on 1 and 3
    bass_events = [
        (0.0, 'G1', 2.0), (2.0, 'D2', 1.8),
        (4.0, 'C2', 2.0), (6.0, 'G2', 1.8),
        (8.0, 'B1', 2.0), (10.0, 'F#2', 1.8),
        (12.0, 'E1', 2.0), (14.0, 'B1', 1.8),

        (16.0, 'A1', 2.0), (18.0, 'E2', 1.8),
        (20.0, 'D2', 2.0), (22.0, 'A1', 1.8),
        (24.0, 'B1', 2.0), (26.0, 'F#2', 1.8),
        (28.0, 'E1', 2.0), (30.0, 'B1', 1.8),

        (32.0, 'C2', 2.0), (34.0, 'G2', 1.8),
        (36.0, 'C2', 2.0), (38.0, 'A1', 1.8),
        (40.0, 'B1', 2.0), (42.0, 'F#2', 1.8),
        (44.0, 'E1', 2.0), (46.0, 'B1', 1.8),

        (48.0, 'A1', 2.0), (50.0, 'E2', 1.8),
        (52.0, 'D2', 2.0), (54.0, 'A1', 1.8),
        (56.0, 'G1', 3.0),
        (60.0, 'G1', 3.8),
    ]
    for rel_t, n, dur in bass_events:
        bass.add_note(n, rel_t, dur, velocity=78)

    # Piano: Lyrical nostalgic melody + damper pedal per bar
    for b in range(16):
        piano.add_pedal(b * 4.0, b * 4.0 + 3.8)

    # Piano left hand warm foundation
    lh_piano = [
        (0.0, ['G2', 'D3', 'B3']), (4.0, ['C3', 'G3', 'E4']),
        (8.0, ['B2', 'F#3', 'D4']), (12.0, ['E2', 'B2', 'G3']),
        (16.0, ['A2', 'E3', 'C4']), (20.0, ['D2', 'A2', 'F#3']),
        (24.0, ['B2', 'F#3', 'D4']), (28.0, ['E2', 'B2', 'G3']),
        (32.0, ['C3', 'G3', 'E4']), (36.0, ['C3', 'A3', 'F#4']),
        (40.0, ['B2', 'F#3', 'D4']), (44.0, ['E2', 'B2', 'G3']),
        (48.0, ['A2', 'E3', 'C4']), (52.0, ['D2', 'A2', 'F#3']),
        (56.0, ['G2', 'D3', 'B3']), (60.0, ['G1', 'D2', 'G2', 'B2']),
    ]
    for rel_t, chord in lh_piano:
        for n in chord:
            piano.add_note(n, rel_t, 3.2, velocity=52)

    # Piano right hand: nostalgic coastal lead melody
    rh_melody = [
        # Bar 1: B4 -> D5 -> F#5
        (0.0, 'B4', 1.0, 64), (1.0, 'D5', 1.0, 66), (2.0, 'F#5', 2.0, 68),
        # Bar 2: E5 -> D5 -> B4 -> G4
        (4.0, 'E5', 1.5, 65), (5.5, 'D5', 0.5, 60), (6.0, 'B4', 1.5, 62), (7.5, 'G4', 0.5, 58),
        # Bar 3: F#4 -> A4 -> D5
        (8.0, 'F#4', 1.0, 62), (9.0, 'A4', 1.0, 65), (10.0, 'D5', 2.0, 67),
        # Bar 4: B4 -> A4 -> G4
        (12.0, 'B4', 2.0, 64), (14.0, 'A4', 1.0, 60), (15.0, 'G4', 1.0, 58),
        # Bar 5: E4 -> G4 -> C5 -> B4
        (16.0, 'E4', 1.0, 62), (17.0, 'G4', 1.0, 64), (18.0, 'C5', 1.5, 66), (19.5, 'B4', 0.5, 60),
        # Bar 6: A4 -> B4 -> C5 -> D5
        (20.0, 'A4', 1.5, 62), (21.5, 'B4', 0.5, 60), (22.0, 'C5', 1.0, 63), (23.0, 'D5', 1.0, 65),
        # Bar 7: D5 -> F#5 -> A5 -> G5
        (24.0, 'D5', 1.0, 64), (25.0, 'F#5', 1.0, 66), (26.0, 'A5', 1.5, 68), (27.5, 'G5', 0.5, 62),
        # Bar 8: E5 -> D5 -> B4
        (28.0, 'E5', 2.0, 64), (30.0, 'D5', 1.0, 60), (31.0, 'B4', 1.0, 58),
        # Bar 9-10 (Gió biển lộng trên đồi ngắm hải đăng)
        (32.0, 'G4', 1.0, 62), (33.0, 'B4', 1.0, 65), (34.0, 'D5', 1.5, 67), (35.5, 'F#5', 0.5, 64),
        (36.0, 'G5', 1.5, 68), (37.5, 'F#5', 0.5, 62), (38.0, 'D5', 1.5, 64), (39.5, 'A4', 0.5, 60),
        # Bar 11-12
        (40.0, 'B4', 1.0, 63), (41.0, 'D5', 1.0, 65), (42.0, 'F#5', 1.5, 67), (43.5, 'E5', 0.5, 62),
        (44.0, 'D5', 2.0, 64), (46.0, 'B4', 1.0, 60), (47.0, 'G4', 1.0, 58),
        # Bar 13-14 (Hồi kết lắng đọng về lại bờ cát)
        (48.0, 'E4', 1.0, 60), (49.0, 'G4', 1.0, 62), (50.0, 'B4', 1.5, 64), (51.5, 'D5', 0.5, 62),
        (52.0, 'C5', 1.5, 62), (53.5, 'B4', 0.5, 60), (54.0, 'A4', 1.0, 58), (55.0, 'F#4', 1.0, 56),
        # Bar 15-16
        (56.0, 'G4', 1.0, 60), (57.0, 'B4', 1.0, 62), (58.0, 'D5', 1.5, 64), (59.5, 'F#5', 0.5, 62),
        (60.0, 'G5', 4.0, 65),
    ]
    for rel_t, n, dur, vel in rh_melody:
        piano.add_note(n, rel_t, dur, velocity=vel)

    # Cello: Expressive counter-melody with breathing pauses
    cello_notes = [
        (5.0, 'G3', 1.5, 70), (6.5, 'B3', 1.5, 72),
        (9.0, 'F#3', 1.5, 72), (10.5, 'A3', 1.5, 74), (12.0, 'G3', 2.0, 72),
        (17.0, 'C3', 1.5, 68), (18.5, 'E3', 1.5, 70), (20.0, 'F#3', 2.0, 72),
        (25.0, 'F#3', 1.5, 72), (26.5, 'A3', 1.5, 74), (28.0, 'G3', 2.5, 72),
        # High arch in section B
        (33.0, 'E3', 1.5, 70), (34.5, 'G3', 1.5, 73), (36.0, 'A3', 2.0, 75),
        (41.0, 'F#3', 1.5, 72), (42.5, 'A3', 1.5, 74), (44.0, 'B3', 2.0, 73),
        (49.0, 'G3', 1.5, 70), (50.5, 'E3', 1.5, 68), (52.0, 'F#3', 2.0, 70),
        (56.0, 'G3', 3.5, 68),
    ]
    for rel_t, n, dur, vel in cello_notes:
        cello.add_note(n, rel_t, dur, velocity=vel)

    # Flute: Breezy soaring high notes in section B & outro
    flute_notes = [
        (34.0, 'D6', 1.5, 68), (35.5, 'E6', 1.0, 70), (36.5, 'F#6', 2.0, 72),
        (42.0, 'F#6', 1.5, 70), (43.5, 'G6', 1.0, 72), (44.5, 'D6', 2.0, 70),
        (50.0, 'B5', 1.5, 66), (51.5, 'C6', 1.0, 68), (52.5, 'D6', 2.0, 70),
        (57.0, 'B5', 1.5, 68), (58.5, 'A5', 1.5, 66), (60.0, 'G5', 3.5, 70),
    ]
    for rel_t, n, dur, vel in flute_notes:
        flute.add_note(n, rel_t, dur, velocity=vel)

    stems = [guitar, piano, cello, bass, flute]
    # Mixing params: (gain_db, pan, delay_ms)
    mix_params = {
        "Nylon Guitar": (9.5, 0.35),
        "Grand Piano": (1.0, -0.15),
        "Cello": (6.5, -0.32),
        "Upright Bass": (7.5, 0.0),
        "Flute": (4.0, 0.22),
    }
    return bpm, stems, mix_params, True # Has sea breeze


# ==============================================================================
# BGM 2: PHÒNG CLB BÁO CHÍ TĨNH TÂM (Đời thường học đường, Ấm cúng)
# ==============================================================================

def compose_clb_tinh_tam():
    """
    Track 2: Phòng CLB Báo chí Tĩnh Tâm
    Chủ đề: Đời thường học đường, ấm cúng (school life, warm, cozy, companionable).
    Tone: D Major, 84 BPM. 16 bars.
    Nhạc cụ: Grand Piano, Nylon Guitar, Upright Bass, Vibraphone, Cello.
    """
    bpm = 84
    piano = StemWriter("Grand Piano", program=0, bpm=bpm)
    guitar = StemWriter("Nylon Guitar", program=24, bpm=bpm)
    bass = StemWriter("Upright Bass", program=32, bpm=bpm)
    vib = StemWriter("Vibraphone", program=11, bpm=bpm)
    cello = StemWriter("Cello", program=42, bpm=bpm)

    # 16-bar harmony in D Major
    # Bar 1-4: Dmaj7 -> Em7 -> F#m7 -> Gmaj7
    # Bar 5-8: F#m7 -> Bm7 -> Em9 -> A7
    # Bar 9-12: Gmaj7 -> A/G -> F#m7 -> Bm7
    # Bar 13-16: Em7 -> A7sus4 -> Dmaj7 -> D
    guitar_patterns = [
        ['D3', 'A3', 'F#4', 'A3', 'D4', 'A3', 'F#4', 'A3'],
        ['E3', 'B3', 'G4', 'B3', 'E4', 'B3', 'G4', 'B3'],
        ['F#3', 'C#4', 'A4', 'C#4', 'F#4', 'C#4', 'A4', 'C#4'],
        ['G3', 'D4', 'B4', 'D4', 'G4', 'D4', 'B4', 'D4'],

        ['F#3', 'C#4', 'A4', 'C#4', 'F#4', 'C#4', 'A4', 'C#4'],
        ['B2', 'F#3', 'D4', 'F#3', 'B3', 'F#3', 'D4', 'F#3'],
        ['E2', 'B2', 'G3', 'D4', 'G3', 'B2', 'E3', 'B2'],
        ['A2', 'E3', 'G3', 'C#4', 'G3', 'E3', 'A3', 'E3'],

        ['G2', 'D3', 'B3', 'F#4', 'B3', 'D3', 'G3', 'D3'],
        ['G2', 'E3', 'A3', 'C#4', 'A3', 'E3', 'G3', 'E3'],
        ['F#2', 'C#3', 'A3', 'E4', 'A3', 'C#3', 'F#3', 'C#3'],
        ['B2', 'F#3', 'D4', 'A4', 'D4', 'F#3', 'B3', 'F#3'],

        ['E2', 'B2', 'G3', 'D4', 'G3', 'B2', 'E3', 'B2'],
        ['A2', 'E3', 'D4', 'G4', 'D4', 'E3', 'A3', 'E3'],
        ['D3', 'A3', 'F#4', 'C#5', 'F#4', 'A3', 'D4', 'A3'],
        ['D3', 'A3', 'D4', 'F#4'],
    ]
    for bar_idx, pattern in enumerate(guitar_patterns):
        t_bar = bar_idx * 4.0
        if bar_idx == 15:
            for n_idx, n in enumerate(pattern):
                guitar.add_note(n, t_bar + n_idx * 0.1, 3.2, velocity=76)
        else:
            for step, n in enumerate(pattern):
                vel = 76 if step % 2 == 0 else 68
                guitar.add_note(n, t_bar + step * 0.5, 0.9, velocity=vel)

    # Upright Bass: lively syncopated root and 5th
    bass_lines = [
        (0.0, 'D2', 1.5), (2.0, 'A2', 1.5),
        (4.0, 'E2', 1.5), (6.0, 'B2', 1.5),
        (8.0, 'F#2', 1.5), (10.0, 'C#3', 1.5),
        (12.0, 'G2', 1.5), (14.0, 'D3', 1.5),

        (16.0, 'F#2', 1.5), (18.0, 'C#3', 1.5),
        (20.0, 'B1', 1.5), (22.0, 'F#2', 1.5),
        (24.0, 'E2', 1.5), (26.0, 'B2', 1.5),
        (28.0, 'A1', 1.5), (30.0, 'E2', 1.5),

        (32.0, 'G1', 1.5), (34.0, 'D2', 1.5),
        (36.0, 'A1', 1.5), (38.0, 'E2', 1.5),
        (40.0, 'F#1', 1.5), (42.0, 'C#2', 1.5),
        (44.0, 'B1', 1.5), (46.0, 'F#2', 1.5),

        (48.0, 'E1', 1.5), (50.0, 'B1', 1.5),
        (52.0, 'A1', 1.5), (54.0, 'E2', 1.5),
        (56.0, 'D2', 2.5),
        (60.0, 'D1', 3.5),
    ]
    for rel_t, n, dur in bass_lines:
        bass.add_note(n, rel_t, dur, velocity=82)

    # Piano: Cozy school melody & bounce chords
    for b in range(16):
        piano.add_pedal(b * 4.0, b * 4.0 + 3.6)

    # Left hand bouncy comping chords
    piano_lh = [
        (0.0, ['D3', 'F#3']), (2.0, ['A3', 'C#4']),
        (4.0, ['E3', 'G3']), (6.0, ['B3', 'D4']),
        (8.0, ['F#3', 'A3']), (10.0, ['C#4', 'E4']),
        (12.0, ['G3', 'B3']), (14.0, ['D4', 'F#4']),

        (16.0, ['F#3', 'A3']), (18.0, ['C#4', 'E4']),
        (20.0, ['B2', 'D3']), (22.0, ['F#3', 'A3']),
        (24.0, ['E2', 'G2']), (26.0, ['B2', 'D3']),
        (28.0, ['A2', 'C#3']), (30.0, ['E3', 'G3']),

        (32.0, ['G2', 'B2']), (34.0, ['D3', 'F#3']),
        (36.0, ['A2', 'C#3']), (38.0, ['E3', 'G3']),
        (40.0, ['F#2', 'A2']), (42.0, ['C#3', 'E3']),
        (44.0, ['B2', 'D3']), (46.0, ['F#3', 'A3']),

        (48.0, ['E2', 'G2']), (50.0, ['B2', 'D3']),
        (52.0, ['A2', 'C#3']), (54.0, ['E3', 'G3']),
        (56.0, ['D3', 'F#3', 'A3']), (60.0, ['D2', 'A2', 'D3', 'F#3']),
    ]
    for rel_t, chord in piano_lh:
        for n in chord:
            piano.add_note(n, rel_t, 1.6, velocity=54)

    # Right hand lead melody: youthful, bright, warm
    piano_rh = [
        (0.0, 'F#4', 1.0, 66), (1.0, 'A4', 1.0, 68), (2.0, 'D5', 1.5, 70), (3.5, 'C#5', 0.5, 62),
        (4.0, 'B4', 1.0, 66), (5.0, 'D5', 1.0, 68), (6.0, 'E5', 1.5, 70), (7.5, 'D5', 0.5, 62),
        (8.0, 'C#5', 1.0, 66), (9.0, 'E5', 1.0, 68), (10.0, 'F#5', 1.5, 72), (11.5, 'E5', 0.5, 62),
        (12.0, 'D5', 1.0, 68), (13.0, 'F#5', 1.0, 70), (14.0, 'G5', 1.5, 72), (15.5, 'F#5', 0.5, 64),

        (16.0, 'A5', 1.5, 72), (17.5, 'F#5', 0.5, 64), (18.0, 'E5', 1.0, 66), (19.0, 'D5', 1.0, 64),
        (20.0, 'F#5', 1.5, 68), (21.5, 'D5', 0.5, 62), (22.0, 'B4', 1.0, 64), (23.0, 'A4', 1.0, 62),
        (24.0, 'G4', 1.0, 64), (25.0, 'B4', 1.0, 66), (26.0, 'D5', 1.0, 68), (27.0, 'E5', 1.0, 70),
        (28.0, 'C#5', 2.0, 66), (30.0, 'D5', 2.0, 68),

        (32.0, 'D5', 1.0, 68), (33.0, 'F#5', 1.0, 70), (34.0, 'A5', 1.5, 72), (35.5, 'G5', 0.5, 64),
        (36.0, 'E5', 1.0, 68), (37.0, 'G5', 1.0, 70), (38.0, 'B5', 1.5, 72), (39.5, 'A5', 0.5, 64),
        (40.0, 'F#5', 1.0, 70), (41.0, 'A5', 1.0, 72), (42.0, 'D6', 1.5, 74), (43.5, 'C#6', 0.5, 66),
        (44.0, 'B5', 1.5, 70), (45.5, 'A5', 0.5, 64), (46.0, 'F#5', 1.0, 66), (47.0, 'D5', 1.0, 64),

        (48.0, 'E5', 1.0, 66), (49.0, 'F#5', 1.0, 68), (50.0, 'G5', 1.5, 70), (51.5, 'F#5', 0.5, 64),
        (52.0, 'E5', 1.0, 66), (53.0, 'D5', 1.0, 64), (54.0, 'C#5', 1.0, 64), (55.0, 'E5', 1.0, 66),
        (56.0, 'D5', 1.5, 68), (57.5, 'F#4', 0.5, 62), (58.0, 'A4', 1.0, 64), (59.0, 'D5', 1.0, 66),
        (60.0, 'D5', 3.5, 68),
    ]
    for rel_t, n, dur, vel in piano_rh:
        piano.add_note(n, rel_t, dur, velocity=vel)

    # Vibraphone: Playful crystalline bell counter-motifs
    vib_notes = [
        (2.0, 'F#5', 1.0, 66), (3.0, 'A5', 1.0, 68),
        (6.0, 'G5', 1.0, 66), (7.0, 'B5', 1.0, 68),
        (10.0, 'A5', 1.0, 68), (11.0, 'C#6', 1.0, 70),
        (14.0, 'B5', 1.0, 68), (15.0, 'D6', 1.0, 70),
        (22.0, 'F#5', 1.0, 66), (23.0, 'A5', 1.0, 68),
        (30.0, 'E5', 1.0, 66), (31.0, 'F#5', 1.0, 68),
        (34.0, 'D6', 1.0, 70), (35.0, 'F#6', 1.0, 72),
        (38.0, 'E6', 1.0, 70), (39.0, 'G6', 1.0, 72),
        (42.0, 'F#6', 1.0, 72), (43.0, 'A6', 1.0, 74),
        (54.0, 'E5', 1.0, 68), (55.0, 'G5', 1.0, 70),
        (58.0, 'F#5', 1.0, 68), (59.0, 'A5', 1.0, 70), (60.0, 'D6', 3.0, 72),
    ]
    for rel_t, n, dur, vel in vib_notes:
        vib.add_note(n, rel_t, dur, velocity=vel)

    # Cello: Warm harmonic companion in section B
    cello_notes = [
        (32.0, 'G3', 1.5, 70), (33.5, 'B3', 1.5, 72), (35.0, 'D4', 1.5, 74),
        (37.0, 'A3', 1.5, 72), (38.5, 'C#4', 1.5, 74), (40.0, 'F#3', 2.0, 70),
        (44.0, 'B3', 2.0, 72), (46.0, 'F#3', 1.5, 70),
        (49.0, 'E3', 1.5, 68), (50.5, 'G3', 1.5, 70), (52.0, 'A3', 2.0, 72),
        (56.0, 'D3', 3.5, 70),
    ]
    for rel_t, n, dur, vel in cello_notes:
        cello.add_note(n, rel_t, dur, velocity=vel)

    stems = [piano, guitar, bass, vib, cello]
    mix_params = {
        "Grand Piano": (1.0, -0.18),
        "Nylon Guitar": (9.0, 0.35),
        "Upright Bass": (7.5, 0.0),
        "Vibraphone": (5.0, 0.22),
        "Cello": (6.0, -0.32),
    }
    return bpm, stems, mix_params, False # No sea breeze


# ==============================================================================
# BGM 3: TÁC NGHIỆP HIỆN TRƯỜNG (Tập trung, Nhịp điệu điều tra)
# ==============================================================================

def compose_investigation():
    """
    Track 3: Tác nghiệp hiện trường
    Chủ đề: Tập trung, nhịp điệu điều tra (inquisitive detective groove, fieldwork jazz).
    Tone: C Minor / C Dorian, 100 BPM. 16 bars.
    Nhạc cụ: Upright Bass (Walking), Electric Piano (Rhodes), Vibraphone, Grand Piano, Typewriter Foley.
    """
    bpm = 100
    bass = StemWriter("Upright Bass", program=32, bpm=bpm)
    rhodes = StemWriter("Electric Piano", program=4, bpm=bpm)
    vib = StemWriter("Vibraphone", program=11, bpm=bpm)
    piano = StemWriter("Grand Piano", program=0, bpm=bpm)

    # 16-bar harmony in C Minor
    # Bar 1-4: Cm9 -> Fm9 -> Bb13 -> Ebmaj7#11
    # Bar 5-8: Abmaj7 -> Dm7b5 -> G7alt -> Cm9
    # Bar 9-12: Bbm9 -> Eb9 -> Abmaj9 -> Db9
    # Bar 13-16: Dm7b5 -> G7b9 -> Cm9 -> Cm
    bass_walk = [
        # Bar 1 (Cm9)
        ['C2', 'Eb2', 'G2', 'Bb2'],
        # Bar 2 (Fm9)
        ['F2', 'Ab2', 'C3', 'Eb2'],
        # Bar 3 (Bb13)
        ['Bb2', 'D3', 'F2', 'Ab2'],
        # Bar 4 (Ebmaj7)
        ['Eb2', 'G2', 'Bb2', 'D3'],
        # Bar 5 (Abmaj7)
        ['Ab2', 'C3', 'Eb2', 'G2'],
        # Bar 6 (Dm7b5)
        ['D2', 'F2', 'Ab2', 'C3'],
        # Bar 7 (G7alt)
        ['G2', 'B2', 'D3', 'F2'],
        # Bar 8 (Cm9)
        ['C2', 'G2', 'Eb2', 'D2'],
        # Bar 9 (Bbm9)
        ['Bb2', 'Db3', 'F2', 'Ab2'],
        # Bar 10 (Eb9)
        ['Eb2', 'G2', 'Db3', 'Bb2'],
        # Bar 11 (Abmaj9)
        ['Ab2', 'C3', 'Eb2', 'G2'],
        # Bar 12 (Db9)
        ['Db2', 'F2', 'Ab2', 'B2'],
        # Bar 13 (Dm7b5)
        ['D2', 'F2', 'Ab2', 'C3'],
        # Bar 14 (G7b9)
        ['G2', 'B2', 'D3', 'F2'],
        # Bar 15 (Cm9)
        ['C2', 'Eb2', 'G2', 'Bb2'],
        # Bar 16 (Cm resolve)
        ['C2', 'G2', 'Eb2', 'C2'],
    ]
    for bar_idx, notes in enumerate(bass_walk):
        t_bar = bar_idx * 4.0
        for step, n in enumerate(notes):
            t_note = t_bar + step * 1.0
            if step % 2 == 1: # Swing feel
                t_note += 0.08
            bass.add_note(n, t_note, 0.9, velocity=84)

    # Rhodes: Off-beat jazz stabs (beats 1.5 & 3.0)
    chords_rhodes = [
        (['Eb3', 'G3', 'Bb3', 'D4']),
        (['Eb3', 'Ab3', 'C4', 'Eb4']),
        (['D3', 'Ab3', 'C4', 'G4']),
        (['G3', 'Bb3', 'D4', 'A4']),
        (['C3', 'Eb3', 'G3', 'C4']),
        (['F3', 'Ab3', 'C4', 'F4']),
        (['F3', 'Bb3', 'Db4', 'Eb4']),
        (['Eb3', 'G3', 'Bb3', 'D4']),
        (['Db3', 'F3', 'Ab3', 'C4']),
        (['Db3', 'G3', 'Bb3', 'F4']),
        (['C3', 'Eb3', 'G3', 'Bb3']),
        (['B2', 'F3', 'Ab3', 'Eb4']),
        (['F3', 'Ab3', 'C4', 'F4']),
        (['F3', 'Ab3', 'B3', 'D4']),
        (['Eb3', 'G3', 'Bb3', 'D4']),
        (['C3', 'Eb3', 'G3', 'C4']),
    ]
    for bar_idx, chord in enumerate(chords_rhodes):
        t_bar = bar_idx * 4.0
        # Stabs on off-beats
        for st_offset in [1.5, 3.0]:
            for n in chord:
                rhodes.add_note(n, t_bar + st_offset, 0.8, velocity=66)

    # Vibraphone: Sharp inquisitive detective lead melody
    vib_riffs = [
        # Bar 1-2: C5 -> Eb5 -> D5 -> G4 -> Bb4 -> C5
        (0.0, 'C5', 0.5, 80), (0.75, 'Eb5', 0.5, 84), (1.5, 'D5', 1.0, 78), (3.0, 'G4', 1.5, 82),
        (5.0, 'Bb4', 0.5, 76), (6.0, 'C5', 1.5, 84),
        # Bar 3-4: F5 -> D5 -> Eb5 -> C5
        (8.0, 'F5', 0.75, 84), (9.0, 'D5', 0.75, 80), (10.0, 'Eb5', 1.0, 82), (11.5, 'C5', 2.0, 88),
        # Bar 5-6: Ab4 -> C5 -> Eb5 -> G5 -> F#5
        (16.0, 'Ab4', 0.5, 78), (17.0, 'C5', 0.5, 80), (18.0, 'Eb5', 0.75, 85), (19.25, 'G5', 0.75, 90),
        (20.5, 'F#5', 1.5, 88),
        # Bar 7-8: F5 -> D5 -> B4 -> C5
        (24.0, 'F5', 0.5, 82), (25.0, 'D5', 0.5, 80), (26.0, 'B4', 1.0, 85), (27.5, 'C5', 2.5, 92),
        # Bar 9-10: (Shift to deeper mystery)
        (32.0, 'Db5', 0.75, 85), (33.0, 'F5', 0.75, 88), (34.5, 'Eb5', 1.5, 82),
        (37.0, 'C5', 1.0, 80), (38.5, 'Ab4', 1.5, 85),
        # Bar 11-12
        (40.0, 'Bb4', 0.5, 80), (41.0, 'Db5', 0.5, 85), (42.0, 'C5', 1.0, 88), (44.0, 'G4', 2.0, 82),
        # Bar 13-14: Dm7b5 -> G7b9
        (48.0, 'Ab4', 0.5, 78), (49.0, 'D5', 0.75, 85), (50.5, 'Eb5', 0.5, 88), (51.5, 'F5', 1.5, 85),
        # Bar 15-16: Loop cadence
        (56.0, 'G5', 0.75, 92), (57.0, 'Eb5', 0.75, 85), (58.0, 'D5', 1.0, 82), (59.5, 'C5', 3.0, 95),
    ]
    for rel_t, n, dur, vel in vib_riffs:
        vib.add_note(n, rel_t, dur, velocity=vel)

    # Piano: Mystery staccato hits & low register weight
    piano_hits = [
        (0.0, 'C2', 0.8, 80), (8.0, 'Bb1', 0.8, 80),
        (16.0, 'Ab1', 0.8, 80), (24.0, 'G1', 0.8, 85),
        (32.0, 'Bb1', 0.8, 80), (40.0, 'Ab1', 0.8, 80),
        (48.0, 'D2', 0.8, 82), (52.0, 'G1', 0.8, 85),
        (56.0, 'C2', 1.8, 88), (60.0, 'C1', 2.8, 90),
    ]
    for rel_t, n, dur, vel in piano_hits:
        piano.add_note(n, rel_t, dur, velocity=vel)

    stems = [bass, rhodes, vib, piano]
    mix_params = {
        "Upright Bass": (8.5, 0.0),
        "Electric Piano": (6.0, -0.25),
        "Vibraphone": (5.5, 0.28),
        "Grand Piano": (3.0, -0.1),
    }
    return bpm, stems, mix_params, False, True # Has typewriter foley


# ==============================================================================
# BGM 4: ĐÊM TĨNH LẶNG / HẸN HÒ (Thư thái, Nhẹ nhàng, Lãng mạn)
# ==============================================================================

def compose_night_romance():
    """
    Track 4: Đêm tĩnh lặng / Hẹn hò
    Chủ đề: Thư thái, nhẹ nhàng, lãng mạn, yên bình (relaxing, gentle night, tender romance).
    Tone: E Major, 66 BPM. 16 bars.
    Nhạc cụ: Electric Piano (Rhodes), Nylon Guitar, Cello mộc, Upright Bass, Music Box.
    """
    bpm = 66
    rhodes = StemWriter("Electric Piano", program=4, bpm=bpm)
    guitar = StemWriter("Nylon Guitar", program=24, bpm=bpm)
    cello = StemWriter("Cello", program=42, bpm=bpm)
    bass = StemWriter("Upright Bass", program=32, bpm=bpm)
    mbox = StemWriter("Music Box", program=10, bpm=bpm)

    # 16-bar harmony in E Major
    # Bar 1-4: Emaj9 -> G#m7 -> Aadd9 -> B7sus4
    # Bar 5-8: C#m9 -> G#m7 -> F#m9 -> B7
    # Bar 9-12: Aadd9 -> B/A -> G#m7 -> C#m7
    # Bar 13-16: F#m9 -> B7sus4 -> Emaj9 -> E
    guitar_arps = [
        ['E2', 'B2', 'G#3', 'D#4', 'G#3', 'B2', 'E3', 'B2'],
        ['G#2', 'D#3', 'F#3', 'B3', 'F#3', 'D#3', 'G#3', 'D#3'],
        ['A2', 'E3', 'B3', 'C#4', 'B3', 'E3', 'A3', 'E3'],
        ['B2', 'F#3', 'A3', 'E4', 'A3', 'F#3', 'B3', 'F#3'],

        ['C#2', 'G#2', 'E3', 'B3', 'E3', 'G#2', 'C#3', 'G#2'],
        ['G#2', 'D#3', 'F#3', 'B3', 'F#3', 'D#3', 'G#3', 'D#3'],
        ['F#2', 'C#3', 'A3', 'E4', 'A3', 'C#3', 'F#3', 'C#3'],
        ['B2', 'F#3', 'A3', 'D#4', 'A3', 'F#3', 'B3', 'F#3'],

        ['A2', 'E3', 'B3', 'C#4', 'G#4', 'C#4', 'B3', 'E3'],
        ['A2', 'F#3', 'B3', 'D#4', 'F#4', 'D#4', 'B3', 'F#3'],
        ['G#2', 'D#3', 'F#3', 'B3', 'D#4', 'B3', 'F#3', 'D#3'],
        ['C#2', 'G#2', 'E3', 'B3', 'E4', 'B3', 'E3', 'G#2'],

        ['F#2', 'C#3', 'A3', 'E4', 'G#4', 'E4', 'A3', 'C#3'],
        ['B2', 'F#3', 'A3', 'E4', 'F#4', 'E4', 'A3', 'F#3'],
        ['E2', 'B2', 'G#3', 'D#4', 'F#4', 'D#4', 'G#3', 'B2'],
        ['E2', 'B2', 'E3', 'G#3'],
    ]
    for bar_idx, pattern in enumerate(guitar_arps):
        t_bar = bar_idx * 4.0
        if bar_idx == 15:
            for n_idx, n in enumerate(pattern):
                guitar.add_note(n, t_bar + n_idx * 0.12, 3.5, velocity=70)
        else:
            for step, n in enumerate(pattern):
                vel = 72 if step % 2 == 0 else 64
                guitar.add_note(n, t_bar + step * 0.5, 0.95, velocity=vel)

    # Upright Bass: deep warm foundation
    bass_notes = [
        (0.0, 'E1', 3.5), (4.0, 'G#1', 3.5), (8.0, 'A1', 3.5), (12.0, 'B1', 3.5),
        (16.0, 'C#1', 3.5), (20.0, 'G#1', 3.5), (24.0, 'F#1', 3.5), (28.0, 'B1', 3.5),
        (32.0, 'A1', 3.5), (36.0, 'A1', 3.5), (40.0, 'G#1', 3.5), (44.0, 'C#1', 3.5),
        (48.0, 'F#1', 3.5), (52.0, 'B1', 3.5), (56.0, 'E1', 3.5), (60.0, 'E1', 3.8),
    ]
    for rel_t, n, dur in bass_notes:
        bass.add_note(n, rel_t, dur, velocity=76)

    # Rhodes: Tender nocturnal romance lead & warm pads
    rhodes_melody = [
        # Bar 1-2: G#4 -> B4 -> F#5 -> E5 -> D#5 -> C#5 -> B4
        (0.0, 'G#4', 1.0, 68), (1.0, 'B4', 1.0, 70), (2.0, 'F#5', 2.0, 72),
        (4.0, 'E5', 1.5, 68), (5.5, 'D#5', 0.5, 62), (6.0, 'C#5', 1.5, 65), (7.5, 'B4', 0.5, 60),
        # Bar 3-4: C#5 -> E5 -> G#5 -> F#5 -> E5 -> D#5
        (8.0, 'C#5', 1.0, 66), (9.0, 'E5', 1.0, 68), (10.0, 'G#5', 2.0, 72),
        (12.0, 'F#5', 1.5, 68), (13.5, 'E5', 0.5, 62), (14.0, 'D#5', 2.0, 65),
        # Bar 5-6: D#5 -> F#5 -> G#5 -> F#5 -> E5 -> D#5 -> B4
        (16.0, 'D#5', 1.0, 66), (17.0, 'F#5', 1.0, 68), (18.0, 'G#5', 1.5, 72), (19.5, 'F#5', 0.5, 64),
        (20.0, 'E5', 1.5, 68), (21.5, 'D#5', 0.5, 62), (22.0, 'B4', 2.0, 65),
        # Bar 7-8: G#4 -> B4 -> C#5 -> E5 -> D#5 -> F#5
        (24.0, 'G#4', 1.0, 64), (25.0, 'B4', 1.0, 66), (26.0, 'C#5', 1.0, 68), (27.0, 'E5', 1.0, 70),
        (28.0, 'D#5', 2.0, 66), (30.0, 'F#5', 2.0, 68),
        # Bar 9-10 (Khoảnh khắc rung động, ánh mắt chạm nhau)
        (32.0, 'G#5', 1.5, 72), (33.5, 'F#5', 0.5, 65), (34.0, 'E5', 1.5, 68), (35.5, 'D#5', 0.5, 62),
        (36.0, 'F#5', 1.5, 70), (37.5, 'E5', 0.5, 64), (38.0, 'D#5', 1.5, 66), (39.5, 'C#5', 0.5, 60),
        # Bar 11-12
        (40.0, 'D#5', 2.0, 66), (42.0, 'B4', 1.5, 64), (43.5, 'G#4', 0.5, 58),
        (44.0, 'C#5', 2.0, 66), (46.0, 'E5', 1.0, 68), (47.0, 'G#5', 1.0, 70),
        # Bar 13-14 (Lời chưa nói tan vào đêm Hải Vọng)
        (48.0, 'F#5', 1.5, 68), (49.5, 'E5', 0.5, 64), (50.0, 'D#5', 1.5, 66), (51.5, 'C#5', 0.5, 60),
        (52.0, 'D#5', 2.0, 66), (54.0, 'F#5', 2.0, 68),
        # Bar 15-16
        (56.0, 'E5', 1.5, 68), (57.5, 'G#4', 0.5, 62), (58.0, 'B4', 1.5, 65), (59.5, 'D#5', 0.5, 62),
        (60.0, 'E5', 4.0, 68),
    ]
    for rel_t, n, dur, vel in rhodes_melody:
        rhodes.add_note(n, rel_t, dur, velocity=vel)

    # Cello: Lush, romantic legato counterpoint
    cello_notes = [
        (4.0, 'G#3', 1.5, 70), (5.5, 'B3', 1.5, 72), (7.0, 'D#4', 1.5, 74),
        (10.0, 'E4', 2.0, 72), (12.0, 'B3', 2.0, 70),
        (18.0, 'G#3', 1.5, 70), (19.5, 'B3', 1.5, 72), (21.0, 'C#4', 2.0, 73),
        (26.0, 'A3', 1.5, 68), (27.5, 'C#4', 1.5, 70), (29.0, 'B3', 2.5, 72),
        (34.0, 'C#4', 1.5, 72), (35.5, 'E4', 1.5, 74), (37.0, 'D#4', 2.0, 72),
        (42.0, 'B3', 1.5, 70), (43.5, 'D#4', 1.5, 72), (45.0, 'E4', 2.0, 74),
        (50.0, 'A3', 1.5, 68), (51.5, 'C#4', 1.5, 70), (53.0, 'B3', 2.0, 72),
        (56.0, 'E3', 3.5, 70),
    ]
    for rel_t, n, dur, vel in cello_notes:
        cello.add_note(n, rel_t, dur, velocity=vel)

    # Music Box: Starlit sparkling bells
    mbox_notes = [
        (2.0, 'F#6', 1.0, 60), (4.0, 'E6', 1.0, 60),
        (10.0, 'G#6', 1.0, 62), (12.0, 'F#6', 1.0, 60),
        (18.0, 'G#6', 1.0, 62), (22.0, 'B5', 1.0, 58),
        (34.0, 'E6', 1.0, 62), (36.0, 'F#6', 1.0, 62),
        (42.0, 'B5', 1.0, 60), (46.0, 'E6', 1.0, 62),
        (50.0, 'D#6', 1.0, 60), (54.0, 'F#6', 1.0, 62),
        (58.0, 'G#6', 1.0, 64), (60.0, 'E6', 3.0, 62),
    ]
    for rel_t, n, dur, vel in mbox_notes:
        mbox.add_note(n, rel_t, dur, velocity=vel)

    stems = [rhodes, guitar, cello, bass, mbox]
    mix_params = {
        "Electric Piano": (6.5, -0.22),
        "Nylon Guitar": (8.5, 0.35),
        "Cello": (6.0, -0.32),
        "Upright Bass": (7.0, 0.0),
        "Music Box": (4.0, 0.25),
    }
    return bpm, stems, mix_params, False # No sea breeze


# ==============================================================================
# PIPELINE RENDERER & MASTERING
# ==============================================================================

def render_track(track_info, out_dir, sf_path):
    track_id, composer_func, title, filename_base, desc = track_info
    print(f"\n==================================================")
    print(f"[{track_id}] {title}")
    print(f"Chủ đề: {desc}")
    print(f"==================================================")

    res = composer_func()
    has_typewriter = False
    if len(res) == 4:
        bpm, stems, mix_params, has_breeze = res
    else:
        bpm, stems, mix_params, has_breeze, has_typewriter = res

    temp_dir = os.path.join(out_dir, "temp_stems")
    os.makedirs(temp_dir, exist_ok=True)

    # 1. Export Combined Multi-track MIDI
    full_mid_path = os.path.join(out_dir, f"{filename_base}.mid")
    export_combined_midi(stems, bpm, full_mid_path, title=title)
    print(f"-> [MIDI Master] Saved: {full_mid_path}")

    # 2. Render Stems with SoundFont
    loader = sf2_loader.sf2_loader(sf_path)
    stem_audios = []

    for idx, stem in enumerate(stems):
        safe_name = stem.name.lower().replace(" ", "_")
        stem_mid = os.path.join(temp_dir, f"{filename_base}_stem_{safe_name}.mid")
        stem_wav = os.path.join(temp_dir, f"{filename_base}_stem_{safe_name}.wav")
        stem.export_stem_midi(stem_mid)
        loader.export_midi_file(stem_mid, name=stem_wav, format="wav")

        gain_db, pan = mix_params.get(stem.name, (0.0, 0.0))
        audio = AudioSegment.from_file(stem_wav)
        audio = audio.apply_gain(gain_db).pan(pan)
        stem_audios.append((stem.name, audio))
        print(f"   * Stem [{stem.name}]: Gain={gain_db:+.1f}dB, Pan={pan:+.2f}, Dur={len(audio)/1000:.1f}s")

    # 3. Mixdown Stems
    max_len = max(len(aud) for _, aud in stem_audios)
    mix = AudioSegment.silent(duration=max_len)
    for _, aud in stem_audios:
        mix = mix.overlay(aud)

    # 4. Add Atmosphere Textures if requested
    dur_sec = max_len / 1000.0
    if has_breeze:
        print("   * Atmosphere Texture: Sea Breeze from Hải Vọng bay (-22dB)")
        breeze = generate_sea_breeze(dur_sec).apply_gain(-22.0)
        mix = mix.overlay(breeze)

    if has_typewriter:
        print("   * Atmosphere Texture: Journalism Typewriter Mechanical Clicks (-18dB)")
        typewriter = generate_typewriter_track(dur_sec, bpm=bpm).apply_gain(-18.0)
        mix = mix.overlay(typewriter)

    # 5. Master Normalization (-1.0 dBFS headroom)
    master = normalize(mix, headroom=1.0)
    master_wav_path = os.path.join(out_dir, f"{filename_base}.wav")
    master.export(master_wav_path, format="wav")
    print(f"[SUCCESS] Master Audio Exported: {master_wav_path}")
    print(f"Duration: {len(master)/1000:.2f}s | dBFS: {master.dBFS:.2f} | File Size: {os.path.getsize(master_wav_path):,} bytes")

    return full_mid_path, master_wav_path


def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(root_dir, "assets", "audio", "bgm")
    sf_path = os.path.join(root_dir, "assets", "audio", "soundfont", "TimGM6mb.sf2")

    if not os.path.exists(sf_path):
        print(f"[ERROR] SoundFont not found at {sf_path}")
        sys.exit(1)

    os.makedirs(out_dir, exist_ok=True)

    tracks = [
        (
            "BGM 1",
            compose_hai_vong_sea,
            "Thành Phố Biển Hải Vọng (Gió Biển & Hoài Niệm)",
            "bgm_hai_vong_sea",
            "Biển, hoài niệm, lãng đãng (Nostalgic, coastal, breezy). Key: G Major, 70 BPM"
        ),
        (
            "BGM 2",
            compose_clb_tinh_tam,
            "Phòng CLB Báo Chí Tĩnh Tâm (Buổi Chiều Sau Giờ Học)",
            "bgm_clb_tinh_tam",
            "Đời thường học đường, ấm cúng (School life, warm, cozy). Key: D Major, 84 BPM"
        ),
        (
            "BGM 3",
            compose_investigation,
            "Tác Nghiệp Hiện Trường (Lần Theo Manh Mối)",
            "bgm_investigation",
            "Tập trung, nhịp điệu điều tra (Focused, investigative jazz). Key: C Minor, 100 BPM"
        ),
        (
            "BGM 4",
            compose_night_romance,
            "Đêm Tĩnh Lặng & Hẹn Hò (Lời Chưa Nói)",
            "bgm_night_romance",
            "Thư thái, nhẹ nhàng, lãng mạn (Relaxing, peaceful, tender romance). Key: E Major, 66 BPM"
        ),
    ]

    print("=================================================================")
    print("DỰ ÁN HỒI ÂM - HỆ THỐNG SOẠN NHẠC SOUNDFONT BGM SUITE HOÀN THIỆN")
    print("=================================================================")
    print(f"Thư mục xuất file: {out_dir}")
    print(f"SoundFont: {sf_path}")

    created_files = []
    for track_info in tracks:
        mid_file, wav_file = render_track(track_info, out_dir, sf_path)
        created_files.append((track_info[0], track_info[2], mid_file, wav_file))

    # Also keep backward compatibility aliases:
    # bgm_hoi_am_v2_quartet.wav -> alias to bgm_clb_tinh_tam.wav or preserve existing
    import shutil
    shutil.copyfile(os.path.join(out_dir, "bgm_clb_tinh_tam.wav"), os.path.join(out_dir, "bgm_hoi_am_v2_quartet.wav"))

    print("\n=================================================================")
    print("TỔNG HỢP CÁC TRACK BGM ĐÃ XUẤT:")
    print("=================================================================")
    for track_no, title, mid_file, wav_file in created_files:
        print(f"- {track_no}: {title}")
        print(f"  * MIDI: {os.path.basename(mid_file)} ({os.path.getsize(mid_file):,} bytes)")
        print(f"  * WAV:  {os.path.basename(wav_file)} ({os.path.getsize(wav_file):,} bytes)")
    print("\n[HOÀN TẤT] Tất cả 4 track BGM đã được soạn và master thành công!")


if __name__ == "__main__":
    main()
