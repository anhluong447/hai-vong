"""
SoundFont-powered Handmade BGM Generator for "CLB Báo Chí".
Composes gentle, peak-free, acoustic visual novel BGM using real sampled instruments from SoundFont.
"""

import os
import sys
import mido
import sf2_loader

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

TICKS_PER_BEAT = 480
BPM = 72
BEAT_DUR = TICKS_PER_BEAT

def note_name_to_midi(name):
    notes = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
             'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
             'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    letter = name[:-1]
    octave = int(name[-1])
    return 12 + (octave + 1) * 12 + notes[letter]

class MidiComposer:
    def __init__(self, bpm=BPM):
        self.bpm = bpm
        self.mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
        tempo = mido.bpm2tempo(bpm)

        # Tempo track
        tempo_track = mido.MidiTrack()
        tempo_track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
        tempo_track.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        self.mid.tracks.append(tempo_track)

        # Tracks: channel -> event list
        # We store events as (absolute_tick, message) then sort and delta-encode
        self.channel_events = {}

    def set_instrument(self, channel, program):
        if channel not in self.channel_events:
            self.channel_events[channel] = []
        self.channel_events[channel].append((0, mido.Message('program_change', program=program, channel=channel, time=0)))

    def add_note(self, channel, note, start_beat, duration_beats, velocity=60):
        """Add note with gentle velocity, ensuring no harsh peaks."""
        if channel not in self.channel_events:
            self.channel_events[channel] = []
        midi_note = note_name_to_midi(note) if isinstance(note, str) else note
        start_tick = int(start_beat * TICKS_PER_BEAT)
        dur_tick = int(duration_beats * TICKS_PER_BEAT)
        end_tick = start_tick + dur_tick

        # note_on
        self.channel_events[channel].append((start_tick, mido.Message('note_on', note=midi_note, velocity=velocity, channel=channel, time=0)))
        # note_off
        self.channel_events[channel].append((end_tick, mido.Message('note_off', note=midi_note, velocity=0, channel=channel, time=0)))

    def add_pedal(self, channel, start_beat, end_beat):
        """Piano damper pedal (sustain CC 64) for smooth singing acoustic piano."""
        if channel not in self.channel_events:
            self.channel_events[channel] = []
        start_tick = int(start_beat * TICKS_PER_BEAT)
        end_tick = int(end_beat * TICKS_PER_BEAT)
        # pedal down
        self.channel_events[channel].append((start_tick, mido.Message('control_change', control=64, value=127, channel=channel, time=0)))
        # pedal up
        self.channel_events[channel].append((end_tick - 10, mido.Message('control_change', control=64, value=0, channel=channel, time=0)))

    def build(self, out_path):
        for ch, events in sorted(self.channel_events.items()):
            events.sort(key=lambda x: x[0])
            track = mido.MidiTrack()
            last_tick = 0
            for abs_tick, msg in events:
                delta = abs_tick - last_tick
                if delta < 0:
                    delta = 0
                msg.time = delta
                track.append(msg)
                last_tick = abs_tick
            self.mid.tracks.append(track)
        self.mid.save(out_path)
        print(f"Saved MIDI: {out_path}")


