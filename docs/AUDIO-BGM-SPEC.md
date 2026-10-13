# Tài liệu Đặc tả m Nhạc & Bộ Nhạc Nền (BGM Suite) — Dự Án Hồi Âm

Tài liệu thiết kế âm nhạc, thông số kỹ thuật và hướng dẫn tích hợp bộ BGM chính thức cho visual novel / narrative game **CLB Báo Chí (Tập san Hồi Âm)** tại Trường THPT Tĩnh Tâm, Thành phố biển Hải Vọng.

---

## 1. Tổng quan Bộ Nhạc Nền (SoundFont Master Suite)

Bộ nhạc nền được sáng tác và kết xuất bằng công nghệ **SoundFont GM Studio Sample** (`assets/audio/soundfont/TimGM6mb.sf2`) kết hợp kỹ thuật **Stem Multi-track Mixing** & **Master Headroom Normalization (-1.0 dBFS)**, giải quyết triệt để các vấn đề rè, clipping, nén đục hoặc lấn át dải tần thường gặp ở các công cụ tổng hợp đơn giản.

Mỗi track bao gồm:
1. **File Master Audio (`.wav`)**: Định dạng 44.1kHz, 16-bit PCM Stereo với âm trường rộng, độ động tự nhiên.
2. **File Multi-track MIDI (`.mid`)**: Chuẩn General MIDI đa kênh, tương thích hoàn toàn với DAW (Logic, Cubase, FL Studio, Ableton) và Web Audio Soundfont Synthesizer.

---

## 2. Danh mục 4 Track BGM Chủ Đề Hoàn Thiện

### Track 1: Thành phố biển Hải Vọng (Gió Biển & Hoài Niệm)
- **File Audio**: `assets/audio/bgm/bgm_hai_vong_sea.wav` (56.96s)
- **File MIDI**: `assets/audio/bgm/bgm_hai_vong_sea.mid`
- **Chủ đề & Tâm trạng**: Biển, hoài niệm, lãng đãng (Nostalgic, coastal, breezy, airy).
- **Điểm neo bối cảnh**: Bờ biển Hải Vọng, những con dốc thoai thoải ngắm ngọn hải đăng cổ, tiếng còi tàu xa khơi, ký ức tuổi thơ thanh khiết.
- **Thông số âm nhạc**:
  - **Key**: G Major / E Minor
  - **Tempo**: 70 BPM (4/4, nhịp dập dềnh như sóng biển)
  - **Vòng hòa thanh (16 bars)**:
    - *Đoạn A*: Gmaj7 &rarr; Cmaj7 &rarr; Bm7 &rarr; Em9
    - *Đoạn A'*: Am7 &rarr; D7sus4 &rarr; Bm7 &rarr; Em7
    - *Đoạn B*: Cmaj7 &rarr; D/C &rarr; Bm7 &rarr; Em9
    - *Đoạn Kết*: Am9 &rarr; D7 &rarr; Gmaj7 &rarr; Gmaj7
  - **Phối khí**:
    - *Nylon Guitar* (Pan +0.35, +9.5 dB): Rải arpeggio fingerstyle mộc mạc như sóng vỗ ghềnh đá.
    - *Acoustic Grand Piano* (Pan -0.15, +1.0 dB): Giai điệu chính trong trẻo, bay bổng, có pedal vang nhẹ.
    - *Cello mộc* (Pan -0.32, +6.5 dB): Cung vĩ trầm ấm đối thoại, tạo chiều sâu hoài niệm.
    - *Upright Bass* (Pan 0.0, +7.5 dB): Búng nốt trầm gỗ ở phách 1 và 3 vững chãi.
    - *Flute* (Pan +0.22, +4.0 dB): Tiếng sáo lãng đãng ở nửa sau như ngọn gió đại dương.
    - *Sea Breeze Texture* (-22 dB): Tiếng gió biển Hải Vọng rì rào êm ả lồng nhẹ phía sau.

---

