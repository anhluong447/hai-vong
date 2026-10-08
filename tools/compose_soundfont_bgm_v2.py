"""
SoundFont BGM v2 - Balanced Acoustic Quartet for "CLB Báo Chí".
Analyzed and fixed previous masking & drone issues:
- Nylon Guitar: Dedicated fingerstyle arpeggio (panned right), boosted gain, crisp string plucks.
- Cello: Lyrical counter-melody with phrasing, breathing rests, no static drone loops.
- Upright Bass: Active acoustic bassline (beats 1 & 3 with passing notes), warm wooden punch.
- Piano: Gentle chord comping & thematic motifs (panned slightly left), leaving breathing room for others.
"""

import os
import sys
import mido
import sf2_loader
from pydub import AudioSegment
from pydub.effects import normalize

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

TICKS_PER_BEAT = 480
BPM = 72

def note_to_midi(name):
    notes = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
             'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
             'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    letter = name[:-1]
    octave = int(name[-1])
    return 12 + (octave + 1) * 12 + notes[letter]

class TrackWriter:
    def __init__(self, program, bpm=BPM):
        self.program = program
        self.bpm = bpm
        self.mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
        
        # Tempo track
        track = mido.MidiTrack()
        track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
        track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        track.append(mido.Message('program_change', program=program, channel=0, time=0))
        self.track = track
        self.mid.tracks.append(track)
        self.events = []

    def add_note(self, note, start_beat, duration_beats, velocity=64):
        midi_note = note_to_midi(note) if isinstance(note, str) else note
        start_tick = int(start_beat * TICKS_PER_BEAT)
        dur_tick = int(duration_beats * TICKS_PER_BEAT)
        end_tick = start_tick + dur_tick
        self.events.append((start_tick, mido.Message('note_on', note=midi_note, velocity=velocity, channel=0, time=0)))
        self.events.append((end_tick, mido.Message('note_off', note=midi_note, velocity=0, channel=0, time=0)))

    def add_pedal(self, start_beat, end_beat):
        start_tick = int(start_beat * TICKS_PER_BEAT)
        end_tick = int(end_beat * TICKS_PER_BEAT)
        self.events.append((start_tick, mido.Message('control_change', control=64, value=127, channel=0, time=0)))
        self.events.append((end_tick - 10, mido.Message('control_change', control=64, value=0, channel=0, time=0)))

    def save(self, filepath):
        self.events.sort(key=lambda x: x[0])
        last_tick = 0
        for abs_tick, msg in self.events:
            delta = max(0, abs_tick - last_tick)
            msg.time = delta
            self.track.append(msg)
            last_tick = abs_tick
        self.mid.save(filepath)