def compose_hoi_am_soundfont():
    """
    Track 1: 'Hồi Âm Trong Gió Biển' (Handmade SoundFont Edition)
    Setting: Căn phòng CLB Hồi Âm, ánh nắng chiều, gió biển thoang thoảng.
    Nhẹ nhàng, êm dịu, không peak, dải âm lượng phẳng và mộc mạc.
    """
    comp = MidiComposer(bpm=72)

    # Channel 0: Acoustic Grand Piano (Program 0)
    comp.set_instrument(channel=0, program=0)
    # Channel 1: Warm Cello / Strings (Program 42: Cello)
    comp.set_instrument(channel=1, program=42)
    # Channel 2: Acoustic Nylon Guitar (Program 24: Nylon Guitar)
    comp.set_instrument(channel=2, program=24)
    # Channel 3: Acoustic Upright Bass (Program 32: Acoustic Bass)
    comp.set_instrument(channel=3, program=32)

    # 16 bars (64 beats)
    # Chord progression:
    # Bar 1-4: Dmaj9 -> Bm9 -> Gmaj7 -> A7sus4
    # Bar 5-8: F#m7 -> Bm7 -> Em9 -> A7
    # Bar 9-12: Gmaj7 -> A/G -> F#m7 -> Bm7
    # Bar 13-16: Em9 -> A7sus4 -> Dmaj9 -> Dmaj9
    chords = [
        # Bar 1-4
        (['D3', 'A3', 'D4', 'F#4', 'C#5'], 'D3'),
        (['B2', 'F#3', 'B3', 'D4', 'A4'], 'B2'),
        (['G2', 'D3', 'G3', 'B3', 'F#4'], 'G2'),
        (['A2', 'E3', 'A3', 'D4', 'G4'], 'A2'),
        # Bar 5-8
        (['F#2', 'C#3', 'F#3', 'A3', 'E4'], 'F#2'),
        (['B2', 'F#3', 'B3', 'D4', 'A4'], 'B2'),
        (['E2', 'B2', 'E3', 'G3', 'D4'], 'E2'),
        (['A2', 'E3', 'G3', 'C#4', 'E4'], 'A2'),
        # Bar 9-12
        (['G2', 'D3', 'G3', 'B3', 'F#4'], 'G2'),
        (['G2', 'E3', 'A3', 'C#4', 'E4'], 'G2'),
        (['F#2', 'C#3', 'F#3', 'A3', 'E4'], 'F#2'),
        (['B2', 'F#3', 'B3', 'D4', 'F#4'], 'B2'),
        # Bar 13-16
        (['E2', 'B2', 'E3', 'G3', 'D4'], 'E2'),
        (['A2', 'E3', 'A3', 'C#4', 'E4'], 'A2'),
        (['D3', 'A3', 'D4', 'F#4', 'C#5'], 'D3'),
        (['D2', 'A2', 'D3', 'F#3', 'A3'], 'D2'),
    ]

    for bar_idx, (chord_notes, root_note) in enumerate(chords):
        t_bar = bar_idx * 4.0

        # Damper Pedal for each bar (gives natural acoustic piano body resonance)
        comp.add_pedal(channel=0, start_beat=t_bar, end_beat=t_bar + 4.0)

        # 1. ACOUSTIC BASS (Very soft root plucks on beat 1)
        comp.add_note(channel=3, note=root_note, start_beat=t_bar, duration_beats=3.5, velocity=52)

        # 2. CELLO / WARM STRINGS (Sustained gentle accompaniment)
        if bar_idx % 2 == 0:
            # Soft sustained warm cello drone
            comp.add_note(channel=1, note=chord_notes[1], start_beat=t_bar, duration_beats=7.5, velocity=46)

        # 3. PIANO LEFT HAND ARPEGGIO (Gentle, flowing, velocity ~50-56)
        arp_pattern = [0, 1, 2, 3, 4, 3, 2, 1] if len(chord_notes) >= 5 else [0, 1, 2, 3, 2, 1, 2, 3]
        for step, p_idx in enumerate(arp_pattern):
            t_note = t_bar + step * 0.5
            n = chord_notes[p_idx % len(chord_notes)]
            vel = 54 if step % 2 == 0 else 46
            comp.add_note(channel=0, note=n, start_beat=t_note, duration_beats=1.2, velocity=vel)

        # 4. NYLON GUITAR (Delicate acoustic accent on beat 2.5 and 4.0)
        if len(chord_notes) >= 4:
            comp.add_note(channel=2, note=chord_notes[3], start_beat=t_bar + 2.5, duration_beats=1.2, velocity=42)

    # 5. RIGHT HAND PIANO LEAD MELODY
    # Giai điệu mộc mạc, hoài niệm, nhẹ nhàng, velocity duy trì đều đặn 58-64 (hoàn toàn không có peak)
    melody = [
        # Bar 1: F#4 -> A4 -> E5
        (0.0, 'F#4', 1.0, 60),
        (1.0, 'A4', 1.0, 62),
        (2.0, 'E5', 2.0, 63),
        # Bar 2: D5 -> C#5 -> B4
        (4.0, 'D5', 1.5, 61),
        (5.5, 'C#5', 0.5, 58),
        (6.0, 'B4', 2.0, 60),
        # Bar 3: B4 -> D5 -> F#5
        (8.0, 'B4', 1.0, 59),
        (9.0, 'D5', 1.0, 61),
        (10.0, 'F#5', 2.0, 64),
        # Bar 4: E5 -> D5
        (12.0, 'E5', 2.5, 62),
        (14.5, 'D5', 1.5, 58),
        # Bar 5: F#5 -> E5 -> D5
        (16.0, 'F#5', 1.5, 62),
        (17.5, 'E5', 0.5, 58),
        (18.0, 'D5', 2.0, 60),
        # Bar 6: F#5 -> A5
        (20.0, 'F#5', 1.5, 62),
        (21.5, 'A5', 2.0, 64),
        # Bar 7: G5 -> F#5 -> E5
        (24.0, 'G5', 1.5, 62),
        (25.5, 'F#5', 0.5, 58),
        (26.0, 'E5', 2.0, 60),
        # Bar 8: C#5 -> D5
        (28.0, 'C#5', 2.0, 59),
        (30.0, 'D5', 2.0, 62),
        # Bar 9-10 (Ấm áp, êm đềm khi có bạn bè bên cạnh)
        (32.0, 'B4', 1.0, 60),
        (33.0, 'D5', 1.0, 61),
        (34.0, 'F#5', 2.0, 63),
        (36.0, 'A5', 1.5, 63),
        (37.5, 'G5', 0.5, 58),
        (38.0, 'F#5', 2.0, 61),
        # Bar 11-12
        (40.0, 'E5', 1.5, 60),
        (41.5, 'D5', 0.5, 57),
        (42.0, 'F#5', 2.0, 62),
        (44.0, 'D5', 3.0, 61),
        # Bar 13-14 (Hồi kết lắng đọng về lại căn phòng vắng)
        (48.0, 'E5', 1.5, 60),
        (49.5, 'F#5', 0.5, 58),
        (50.0, 'E5', 1.0, 59),
        (51.0, 'D5', 1.0, 58),
        (52.0, 'C#5', 2.0, 58),
        (54.0, 'D5', 2.0, 60),
        # Bar 15-16 (Tiếng đàn khẽ tan vào gió biển, êm dịu tuyệt đối)
        (56.0, 'F#4', 1.5, 58),
        (57.5, 'A4', 0.5, 56),
        (58.0, 'D5', 4.0, 61),
    ]

    for t_start, note, dur, vel in melody:
        comp.add_note(channel=0, note=note, start_beat=t_start, duration_beats=dur, velocity=vel)

    return comp