### Track 2: Phòng CLB Báo chí Tĩnh Tâm (Buổi Chiều Sau Giờ Học)
- **File Audio**: `assets/audio/bgm/bgm_clb_tinh_tam.wav` (46.79s)
- **File MIDI**: `assets/audio/bgm/bgm_clb_tinh_tam.mid`
- **Chủ đề & Tâm trạng**: Đời thường học đường, ấm cúng, vui tươi nhẹ nhàng, tình bạn gắn kết (School life, warm, cozy, companionable).
- **Điểm neo bối cảnh**: Căn phòng sinh hoạt CLB Hồi Âm trên tầng 3 phủ nắng chiều; mùi giấy báo cũ, tách trà hoa cúc của cô giáo phụ trách, tiếng bàn phím và tiếng thảo luận sôi nổi của Khuê, Vân, Long, Nhi.
- **Thông số âm nhạc**:
  - **Key**: D Major
  - **Tempo**: 84 BPM (4/4, bước chân học trò năng động)
  - **Vòng hòa thanh (16 bars)**:
    - *Đoạn A*: Dmaj7 &rarr; Em7 &rarr; F#m7 &rarr; Gmaj7
    - *Đoạn A'*: F#m7 &rarr; Bm7 &rarr; Em9 &rarr; A7
    - *Đoạn B*: Gmaj7 &rarr; A/G &rarr; F#m7 &rarr; Bm7
    - *Đoạn Kết*: Em7 &rarr; A7sus4 &rarr; Dmaj7 &rarr; D
  - **Phối khí**:
    - *Acoustic Grand Piano* (Pan -0.18, +1.0 dB): Chơi lead melody kết hợp comping bouncy vui tươi.
    - *Nylon Guitar* (Pan +0.35, +9.0 dB): Rải fingerpicking acoustic nảy nhịp nhàng.
    - *Upright Bass* (Pan 0.0, +7.5 dB): Walking/syncopated bassline nảy nhẹ, vui vẻ.
    - *Vibraphone* (Pan +0.22, +5.0 dB): Chuông gõ trong trẻo, thể hiện sự thông minh, hóm hỉnh.
    - *Cello* (Pan -0.32, +6.0 dB): Hòa quyện ấm áp ở nửa sau, biểu trưng cho tình bạn bền chặt.

---

### Track 3: Tác Nghiệp Hiện Trường (Lần Theo Manh Mối)
- **File Audio**: `assets/audio/bgm/bgm_investigation.wav` (39.59s)
- **File MIDI**: `assets/audio/bgm/bgm_investigation.mid`
- **Chủ đề & Tâm trạng**: Tập trung, nhịp điệu điều tra, tò mò, trí tuệ, sắc sảo (Focused, investigative jazz/neo-soul).
- **Điểm neo bối cảnh**: Tác nghiệp thực địa, phỏng vấn nhân chứng tại cảng cá, lục tìm hồ sơ thư viện tỉnh, đối chiếu sự thật trước các thông báo ngụy tạo.
- **Thông số âm nhạc**:
  - **Key**: C Minor / C Dorian
  - **Tempo**: 100 BPM (Swing groove nhịp bước chân dứt khoát)
  - **Vòng hòa thanh (16 bars)**:
    - *Đoạn 1*: Cm9 &rarr; Fm9 &rarr; Bb13 &rarr; Ebmaj7#11
    - *Đoạn 2*: Abmaj7 &rarr; Dm7b5 &rarr; G7alt &rarr; Cm9
    - *Đoạn 3*: Bbm9 &rarr; Eb9 &rarr; Abmaj9 &rarr; Db9
    - *Đoạn 4*: Dm7b5 &rarr; G7b9 &rarr; Cm9 &rarr; Cm
  - **Phối khí**:
    - *Walking Upright Bass* (Pan 0.0, +8.5 dB): Tuyến bassline đi bộ jazz nảy lửa, giữ nhịp điều tra.
    - *Electric Piano (Rhodes)* (Pan -0.25, +6.0 dB): Hợp âm stabs ở phách lệch mang phong cách Detective Noir.
    - *Vibraphone* (Pan +0.28, +5.5 dB): Giai điệu điều tra sắc bén, tò mò, khám phá manh mối.
    - *Grand Piano* (Pan -0.10, +3.0 dB): Staccato hits nhấn mạnh những phát hiện quan trọng.
    - *Typewriter Foley Texture* (-18 dB): Tiếng gõ máy chữ cơ học nhịp nhàng của phóng viên tác nghiệp.

---