def build_arrangement():
    # 16 bars (64 beats) at 72 BPM (~54s)
    # Harmony progression in D Major:
    # Bar 1-4:   Dmaj9  -> Bm9    -> Gmaj7  -> A7sus4
    # Bar 5-8:   F#m7   -> Bm7    -> Em9    -> A13
    # Bar 9-12:  Gmaj7  -> A/G    -> F#m7   -> Bm7
    # Bar 13-16: Em9    -> A7sus4 -> Dmaj9  -> Dmaj9
    
    # -------------------------------------------------------------
    # 1. NYLON GUITAR (Program 24) - Crystal clear fingerpicking arpeggio
    # -------------------------------------------------------------
    guitar = TrackWriter(program=24, bpm=BPM)
    guitar_patterns = [
        # Bar 1 (Dmaj9)
        ['D3', 'A3', 'F#4', 'C#5', 'F#4', 'A3', 'D4', 'A3'],
        # Bar 2 (Bm9)
        ['B2', 'F#3', 'D4', 'A4', 'D4', 'F#3', 'B3', 'F#3'],
        # Bar 3 (Gmaj7)
        ['G2', 'D3', 'B3', 'F#4', 'B3', 'D3', 'G3', 'D3'],
        # Bar 4 (A7sus4)
        ['A2', 'E3', 'D4', 'G4', 'D4', 'E3', 'A3', 'E3'],
        # Bar 5 (F#m7)
        ['F#2', 'C#3', 'A3', 'E4', 'A3', 'C#3', 'F#3', 'C#3'],
        # Bar 6 (Bm7)
        ['B2', 'F#3', 'D4', 'A4', 'D4', 'F#3', 'B3', 'F#3'],
        # Bar 7 (Em9)
        ['E2', 'B2', 'G3', 'D4', 'F#4', 'D4', 'G3', 'B2'],
        # Bar 8 (A13)
        ['A2', 'E3', 'G3', 'C#4', 'F#4', 'C#4', 'G3', 'E3'],
        # Bar 9 (Gmaj7)
        ['G2', 'D3', 'B3', 'F#4', 'B3', 'D3', 'G3', 'D3'],
        # Bar 10 (A/G)
        ['G2', 'E3', 'A3', 'C#4', 'E4', 'C#4', 'A3', 'E3'],
        # Bar 11 (F#m7)
        ['F#2', 'C#3', 'A3', 'E4', 'A3', 'C#3', 'F#3', 'C#3'],
        # Bar 12 (Bm7)
        ['B2', 'F#3', 'D4', 'F#4', 'D4', 'F#3', 'B3', 'F#3'],
        # Bar 13 (Em9)
        ['E2', 'B2', 'G3', 'D4', 'F#4', 'D4', 'G3', 'B2'],
        # Bar 14 (A7sus4)
        ['A2', 'E3', 'D4', 'G4', 'D4', 'E3', 'A3', 'E3'],
        # Bar 15 (Dmaj9)
        ['D3', 'A3', 'F#4', 'C#5', 'F#4', 'A3', 'D4', 'A3'],
        # Bar 16 (Dmaj9 chord strum finish)
        ['D3', 'A3', 'F#4', 'C#5'],
    ]
    for bar_idx, pattern in enumerate(guitar_patterns):
        t_bar = bar_idx * 4.0
        if bar_idx == 15: # final strum
            for n_idx, n in enumerate(pattern):
                guitar.add_note(n, t_bar + n_idx * 0.08, 3.5, velocity=76)
        else:
            for step, n in enumerate(pattern):
                vel = 78 if step % 2 == 0 else 70
                guitar.add_note(n, t_bar + step * 0.5, 0.95, velocity=vel)

    # -------------------------------------------------------------
    # 2. UPRIGHT BASS (Program 32) - Warm plucked walking bassline
    # -------------------------------------------------------------
    bass = TrackWriter(program=32, bpm=BPM)
    bass_notes = [
        # Bar 1 (D)
        [(0.0, 'D2', 1.8), (2.0, 'A2', 1.8)],
        # Bar 2 (B)
        [(0.0, 'B1', 1.8), (2.0, 'F#2', 1.8)],
        # Bar 3 (G)
        [(0.0, 'G1', 1.8), (2.0, 'D2', 1.8)],
        # Bar 4 (A)
        [(0.0, 'A1', 1.8), (2.0, 'E2', 1.2), (3.5, 'C#2', 0.5)],
        # Bar 5 (F#)
        [(0.0, 'F#1', 1.8), (2.0, 'C#2', 1.8)],
        # Bar 6 (B)
        [(0.0, 'B1', 1.8), (2.0, 'F#2', 1.8)],
        # Bar 7 (E)
        [(0.0, 'E1', 1.8), (2.0, 'B1', 1.8)],
        # Bar 8 (A)
        [(0.0, 'A1', 1.8), (2.0, 'E2', 1.2), (3.5, 'G1', 0.5)],
        # Bar 9 (G)
        [(0.0, 'G1', 1.8), (2.0, 'D2', 1.8)],
        # Bar 10 (A)
        [(0.0, 'A1', 1.8), (2.0, 'E2', 1.8)],
        # Bar 11 (F#)
        [(0.0, 'F#1', 1.8), (2.0, 'C#2', 1.8)],
        # Bar 12 (B)
        [(0.0, 'B1', 1.8), (2.0, 'F#2', 1.8)],
        # Bar 13 (E)
        [(0.0, 'E1', 1.8), (2.0, 'B1', 1.8)],
        # Bar 14 (A)
        [(0.0, 'A1', 1.8), (2.0, 'E2', 1.8)],
        # Bar 15-16 (D sustain)
        [(0.0, 'D2', 2.8)],
        [(0.0, 'D1', 3.8)],
    ]
    for bar_idx, bar_events in enumerate(bass_notes):
        t_bar = bar_idx * 4.0
        for rel_t, n, dur in bar_events:
            bass.add_note(n, t_bar + rel_t, dur, velocity=82)

    # -------------------------------------------------------------
    # 3. CELLO (Program 42) - Lyrical counter-melody, NO DRONE LOOPS!
    # -------------------------------------------------------------
    cello = TrackWriter(program=42, bpm=BPM)
    # Cello sings expressive, warm phrases with natural pauses
    cello_phrases = [
        # Bar 1-2: Rests in Bar 1, enters softly in Bar 2 on offbeat
        (5.0, 'F#3', 1.5, 72),
        (6.5, 'A3', 1.0, 74),
        (7.5, 'D4', 1.5, 76),
        # Bar 3-4: Lyrical descent
        (9.0, 'C#4', 1.5, 74),
        (10.5, 'B3', 1.0, 70),
        (11.5, 'A3', 2.0, 72),
        (14.0, 'G3', 1.5, 68),
        # Bar 5-6: Cello leads with rich low warmth
        (16.5, 'A2', 1.0, 70),
        (17.5, 'C#3', 1.5, 74),
        (19.0, 'E3', 1.5, 76),
        (21.0, 'F#3', 2.0, 75),
        (23.0, 'D3', 1.5, 72),
        # Bar 7-8: Counterpoint dialogue
        (25.0, 'G2', 1.5, 70),
        (26.5, 'B2', 1.0, 72),
        (27.5, 'E3', 1.5, 75),
        (29.0, 'G3', 1.5, 74),
        (30.5, 'F#3', 2.0, 72),
        # Bar 9-10: Cello sings secondary motif under guitar
        (33.0, 'D3', 1.5, 72),
        (34.5, 'F#3', 1.5, 75),
        (36.0, 'G3', 2.0, 76),
        (38.5, 'A3', 1.5, 74),
        # Bar 11-12: Warm romantic arch
        (41.0, 'A3', 1.5, 75),
        (42.5, 'F#3', 1.5, 72),
        (44.0, 'D3', 2.0, 74),
        (46.5, 'B2', 1.5, 70),
        # Bar 13-16: Gentle resolution & peaceful lingering bow
        (49.0, 'G2', 1.5, 68),
        (50.5, 'A2', 1.5, 70),
        (52.0, 'C#3', 1.5, 72),
        (54.0, 'D3', 2.5, 74),
        (58.0, 'D3', 3.5, 68),
    ]
    for rel_t, n, dur, vel in cello_phrases:
        cello.add_note(n, rel_t, dur, velocity=vel)

    # -------------------------------------------------------------
    # 4. ACOUSTIC GRAND PIANO (Program 0) - Warm gentle motif & chords
    # -------------------------------------------------------------
    piano = TrackWriter(program=0, bpm=BPM)
    # Piano plays gentle chord pads + right hand nostalgic melody
    # Leaves space for guitar and cello to shine!
    piano_events = [
        # Bar 1: Intro melody statement
        (0.0, 'F#4', 1.0, 64),
        (1.0, 'A4', 1.0, 66),
        (2.0, 'E5', 2.0, 68),
        # Bar 2: Response
        (4.0, 'D5', 1.5, 65),
        (5.5, 'C#5', 0.5, 60),
        (6.0, 'B4', 2.0, 63),
        # Bar 3: Ascending hope
        (8.0, 'B4', 1.0, 62),
        (9.0, 'D5', 1.0, 65),
        (10.0, 'F#5', 2.0, 67),
        # Bar 4: Pause, let cello and guitar breathe!
        (12.0, 'E5', 2.5, 64),
        # Bar 5-6: Gentle piano chords (F#m7 -> Bm7)
        (16.0, 'A4', 1.5, 62),
        (17.5, 'F#5', 1.5, 66),
        (19.0, 'E5', 1.0, 62),
        (20.0, 'D5', 2.0, 64),
        (22.0, 'F#5', 2.0, 65),
        # Bar 7-8: Soft reflective notes
        (24.0, 'G5', 1.5, 66),
        (25.5, 'F#5', 0.5, 60),
        (26.0, 'E5', 2.0, 63),
        (28.0, 'C#5', 2.0, 62),
        (30.0, 'D5', 2.0, 64),
        # Bar 9-10: Theme variation
        (32.0, 'B4', 1.0, 63),
        (33.0, 'D5', 1.0, 65),
        (34.0, 'F#5', 2.0, 67),
        (36.0, 'A5', 1.5, 67),
        (37.5, 'G5', 0.5, 60),
        (38.0, 'F#5', 2.0, 64),
        # Bar 11-12: Gentle dialogue with cello
        (40.0, 'E5', 1.5, 62),
        (41.5, 'D5', 0.5, 58),
        (42.0, 'F#5', 2.0, 64),
        (44.0, 'D5', 3.0, 63),
        # Bar 13-16: Final cadence
        (48.0, 'E5', 1.5, 62),
        (49.5, 'F#5', 0.5, 60),
        (50.0, 'E5', 1.0, 60),
        (51.0, 'D5', 1.0, 58),
        (52.0, 'C#5', 2.0, 60),
        (54.0, 'D5', 2.0, 62),
        (56.0, 'F#4', 1.5, 60),
        (57.5, 'A4', 0.5, 58),
        (58.0, 'D5', 4.0, 62),
    ]
    # Soft left hand harmonic support on beats 1 and 3
    lh_chords = [
        (0.0, ['D3', 'A3', 'F#4']),
        (4.0, ['B2', 'F#3', 'D4']),
        (8.0, ['G2', 'D3', 'B3']),
        (12.0, ['A2', 'E3', 'C#4']),
        (16.0, ['F#2', 'C#3', 'A3']),
        (20.0, ['B2', 'F#3', 'D4']),
        (24.0, ['E2', 'B2', 'G3']),
        (28.0, ['A2', 'E3', 'C#4']),
        (32.0, ['G2', 'D3', 'B3']),
        (36.0, ['A2', 'E3', 'C#4']),
        (40.0, ['F#2', 'C#3', 'A3']),
        (44.0, ['B2', 'F#3', 'D4']),
        (48.0, ['E2', 'B2', 'G3']),
        (52.0, ['A2', 'E3', 'C#4']),
        (56.0, ['D3', 'A3', 'F#4']),
        (60.0, ['D2', 'A2', 'D3', 'F#3']),
    ]
    # Add sustain pedal for each bar to let chords sing naturally
    for bar in range(16):
        piano.add_pedal(bar * 4.0, bar * 4.0 + 3.8)
        
    for t_lh, chord in lh_chords:
        for n in chord:
            piano.add_note(n, t_lh, 3.2, velocity=52)

    for t_rh, n, dur, vel in piano_events:
        piano.add_note(n, t_rh, dur, velocity=vel)

    return guitar, bass, cello, piano