def main():
    out_dir = r"C:\Users\anhlh52\AndroidStudioProjects\Ask\assets\audio\bgm"
    sf_path = r"C:\Users\anhlh52\AndroidStudioProjects\Ask\assets\audio\soundfont\TimGM6mb.sf2"
    os.makedirs(out_dir, exist_ok=True)

    print("=== SOẠN BẢN NHẠC HANDMADE BẰNG SOUNDFONT THẬT ===")
    print("Track: Hồi Âm Trong Gió Biển (SoundFont Edition)")
    print("Nhạc cụ: Grand Piano, Cello mộc, Nylon Guitar, Upright Bass")
    print("Tính chất: Êm dịu, nhẹ nhàng, dải âm lượng phẳng, không có peak")

    comp = compose_hoi_am_soundfont()
    midi_path = os.path.join(out_dir, "bgm_hoi_am_handmade.mid")
    comp.build(midi_path)

    print("\n[Đang Render SoundFont sang WAV bằng mẫu nhạc cụ studio]...")
    loader = sf2_loader.sf2_loader(sf_path)
    wav_path = os.path.join(out_dir, "bgm_hoi_am_handmade.wav")

    loader.export_midi_file(midi_path, name=wav_path, format="wav")
    print(f"\n[HOÀN THÀNH] Đã kết xuất: {wav_path}")
    print(f"Kích thước: {os.path.getsize(wav_path):,} bytes")

if __name__ == "__main__":
    main()