### Track 4: Đêm Tĩnh Lặng & Hẹn Hò (Lời Chưa Nói)
- **File Audio**: `assets/audio/bgm/bgm_night_romance.wav` (60.00s)
- **File MIDI**: `assets/audio/bgm/bgm_night_romance.mid`
- **Chủ đề & Tâm trạng**: Thư thái, nhẹ nhàng, lãng mạn, yên bình (Relaxing, peaceful, gentle night, tender romance).
- **Điểm neo bối cảnh**: Đêm bờ kè Hải Vọng, đèn vàng hắt hiu trên những con dốc, tiếng sóng vỗ thì thầm dưới ánh trăng; buổi hẹn hò chia sẻ những nỗi niềm sâu kín nhất sau ngày dài.
- **Thông số âm nhạc**:
  - **Key**: E Major
  - **Tempo**: 66 BPM (chậm rãi, êm dịu, thư giãn tuyệt đối)
  - **Vòng hòa thanh (16 bars)**:
    - *Đoạn 1*: Emaj9 &rarr; G#m7 &rarr; Aadd9 &rarr; B7sus4
    - *Đoạn 2*: C#m9 &rarr; G#m7 &rarr; F#m9 &rarr; B7
    - *Đoạn 3*: Aadd9 &rarr; B/A &rarr; G#m7 &rarr; C#m7
    - *Đoạn 4*: F#m9 &rarr; B7sus4 &rarr; Emaj9 &rarr; E
  - **Phối khí**:
    - *Fender Rhodes* (Pan -0.22, +6.5 dB): Tiếng chuông đêm ấm áp, hợp âm dịu ngọt như lời thì thầm.
    - *Nylon Guitar* (Pan +0.35, +8.5 dB): Rải dây chậm rãi, mượt mà, giàu cảm xúc.
    - *Cello mộc* (Pan -0.32, +6.0 dB): Cung vĩ legato da diết, nốt ngân dài bao bọc không gian tĩnh lặng.
    - *Upright Bass* (Pan 0.0, +7.0 dB): Nốt bass sâu lắng, tạo chiều sâu thư thái.
    - *Music Box* (Pan +0.25, +4.0 dB): Chuông đêm lấp lánh như ngọn đèn hải đăng ngoài khơi xa.

---

## 3. Công Cụ & Script Tái Tạo m Nhạc

Các công cụ nằm trong thư mục `tools/`:
- `tools/compose_soundfont_bgm_suite.py`: Script soạn và kết xuất toàn bộ 4 track BGM bằng SoundFont (`TimGM6mb.sf2`) và `pydub`.
  ```bash
  python tools/compose_soundfont_bgm_suite.py
  ```
- `tools/compose_soundfont_bgm_v2.py`: Script gốc thử nghiệm quartet acoustic.
- `tools/generate_bgm_suite.py`: Bộ synth engine thuần numpy cho các hiệu ứng bổ trợ.
- `tools/bgm_preview.html`: Trang web nghe thử trực quan cho đạo diễn âm thanh và nhóm kịch bản.

---

## 4. Hướng Dẫn Tích Hợp Vào Runtime Game

### Bước 1: Khai báo Asset Map trong `content/`
Khai báo đường dẫn file BGM trong module định nghĩa âm thanh (ví dụ: `content/gameplay/audio.js` hoặc manifest tương ứng):

```javascript
export const BGM_TRACKS = {
  COASTAL_CITY: {
    id: 'hai_vong_sea',
    src: 'assets/audio/bgm/bgm_hai_vong_sea.wav',
    titleKey: 'bgm.hai_vong_sea',
    volume: 0.75,
    loop: true,
  },
  CLUBROOM: {
    id: 'clb_tinh_tam',
    src: 'assets/audio/bgm/bgm_clb_tinh_tam.wav',
    titleKey: 'bgm.clb_tinh_tam',
    volume: 0.8,
    loop: true,
  },
  INVESTIGATION: {
    id: 'investigation',
    src: 'assets/audio/bgm/bgm_investigation.wav',
    titleKey: 'bgm.investigation',
    volume: 0.75,
    loop: true,
  },
  NIGHT_ROMANCE: {
    id: 'night_romance',
    src: 'assets/audio/bgm/bgm_night_romance.wav',
    titleKey: 'bgm.night_romance',
    volume: 0.7,
    loop: true,
  },
};
```

### Bước 2: Quản lý phát nhạc qua Audio Service ở Presentation Layer
Theo nguyên tắc kiến trúc:
- Domain layer giữ tính bất biến, không gọi trực tiếp Web Audio hay DOM API.
- Presentation Controller (`src/presentation/` hoặc `PixelWorld`) lắng nghe sự thay đổi map/cảnh/phase từ `GameSession` để chuyển bài:
  - **Map Thành phố biển Hải Vọng / Bờ kè**: Phát `COASTAL_CITY`.
  - **Phòng CLB Báo chí Tĩnh Tâm**: Phát `CLUBROOM`.
  - **Cảnh điều tra / Phỏng vấn / Đối chất**: Phát `INVESTIGATION`.
  - **Cảnh dạo bước ban đêm / Hẹn hò**: Phát `NIGHT_ROMANCE`.
- Hỗ trợ Cross-fade 1.5s - 2.0s để chuyển cảnh êm ái, tránh giật âm lượng.