def main():
    out_dir = r"C:\Users\anhlh52\AndroidStudioProjects\Ask\assets\audio\bgm"
    sf_path = r"C:\Users\anhlh52\AndroidStudioProjects\Ask\assets\audio\soundfont\TimGM6mb.sf2"
    os.makedirs(out_dir, exist_ok=True)

    print("==================================================")
    print("ANALYZING & COMPOSING BGM V2 (BALANCED ACOUSTIC QUARTET)")
    print("==================================================")
    
    guitar, bass, cello, piano = build_arrangement()
    loader = sf2_loader.sf2_loader(sf_path)

    temp_dir = os.path.join(out_dir, "temp_stems")
    os.makedirs(temp_dir, exist_ok=True)

    # 1. RENDER GUITAR
    print("\n[1/4] Rendering Nylon Guitar (Fingerstyle Arpeggios)...")
    mid_gtr = os.path.join(temp_dir, "stem_guitar.mid")
    wav_gtr = os.path.join(temp_dir, "stem_guitar.wav")
    guitar.save(mid_gtr)
    loader.export_midi_file(mid_gtr, name=wav_gtr, format="wav")

    # 2. RENDER BASS
    print("[2/4] Rendering Upright Bass (Acoustic Walking Bassline)...")
    mid_bass = os.path.join(temp_dir, "stem_bass.mid")
    wav_bass = os.path.join(temp_dir, "stem_bass.wav")
    bass.save(mid_bass)
    loader.export_midi_file(mid_bass, name=wav_bass, format="wav")

    # 3. RENDER CELLO
    print("[3/4] Rendering Cello (Lyrical Counter-Melody)...")
    mid_cel = os.path.join(temp_dir, "stem_cello.mid")
    wav_cel = os.path.join(temp_dir, "stem_cello.wav")
    cello.save(mid_cel)
    loader.export_midi_file(mid_cel, name=wav_cel, format="wav")

    # 4. RENDER PIANO
    print("[4/4] Rendering Grand Piano (Thematic Motif & Ambient Chords)...")
    mid_pno = os.path.join(temp_dir, "stem_piano.mid")
    wav_pno = os.path.join(temp_dir, "stem_piano.wav")
    piano.save(mid_pno)
    loader.export_midi_file(mid_pno, name=wav_pno, format="wav")

    # =============================================================
    # MULTI-TRACK MIXING & SOUND STAGING
    # =============================================================
    print("\n[Mixing] Balancing instrument levels and stereo soundstage...")
    aud_gtr = AudioSegment.from_file(wav_gtr)
    aud_bass = AudioSegment.from_file(wav_bass)
    aud_cel = AudioSegment.from_file(wav_cel)
    aud_pno = AudioSegment.from_file(wav_pno)

    max_len = max(len(aud_gtr), len(aud_bass), len(aud_cel), len(aud_pno))
    mix = AudioSegment.silent(duration=max_len)

    # Gain staging to bring out previously hidden instruments:
    # Guitar: +10 dB, Panned right (+0.35)
    aud_gtr = aud_gtr.apply_gain(10.0).pan(0.35)
    # Cello: +6.5 dB, Panned left (-0.30)
    aud_cel = aud_cel.apply_gain(6.5).pan(-0.30)
    # Bass: +8.0 dB, Centered (0.0)
    aud_bass = aud_bass.apply_gain(8.0).pan(0.0)
    # Piano: +1.0 dB, Slightly left (-0.12)
    aud_pno = aud_pno.apply_gain(1.0).pan(-0.12)

    # Blend stems together
    mix = mix.overlay(aud_gtr)
    mix = mix.overlay(aud_cel)
    mix = mix.overlay(aud_bass)
    mix = mix.overlay(aud_pno)

    # Master normalization to -1.0 dBFS (safe, gentle, no clipping)
    final_master = normalize(mix, headroom=1.0)

    final_wav = os.path.join(out_dir, "bgm_hoi_am_v2_quartet.wav")
    final_master.export(final_wav, format="wav")
    print(f"\n[SUCCESS] Mastered BGM v2 exported to: {final_wav}")
    print(f"Duration: {len(final_master)/1000:.2f}s | dBFS: {final_master.dBFS:.2f}")

if __name__ == "__main__":
    main()
