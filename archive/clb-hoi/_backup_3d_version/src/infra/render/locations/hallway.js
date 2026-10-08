/**
 * Hành lang dãy A — cracked patterned floor tiles, dusty windows,
 * the red-velvet Bảng Vàng, and the east stairs up to the attic.
 * @type {import('./contract.js').LocationModule}
 */
const HALF_W = 3;
const LENGTH = 34;
const CEILING = 3.4;

export default {
  build(kit) {
    const { THREE } = kit;
    const root = kit.group(null);

    // Floor: a shared, aged cement-tile material keeps the school visually coherent.
    const tile = new THREE.TextureLoader().load(new URL('../../../../content/assets/textures/aged-encaustic-tile.png', import.meta.url).href);
    tile.colorSpace = THREE.SRGBColorSpace;
    tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
    tile.repeat.set(HALF_W * 2 / 1.6, LENGTH / 1.6);
    tile.anisotropy = 8;
    kit.plane(root, [HALF_W * 2, LENGTH], '#ffffff', [0, 0, 0], { material: new THREE.MeshStandardMaterial({ map: tile, roughness: 0.6 }) });
    kit.plane(root, [HALF_W * 2, LENGTH], '#d8d2c4', [0, CEILING, 0], { rotX: Math.PI / 2 });

    // Left wall with windows (light comes in from here)
    for (let z = -LENGTH / 2; z < LENGTH / 2; z += 4) {
      kit.box(root, [0.3, CEILING, 1.4], '#cfc5a8', [-HALF_W - 0.15, 0, z + 0.7]);
      kit.box(root, [0.3, 1.0, 2.6], '#cfc5a8', [-HALF_W - 0.15, 0, z + 2.7]);
      kit.box(root, [0.3, 0.6, 2.6], '#cfc5a8', [-HALF_W - 0.15, CEILING - 0.6, z + 2.7]);
      kit.box(root, [0.05, 1.8, 2.6], '#fff6dc', [-HALF_W - 0.1, 1.0, z + 2.7], { emissive: '#fff1cc', emissiveIntensity: 0.9, shadow: false });
    }
    // Right wall with classroom doors
    kit.box(root, [0.3, CEILING, LENGTH], '#d9cfb2', [HALF_W + 0.15, 0, 0]);
    for (const z of [-12, -6, 7, 12]) {
      kit.box(root, [0.08, 2.3, 1.1], '#6b4a33', [HALF_W - 0.02, 0, z]);
      kit.sign(root, `12A${Math.abs(z) % 5 + 1}`, [0.5, 0.2], [HALF_W - 0.05, 2.5, z], { rotY: -Math.PI / 2, bg: '#f3efe3', fg: '#333' });
    }
    // Wainscot stripe
    kit.box(root, [0.02, 1.0, LENGTH], '#8a9a86', [HALF_W - 0.01, 0, 0], { shadow: false });

    // Noticeboards, a bin, plants and scattered paper make the corridor feel occupied.
    for (const [z, lines] of [
      [-14, ['TRỰC NHẬT LỚP 12A5', 'Đừng quên tưới cây.']],
      [-8.5, ['THÔNG BÁO', 'Nộp hồ sơ trước thứ Sáu']],
      [4.5, ['CÂU LẠC BỘ HỎI', 'Mọi câu trả lời đều có cái giá.']],
      [10, ['TUẦN LỄ XANH', 'Đổi giấy vụn lấy cây con']],
    ]) kit.sign(root, lines, [1.22, 0.74], [HALF_W - 0.18, 1.95, z], { rotY: -Math.PI / 2, bg: '#e9ddbd', fg: '#544331', align: 'left', weight: 500, emissive: 0.05 });
    kit.cylinder(root, [0.22, 0.28, 0.54, 12], '#66716c', [HALF_W - 0.55, 0, -3.9], { roughness: 0.75 });
    kit.plant(root, [HALF_W - 0.58, 8.5], { scale: 0.9, pot: '#9b674b', leaves: '#587247' });
    kit.plant(root, [-HALF_W + 0.62, -5.8], { scale: 0.72, pot: '#7c5138', leaves: '#6c7f48' });
    kit.crate(root, [HALF_W - 0.54, 14.2], { w: 0.62, h: 0.42, d: 0.52, color: '#6d513b' });
    kit.crate(root, [HALF_W - 0.78, 13.75], { w: 0.4, h: 0.29, d: 0.36, color: '#805d43' });
    const litter = kit.random(121);
    for (let i = 0; i < 18; i++) {
      const x = -2.15 + litter() * 4.3;
      const z = -15 + litter() * 29;
      if (Math.abs(z) < 2.2 && x > 0.8) continue;
      kit.paper(root, [x, z], { rotY: litter() * Math.PI, size: 0.08 + litter() * 0.1, color: i % 5 === 0 ? '#b59d78' : '#e1d6b9' });
    }

    // Bảng Vàng: glass case with red velvet frame
    kit.box(root, [0.18, 1.9, 3.2], '#7d1d22', [HALF_W - 0.1, 0.9, 0], { roughness: 0.9 });
    kit.sign(root, [
      'BẢNG VÀNG THÁNG 9',
      '1. Lục Thanh Vân — 12A1 — 9.6',
      '2. Phan Gia Huy — 12A1 — 9.3',
      '3. Ngô Thiên Ân — 12A1 — 9.2',
      '...',
    ], [2.9, 1.6], [HALF_W - 0.2, 1.85, 0], { rotY: -Math.PI / 2, bg: '#f6ecd0', fg: '#8a1c1c', align: 'left', emissive: 0.3 });

    // East stairs to the attic, with the "no entry" sign
    const stairs = kit.group(root, [-1.6, 0, LENGTH / 2 - 3.2]);
    for (let i = 0; i < 9; i++) kit.box(stairs, [1.6, 0.2 + i * 0.2, 0.32], '#7a5a3e', [0, 0, i * 0.32]);
    kit.sign(root, 'CẤM LÊN TẦNG TUM', [1.1, 0.3], [-0.4, 1.3, LENGTH / 2 - 3.6], { rotY: Math.PI, bg: '#b3261e', fg: '#ffffff' });
    kit.box(root, [HALF_W * 2, CEILING, 0.3], '#cfc5a8', [0, 0, LENGTH / 2 + 0.15]);
    kit.box(root, [HALF_W * 2, CEILING, 0.3], '#cfc5a8', [0, 0, -LENGTH / 2 - 0.15]);

    // Ceiling lamps
    for (let z = -12; z <= 12; z += 8) {
      kit.box(root, [0.9, 0.06, 0.2], '#ffffff', [0, CEILING - 0.08, z], { emissive: '#fff8e0', emissiveIntensity: 1.2, shadow: false });
      const lamp = new THREE.PointLight('#ffeccc', 6, 9, 2);
      lamp.position.set(0, CEILING - 0.3, z);
      root.add(lamp);
    }

    // Crowd along the walls (static extras)
    const rand = kit.random(12);
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -14 + rand() * 26;
      if (Math.abs(z) < 2.4 && side > 0) continue; // keep the board clear
      kit.extra(root, [side * (HALF_W - 0.55), z], { yaw: side > 0 ? -Math.PI / 2 : Math.PI / 2, skirt: rand() > 0.5 });
    }

    return {
      group: root,
      spawn: { x: 0, z: -11, yaw: 0 },
      bounds: { minX: -HALF_W + 0.45, maxX: HALF_W - 0.45, minZ: -LENGTH / 2 + 0.6, maxZ: LENGTH / 2 - 3.4 },
      camera: { distance: 4.2, pitch: 0.16, bounds: { minX: -HALF_W + 0.2, maxX: HALF_W - 0.2, minZ: -LENGTH / 2 + 0.2, maxZ: LENGTH / 2 - 0.2, maxY: CEILING - 0.2 } },
      hotspots: {
        board: { x: 1.9, z: 0, radius: 1.8, y: 2.9 },
        attic_stairs: { x: -1.6, z: LENGTH / 2 - 4.2, radius: 1.5 },
      },
      marks: {
        board_side: { x: 1.4, z: -1.6, yaw: 0.4 },
        far: { x: 0.5, z: 12.5, yaw: Math.PI },
        near: { x: 0.9, z: 1.2, yaw: Math.PI },
        exit_back: { x: 0.9, z: -16, yaw: Math.PI },
        center: { x: 0, z: -8 },
        left: { x: -1.2, z: -8 },
        right: { x: 1.2, z: -8 },
      },
    };
  },
};

function tileTexture(THREE) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#d9cfbb';
  g.fillRect(0, 0, size, size);
  g.fillStyle = '#6d8a86';
  g.beginPath();
  g.moveTo(size / 2, 8); g.lineTo(size - 8, size / 2); g.lineTo(size / 2, size - 8); g.lineTo(8, size / 2);
  g.fill();
  g.fillStyle = '#b6553d';
  g.beginPath();
  g.arc(size / 2, size / 2, 16, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(40,30,20,0.35)';
  g.lineWidth = 3;
  g.strokeRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
