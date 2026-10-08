/**
 * Rich 2D Top-Down Pixel Art Map Renderer for "Câu Lạc Bộ Hỏi".
 * High-craftsmanship retro 16-bit aesthetic inspired by Omori, To the Moon, and Chrono Trigger.
 *
 * Environments:
 *   - 'gate': Cổng trường THPT Tĩnh Tâm (đồi thông, dốc đá 45 độ, biển Hải Vọng, biển đồng "TĨNH ĐỂ TÂM SÁNG")
 *   - 'hallway': Hành lang dãy A (gạch bông Đông Dương, dải nắng xiên, bảng tin trường, cửa lớp 12A5)
 *   - 'room0': Phòng Số 0 gác xép (thảm thiên văn hoàng đạo, bàn trà bốc khói, bảng phấn câu hỏi tuần, giá sách cổ)
 */

export const METER = 32;

export class MapRenderer {
  #steamTime = 0;
  #dustParticles = [];
  #fogParticles = [];

  constructor() {
    // Sunlit dust particles for Room 0
    for (let i = 0; i < 30; i++) {
      this.#dustParticles.push({
        x: (Math.random() - 0.5) * 8 * METER,
        y: (Math.random() - 0.5) * 8 * METER,
        speed: 0.12 + Math.random() * 0.25,
        radius: 0.35 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Coastal morning fog wisps for Gate
    for (let i = 0; i < 18; i++) {
      this.#fogParticles.push({
        x: (Math.random() - 0.5) * 22 * METER,
        y: -22 * METER + Math.random() * 40 * METER,
        speed: 0.2 + Math.random() * 0.35,
        w: 120 + Math.random() * 160,
        h: 40 + Math.random() * 50,
      });
    }
  }

  drawBackground(ctx, locationId, spec, t) {
    this.#steamTime = t;

    if (locationId === 'gate') {
      this.#drawGate(ctx, spec, t);
    } else if (locationId === 'hallway') {
      this.#drawHallway(ctx, spec, t);
    } else if (locationId === 'room0') {
      this.#drawRoom0(ctx, spec, t);
    } else {
      this.#drawGeneric(ctx, spec, t);
    }
  }

  drawForeground(ctx, locationId, spec, t) {
    ctx.save();
    if (spec?.time === 'night') ctx.globalAlpha = .4;
    if (locationId === 'gate') {
      this.#drawGateForeground(ctx, t, spec);
    } else if (locationId === 'hallway') {
      this.#drawHallwayForeground(ctx, t);
    } else if (locationId === 'room0') {
      this.#drawRoom0Foreground(ctx, t);
    }
    this.#drawWeather(ctx, locationId, spec, t);
    ctx.restore();
  }

  // ===========================================================================
  // 1. GATE (Cổng trường Tĩnh Tâm, dốc đồi thông và biển)
  // ===========================================================================
  #drawGate(ctx, spec, t) {
    const roadW = 7 * METER; // 224px
    const halfRoad = roadW / 2;

    // --- A. BỜ BIỂN HẢI VỌNG (Far Left / Horizon) ---
    // Sea water gradient
    const seaGrad = ctx.createLinearGradient(-450, 0, -140, 0);
    seaGrad.addColorStop(0, '#223c4d'); // deep sea
    seaGrad.addColorStop(0.7, '#355b70'); // coastal waters
    seaGrad.addColorStop(1, '#4c7c94'); // shallows
    ctx.fillStyle = seaGrad;
    ctx.fillRect(-500, -750, 360, 1500);

    // Animated gentle sea waves
    for (let i = 0; i < 24; i++) {
      const wy = -700 + i * 55;
      const waveShift = Math.sin(t * 1.4 + i * 0.8) * 18;
      ctx.fillStyle = 'rgba(215, 238, 245, 0.35)';
      ctx.fillRect(-480 + waveShift, wy, 80 + (i % 3) * 30, 2);
      ctx.fillStyle = 'rgba(165, 210, 225, 0.2)';
      ctx.fillRect(-450 + waveShift * 0.6, wy + 4, 110, 1.5);
    }

    // Sandy coast strip & cliff line
    ctx.fillStyle = '#9e9176';
    ctx.fillRect(-150, -750, 25, 1500);
    ctx.fillStyle = '#6e624c'; // cliff drop shadow
    ctx.fillRect(-128, -750, 8, 1500);

    // Rustic wooden guardrail / fence along the cliff edge
    for (let y = -720; y < 700; y += 40) {
      ctx.fillStyle = '#4a3424'; // fence post
      ctx.fillRect(-124, y, 4, 14);
      ctx.fillStyle = '#614631'; // rail
      ctx.fillRect(-124, y + 2, 4, 40);
    }

    // --- B. ĐỒI THÔNG & SƯỜN CỎ (Hillside Grass) ---
    // Base grass
    ctx.fillStyle = '#3f572e';
    ctx.fillRect(-120, -750, 500, 1500);

    // Grass texture & wildflowers
    this.#drawGrassDetail(ctx, -115, -700, 300, 1400);

    // --- C. CON DỐC 45 ĐỘ (Paved Slope Road) ---
    // Stone retaining curb walls
    ctx.fillStyle = '#4c4840';
    ctx.fillRect(-halfRoad - 12, -720, 12, 1440);
    ctx.fillRect(halfRoad, -720, 12, 1440);
    ctx.fillStyle = '#736d62'; // top edge of curbs
    ctx.fillRect(-halfRoad - 12, -720, 2, 1440);
    ctx.fillRect(halfRoad + 10, -720, 2, 1440);

    // Road surface: weathered stone slabs
    ctx.fillStyle = '#54524c';
    ctx.fillRect(-halfRoad, -720, roadW, 1440);

    // Stone paving blocks & slope steps (every 2 meters = 64px)
    ctx.strokeStyle = '#3d3b36';
    ctx.lineWidth = 1.5;
    for (let y = -700; y < 700; y += 32) {
      // Horizontal joint
      ctx.beginPath();
      ctx.moveTo(-halfRoad, y);
      ctx.lineTo(halfRoad, y);
      ctx.stroke();

      // Alternating vertical joints
      const row = Math.floor((y + 700) / 32);
      const offset = (row % 2) * 28;
      for (let x = -halfRoad + 28 + offset; x < halfRoad; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 32);
        ctx.stroke();
      }

      // Slope contour shadow (indicating uphill slope)
      if (row % 3 === 0) {
        ctx.fillStyle = 'rgba(20, 20, 18, 0.16)';
        ctx.fillRect(-halfRoad, y, roadW, 4);
      }
    }

    // Fallen golden-orange pine needles and autumn leaves on the road
    this.#drawFallenLeaves(ctx, -halfRoad + 10, -680, roadW - 20, 1360);

    // Stone benches under pine trees
    this.#drawBench(ctx, -halfRoad - 44, 4 * METER);
    this.#drawBench(ctx, halfRoad + 18, -6 * METER);

    // Lush Pine Trees on both sides of the slope
    const pinePositions = [
      { x: -95, y: -620, s: 1.1 }, { x: -90, y: -480, s: 1.2 }, { x: -98, y: -340, s: 1.0 },
      { x: -92, y: -190, s: 1.25 }, { x: -96, y: -40, s: 1.15 }, { x: -90, y: 120, s: 1.2 },
      { x: -94, y: 280, s: 1.05 }, { x: -92, y: 440, s: 1.2 },
      { x: halfRoad + 38, y: -650, s: 1.2 }, { x: halfRoad + 44, y: -500, s: 1.1 },
      { x: halfRoad + 36, y: -350, s: 1.3 }, { x: halfRoad + 42, y: -200, s: 1.15 },
      { x: halfRoad + 38, y: -50, s: 1.2 }, { x: halfRoad + 45, y: 100, s: 1.1 },
      { x: halfRoad + 38, y: 260, s: 1.25 }, { x: halfRoad + 42, y: 420, s: 1.1 },
    ];
    for (const p of pinePositions) {
      this.#drawPineTree(ctx, p.x, p.y, p.s);
    }

    // --- D. CỔNG SẮT TRƯỜNG & BIỂN ĐỒNG (North: y = -15 * METER = -480px) ---
    const gateY = -15 * METER;

    // Stone gate pillars
    const pW = 38;
    const pH = 52;
    // Left pillar
    this.#drawStonePillar(ctx, -110, gateY - 24, pW, pH);
    // Right pillar
    this.#drawStonePillar(ctx, 72, gateY - 24, pW, pH);

    // Ornate Wrought Iron Gates (Between pillars: x = -72 to 72)
    ctx.strokeStyle = '#1b1b1e';
    ctx.lineWidth = 3;
    // Left gate leaf: half open outward
    ctx.beginPath();
    ctx.moveTo(-72, gateY);
    ctx.lineTo(-12, gateY + 28);
    ctx.stroke();
    // Iron pickets on left gate
    for (let i = 0; i <= 6; i++) {
      const gx = -72 + i * 10;
      const gy = gateY + i * 4.6;
      ctx.fillStyle = '#1b1b1e';
      ctx.fillRect(gx - 1, gy - 20, 2, 22);
      ctx.fillRect(gx - 2, gy - 23, 4, 3); // spear tip
    }

    // Right gate leaf: closed
    ctx.beginPath();
    ctx.moveTo(72, gateY);
    ctx.lineTo(12, gateY);
    ctx.stroke();
    for (let i = 0; i <= 6; i++) {
      const gx = 72 - i * 10;
      ctx.fillStyle = '#1b1b1e';
      ctx.fillRect(gx - 1, gateY - 20, 2, 22);
      ctx.fillRect(gx - 2, gateY - 23, 4, 3);
    }

    // Top iron decorative arch
    ctx.strokeStyle = '#27272c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-110, gateY - 22);
    ctx.quadraticCurveTo(0, gateY - 50, 110, gateY - 22);
    ctx.stroke();

    // --- E. TẤM BIỂN ĐỒNG: "TĨNH ĐỂ TÂM SÁNG" ---
    const plaqueY = gateY - 34;
    const plaqueW = 146;
    const plaqueH = 26;
    // Dark brass shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-plaqueW / 2 + 2, plaqueY + 2, plaqueW, plaqueH);
    // Outer bronze border
    ctx.fillStyle = '#5c411a';
    ctx.fillRect(-plaqueW / 2, plaqueY, plaqueW, plaqueH);
    // Inner burnished gold face
    const brassGrad = ctx.createLinearGradient(0, plaqueY, 0, plaqueY + plaqueH);
    brassGrad.addColorStop(0, '#9e7932');
    brassGrad.addColorStop(0.5, '#d4ac53');
    brassGrad.addColorStop(1, '#856322');
    ctx.fillStyle = brassGrad;
    ctx.fillRect(-plaqueW / 2 + 3, plaqueY + 3, plaqueW - 6, plaqueH - 6);
    // Gold filigree border
    ctx.strokeStyle = '#f8e69c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-plaqueW / 2 + 4, plaqueY + 4, plaqueW - 8, plaqueH - 8);

    // Calligraphy Text
    ctx.fillStyle = '#241705';
    ctx.font = 'bold 10px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TĨNH ĐỂ TÂM SÁNG', 0, plaqueY + plaqueH / 2 + 1);

    // --- F. TRƯỜNG THPT TĨNH TÂM (Beyond the gate: y = -17 * METER = -544px) ---
    const schY = -560;
    // Terracotta roof
    ctx.fillStyle = '#7a3b2b';
    ctx.fillRect(-220, schY - 80, 440, 24);
    ctx.fillStyle = '#9e4e3a';
    ctx.fillRect(-224, schY - 84, 448, 6);
    // French-colonial yellow facade
    ctx.fillStyle = '#c7b385';
    ctx.fillRect(-216, schY - 56, 432, 100);
    ctx.fillStyle = '#b09d72'; // lower wainscoting
    ctx.fillRect(-216, schY + 16, 432, 28);
    // Arched windows
    for (let c = -4; c <= 4; c++) {
      const wx = c * 44 - 12;
      ctx.fillStyle = '#223242';
      ctx.fillRect(wx, schY - 40, 24, 32);
      ctx.strokeStyle = '#e2d4b6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, schY - 40, 24, 32);
      // Window panes
      ctx.beginPath();
      ctx.moveTo(wx + 12, schY - 40); ctx.lineTo(wx + 12, schY - 8);
      ctx.moveTo(wx, schY - 24); ctx.lineTo(wx + 24, schY - 24);
      ctx.stroke();
    }
  }

  #drawGateForeground(ctx, t, spec) {
    // Drifting morning sea fog wisps
    ctx.save();
    for (const fog of spec?.weather === 'fog' ? this.#fogParticles : []) {
      const fx = fog.x + Math.sin(t * fog.speed) * 30;
      const fy = fog.y;
      const grad = ctx.createRadialGradient(fx, fy, 10, fx, fy, fog.w / 2);
      grad.addColorStop(0, 'rgba(235, 245, 255, 0.09)');
      grad.addColorStop(0.6, 'rgba(230, 240, 250, 0.04)');
      grad.addColorStop(1, 'rgba(230, 240, 250, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(fx, fy, fog.w / 2, fog.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm morning sunbeams cutting through the fog from top-right
    ctx.fillStyle = 'rgba(255, 235, 175, 0.06)';
    ctx.beginPath();
    ctx.moveTo(350, -750);
    ctx.lineTo(200, -750);
    ctx.lineTo(-200, 750);
    ctx.lineTo(-50, 750);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  #drawWeather(ctx, locationId, spec, t) {
    ctx.save();
    if (locationId === 'gate') {
      // Sparse amber pine needles drift across the path at different speeds.
      for (let i = 0; i < 16; i++) {
        const x = ((i * 73 + t * (8 + i % 3)) % 540) - 270;
        const y = ((i * 113 + t * (12 + i % 5)) % 1400) - 700;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(221,177,95,.65)' : 'rgba(127,151,109,.55)';
        ctx.fillRect(Math.round(x + Math.sin(t + i) * 9), Math.round(y), 2, 1);
      }
      if (spec?.weather === 'rain' || spec?.weather === 'storm') {
        ctx.strokeStyle = 'rgba(178,206,221,.35)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 70; i++) {
          const x = (i * 47 + t * 55) % 600 - 300;
          const y = (i * 83 + t * 260) % 1500 - 750;
          ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9);
        }
        ctx.stroke();
      }
    } else if (locationId === 'hallway') {
      // Quiet dust in the window light; avoid a busy particle field over dialogue.
      ctx.fillStyle = 'rgba(250,230,178,.38)';
      for (let i = 0; i < 18; i++) {
        const x = 40 + Math.sin(t * .18 + i * 2.1) * 45;
        const y = (i * 53 + t * 2.5) % 800 - 400;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    ctx.restore();
  }

  // ===========================================================================
  // 2. HALLWAY (Hành lang gạch bông Đông Dương, nắng xiên, bảng tin)
  // ===========================================================================
  #drawHallway(ctx, spec, t) {
    const hwW = 7 * METER; // 224px wide (-112 to 112)
    const hwLen = 30 * METER; // 960px long (-480 to 480)

    // Outside boundary
    ctx.fillStyle = '#0f1014';
    ctx.fillRect(-450, -600, 900, 1200);

    // --- ENCAUSTIC CEMENT TILE FLOOR (Gạch bông cổ điển) ---
    const ts = 24; // tile size
    for (let x = -hwW / 2; x < hwW / 2; x += ts) {
      for (let y = -hwLen / 2; y < hwLen / 2; y += ts) {
        // Base antique cream tile
        ctx.fillStyle = '#dfd8c5';
        ctx.fillRect(x, y, ts, ts);

        // Jade teal 4-petal floral diamond
        ctx.fillStyle = '#4a756d';
        ctx.beginPath();
        ctx.moveTo(x + ts / 2, y + 2);
        ctx.lineTo(x + ts - 2, y + ts / 2);
        ctx.lineTo(x + ts / 2, y + ts - 2);
        ctx.lineTo(x + 2, y + ts / 2);
        ctx.closePath();
        ctx.fill();

        // Inner ochre diamond
        ctx.fillStyle = '#c79d48';
        ctx.beginPath();
        ctx.moveTo(x + ts / 2, y + 6);
        ctx.lineTo(x + ts - 6, y + ts / 2);
        ctx.lineTo(x + ts / 2, y + ts - 6);
        ctx.lineTo(x + 6, y + ts / 2);
        ctx.closePath();
        ctx.fill();

        // Terra cotta center star
        ctx.fillStyle = '#9e4635';
        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Grout line
        ctx.strokeStyle = 'rgba(40, 30, 20, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, ts, ts);
      }
    }

    // --- NORTH/LEFT WALL: Classrooms 12A1 - 12A5 ---
    const leftX = -hwW / 2;
    // Dark teak wood wainscoting
    ctx.fillStyle = '#423022';
    ctx.fillRect(leftX - 30, -hwLen / 2, 30, hwLen);
    ctx.fillStyle = '#5c4432';
    ctx.fillRect(leftX - 2, -hwLen / 2, 4, hwLen); // border trim

    // Classroom doors along left wall
    for (let y = -380; y < 380; y += 180) {
      // Wood door frame
      ctx.fillStyle = '#6e513a';
      ctx.fillRect(leftX, y, 8, 64);
      ctx.fillStyle = '#332317';
      ctx.fillRect(leftX - 6, y + 4, 6, 56);

      // Frosted checkered glass window on door
      ctx.fillStyle = '#7a96a3';
      ctx.fillRect(leftX + 2, y + 10, 4, 28);

      // Brass room plaque
      ctx.fillStyle = '#cfa74a';
      ctx.fillRect(leftX + 8, y + 14, 20, 14);
      ctx.strokeStyle = '#e8d28a';
      ctx.strokeRect(leftX + 8, y + 14, 20, 14);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(y < 0 ? '12A1' : '12A5', leftX + 9, y + 25);
    }

    // --- SOUTH/RIGHT WALL: Large courtyard windows ---
    const rightX = hwW / 2;
    ctx.fillStyle = '#574230';
    ctx.fillRect(rightX, -hwLen / 2, 30, hwLen);

    for (let y = -440; y < 440; y += 120) {
      // Glass window opening
      ctx.fillStyle = '#658d9e';
      ctx.fillRect(rightX - 6, y, 8, 80);
      // Window panes
      ctx.strokeStyle = '#d9cfbe';
      ctx.lineWidth = 2;
      ctx.strokeRect(rightX - 6, y, 8, 80);
      ctx.beginPath();
      ctx.moveTo(rightX - 6, y + 40); ctx.lineTo(rightX + 2, y + 40);
      ctx.stroke();
    }

    // --- BULLETIN BOARD: "BẢNG VÀNG & BẢNG TIN" (x = 64, y = -35) ---
    const bX = 64;
    const bY = -35;
    // Dark wood frame
    ctx.fillStyle = '#453020';
    ctx.fillRect(bX, bY, 40, 76);
    // Green baize cloth
    ctx.fillStyle = '#284739';
    ctx.fillRect(bX + 3, bY + 3, 34, 70);

    // Golden header
    ctx.fillStyle = '#e8c864';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('BẢNG TIN', bX + 5, bY + 12);

    // Varied pinned papers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bX + 6, bY + 17, 13, 18); // announcement 1
    ctx.fillRect(bX + 21, bY + 20, 13, 16); // announcement 2
    ctx.fillStyle = '#fff4ce';
    ctx.fillRect(bX + 7, bY + 39, 27, 28); // "BẢNG VÀNG" ranking sheet

    // Red pushpins
    ctx.fillStyle = '#d63427';
    ctx.fillRect(bX + 11, bY + 18, 2, 2);
    ctx.fillRect(bX + 26, bY + 21, 2, 2);
    ctx.fillRect(bX + 19, bY + 40, 2, 2);

    // --- ATTIC STAIRS (North end: y = -352px) ---
    const stY = -352;
    ctx.fillStyle = '#3d2b1c';
    ctx.fillRect(-64, stY, 56, 68);
    for (let s = 0; s < 7; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#634731' : '#523a27';
      ctx.fillRect(-64, stY + s * 9, 56, 9);
      ctx.strokeStyle = '#291b10';
      ctx.strokeRect(-64, stY + s * 9, 56, 9);
    }
    // Wooden Handrail
    ctx.fillStyle = '#875d3c';
    ctx.fillRect(-66, stY - 2, 4, 72);
    ctx.fillRect(-10, stY - 2, 4, 72);

    // Attic Signboard
    ctx.fillStyle = '#ecd8a5';
    ctx.fillRect(-58, stY - 18, 44, 13);
    ctx.strokeStyle = '#5c4028';
    ctx.strokeRect(-58, stY - 18, 44, 13);
    ctx.fillStyle = '#222';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('↑ GÁC XÉP', -54, stY - 9);

    // Potted plants along the corridor
    this.#drawPottedFern(ctx, leftX + 10, -180);
    this.#drawPottedFern(ctx, leftX + 10, 180);
  }

  #drawHallwayForeground(ctx, t) {
    // Warm diagonal sunbeams projecting across the corridor from the right windows
    ctx.save();
    ctx.fillStyle = 'rgba(255, 238, 175, 0.09)';
    for (let y = -440; y < 440; y += 120) {
      ctx.beginPath();
      ctx.moveTo(112, y);
      ctx.lineTo(112, y + 80);
      ctx.lineTo(-40, y + 170);
      ctx.lineTo(-40, y + 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ===========================================================================
  // 3. ROOM 0 (Phòng Số 0 - Gác xép thiên văn, bàn trà, bảng đen)
  // ===========================================================================
  #drawRoom0(ctx, spec, t) {
    const roomR = 5 * METER; // 160px radius

    // Dark void outside room
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(-350, -350, 700, 700);

    // Circular room boundary clipping
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, roomR, 0, Math.PI * 2);
    ctx.clip();

    // --- WARM HERRINGBONE WOOD PARQUET FLOOR ---
    const pw = 28;
    const ph = 12;
    for (let y = -roomR; y < roomR; y += ph) {
      const alt = Math.floor(y / ph) % 2 === 0;
      ctx.fillStyle = alt ? '#5a3d28' : '#503522';
      ctx.fillRect(-roomR, y, roomR * 2, ph);
      ctx.strokeStyle = 'rgba(20, 12, 6, 0.35)';
      ctx.lineWidth = 1;
      for (let x = -roomR + (alt ? 0 : pw / 2); x < roomR; x += pw) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + ph); ctx.stroke();
      }
    }

    // --- GRAND ZODIAC / CELESTIAL CARPET (Centered) ---
    const rugR = 76;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // shadow
    ctx.beginPath(); ctx.arc(4, 4, rugR, 0, Math.PI * 2); ctx.fill();

    // Royal blue velvet rug
    ctx.fillStyle = '#162238';
    ctx.beginPath(); ctx.arc(0, 0, rugR, 0, Math.PI * 2); ctx.fill();
    // Gold braided outer ring
    ctx.strokeStyle = '#d4af48';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner constellation circles & gold stars
    ctx.strokeStyle = 'rgba(235, 205, 120, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = '#fce595';
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const sx = Math.cos(ang) * 52;
      const sy = Math.sin(ang) * 52;
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      if (a % 3 === 0) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx, sy); ctx.stroke();
      }
    }

    // --- ROUND SOLID MAHOGANY TABLE (Center) ---
    const tableR = 36;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // table shadow
    ctx.beginPath(); ctx.arc(5, 5, tableR, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#6e472a'; // rich mahogany edge
    ctx.beginPath(); ctx.arc(0, 0, tableR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#825533'; // polished top
    ctx.beginPath(); ctx.arc(0, 0, tableR - 3.5, 0, Math.PI * 2); ctx.fill();

    // Blue-and-white porcelain Teapot
    ctx.fillStyle = '#f0ede6';
    ctx.beginPath(); ctx.arc(8, 2, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b4d7a'; // painted blue pattern
    ctx.fillRect(6, 0, 4, 3);
    ctx.fillStyle = '#b88137'; // brass lid
    ctx.fillRect(7, -1, 3, 3);

    // Rising Animated Steam Wisps
    const sPhase = (t * 22) % 20;
    const sAlpha = Math.max(0, 1 - sPhase / 20);
    ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha * 0.45})`;
    ctx.beginPath();
    ctx.arc(8 + Math.sin(t * 3.5) * 3, -2 - sPhase, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 4 Porcelain Teacups around table
    this.#drawTeacup(ctx, -14, -12);
    this.#drawTeacup(ctx, -12, 14);
    this.#drawTeacup(ctx, 16, 14);
    this.#drawTeacup(ctx, 18, -12);

    // Grandfather's Leather Notebook on table
    ctx.fillStyle = '#4d301b';
    ctx.fillRect(-8, -4, 9, 12);
    ctx.fillStyle = '#f7eed2'; // pages edge
    ctx.fillRect(-7, -3, 8, 10);
    ctx.fillStyle = '#222'; // pen
    ctx.fillRect(3, -2, 1, 9);

    // 4 Cushioned Chairs around table
    this.#drawChairs(ctx, tableR);

    // --- LARGE CHALKBOARD (North Wall: y = -roomR + 10) ---
    const cbW = 126;
    const cbY = -roomR + 10;
    // Wood frame
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(-cbW / 2 - 4, cbY - 4, cbW + 8, 34);
    // Green slate chalkboard
    ctx.fillStyle = '#1c3427';
    ctx.fillRect(-cbW / 2, cbY, cbW, 26);
    // Chalk dust smudges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(-cbW / 2 + 10, cbY + 4, cbW - 20, 18);

    // Authentic Chalk Handwritten Question
    ctx.fillStyle = '#f4f4ee';
    ctx.font = 'bold 7px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NẾU KHÔNG AI CHẤM ĐIỂM BẠN,', 0, cbY + 10);
    ctx.fillText('BẠN CÒN HỌC KHÔNG?', 0, cbY + 20);

    // --- CELESTIAL PROPS & BOOKSHELVES ---
    // Tall Bookshelves along West & East walls
    this.#drawRichBookshelf(ctx, -roomR + 4, -65, 26, 130);
    this.#drawRichBookshelf(ctx, roomR - 30, -65, 26, 130);

    // Antique Brass Globe on carved stand (West side)
    const gx = -roomR + 42;
    const gy = 68;
    ctx.fillStyle = '#422a18';
    ctx.fillRect(gx - 4, gy, 8, 14);
    ctx.fillStyle = '#3a6b7d';
    ctx.beginPath(); ctx.arc(gx, gy - 8, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cda954';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gx, gy - 8, 13, -Math.PI / 4, Math.PI * 3 / 4); ctx.stroke();

    // Wooden Door with plaque "0" at South
    ctx.fillStyle = '#54341e';
    ctx.fillRect(-18, roomR - 22, 36, 20);
    ctx.fillStyle = '#ecd8a5';
    ctx.fillRect(-7, roomR - 15, 14, 11);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('0', 0, roomR - 6);

    ctx.restore();

    // Outer circular wall border
    ctx.strokeStyle = '#2b1b11';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, roomR + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  #drawRoom0Foreground(ctx, t) {
    // Warm skylight dome glow
    const grad = ctx.createRadialGradient(0, 0, 16, 0, 0, 5 * METER);
    grad.addColorStop(0, 'rgba(255, 240, 205, 0.14)');
    grad.addColorStop(0.65, 'rgba(255, 225, 160, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(-260, -260, 520, 520);

    // Sunlit golden dust motes drifting in the light
    ctx.fillStyle = 'rgba(255, 240, 202, 0.48)';
    for (const p of this.#dustParticles) {
      const cx = p.x + Math.sin(t * p.speed + p.phase) * 14;
      const cy = p.y + Math.cos(t * p.speed + p.phase) * 10;
      ctx.beginPath();
      ctx.arc(cx, cy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===========================================================================
  // HELPER DETAIL DRAWING
  // ===========================================================================
  #drawStonePillar(ctx, x, y, w, h) {
    // Pillar body: ashlar stone blocks
    ctx.fillStyle = '#7a7468';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5c574e'; // block shadows
    for (let r = y; r < y + h; r += 12) {
      ctx.fillRect(x, r, w, 1);
    }
    // Pillar cap & base
    ctx.fillStyle = '#9e9687';
    ctx.fillRect(x - 3, y - 4, w + 6, 6);
    ctx.fillRect(x - 3, y + h - 2, w + 6, 6);
    // Green moss creeping on stone
    ctx.fillStyle = '#476336';
    ctx.fillRect(x + 2, y + h - 14, 8, 10);
    ctx.fillRect(x + 6, y + h - 20, 6, 8);
  }

  #drawPineTree(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Tree shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(8, 14, 28, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#3b271a';
    ctx.fillRect(-5, 2, 10, 16);

    // Multi-tier layered needles (from bottom to top)
    const tiers = [
      { r: 30, col: '#233822' },
      { r: 24, col: '#2d472c' },
      { r: 18, col: '#3a5938' },
      { r: 12, col: '#4c7049' },
    ];
    for (let i = 0; i < tiers.length; i++) {
      ctx.fillStyle = tiers[i].col;
      ctx.beginPath();
      ctx.arc(0, -i * 7, tiers[i].r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  #drawGrassDetail(ctx, x, y, w, h) {
    // Little flower clumps and grass blades
    const count = 45;
    for (let i = 0; i < count; i++) {
      const gx = x + ((i * 47) % w);
      const gy = y + ((i * 79) % h);
      // Grass tuft
      ctx.fillStyle = '#57783d';
      ctx.fillRect(gx, gy, 2, 5);
      ctx.fillRect(gx + 3, gy - 1, 2, 6);
      ctx.fillRect(gx - 2, gy + 1, 2, 4);
      // Daisy wildflowers
      if (i % 3 === 0) {
        ctx.fillStyle = '#fce592';
        ctx.fillRect(gx + 5, gy - 3, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx + 4, gy - 4, 2, 2);
        ctx.fillRect(gx + 7, gy - 4, 2, 2);
      }
    }
  }

  #drawFallenLeaves(ctx, x, y, w, h) {
    const colors = ['#bf5a28', '#d6872c', '#a84120', '#8a3318'];
    for (let i = 0; i < 40; i++) {
      const lx = x + ((i * 61) % w);
      const ly = y + ((i * 83) % h);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, ly, 3, 2);
    }
  }

  #drawBench(ctx, x, y) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x + 2, y + 2, 24, 42);
    ctx.fillStyle = '#523724';
    ctx.fillRect(x, y, 24, 42);
    ctx.fillStyle = '#6b4931';
    ctx.fillRect(x + 3, y + 3, 18, 36);
  }

  #drawPottedFern(ctx, x, y) {
    ctx.fillStyle = '#8f4b2f'; // terra cotta pot
    ctx.fillRect(x, y, 14, 14);
    ctx.fillStyle = '#3a6635'; // green fern fronds
    ctx.beginPath(); ctx.arc(x + 7, y - 2, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4e8248';
    ctx.beginPath(); ctx.arc(x + 7, y - 5, 6, 0, Math.PI * 2); ctx.fill();
  }

  #drawTeacup(ctx, x, y) {
    ctx.fillStyle = '#f2efe9';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5c28'; // tea liquid
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  #drawChairs(ctx, tableR) {
    const chairOffsets = [
      { x: 0, y: -tableR - 13 },
      { x: 0, y: tableR + 13 },
      { x: -tableR - 13, y: 0 },
      { x: tableR + 13, y: 0 },
    ];
    for (const c of chairOffsets) {
      ctx.fillStyle = '#472d1a';
      ctx.fillRect(c.x - 9, c.y - 9, 18, 18);
      ctx.fillStyle = '#8a2b25'; // red velvet cushion
      ctx.fillRect(c.x - 7, c.y - 7, 14, 14);
    }
  }

  #drawRichBookshelf(ctx, x, y, w, h) {
    ctx.fillStyle = '#3b2414';
    ctx.fillRect(x, y, w, h);
    const shH = 24;
    for (let sy = y; sy < y + h; sy += shH) {
      ctx.fillStyle = '#4f321d';
      ctx.fillRect(x, sy + shH - 3, w, 3);
      const bookColors = ['#872c25', '#244d66', '#2b6131', '#ba9332', '#523469', '#d4c7a5'];
      for (let bx = x + 2; bx < x + w - 4; bx += 3) {
        ctx.fillStyle = bookColors[(bx + sy) % bookColors.length];
        ctx.fillRect(bx, sy + 3, 2.5, shH - 6);
      }
    }
  }

  #drawGeneric(ctx, spec, t) {
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(-400, -400, 800, 800);
  }
}
