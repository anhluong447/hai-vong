/**
 * Cổng trường THPT Tĩnh Tâm — the foot of the slope, the iron gate, the
 * brass plaque "TĨNH ĐỂ TÂM SÁNG", and the old school building in the fog.
 * @type {import('./contract.js').LocationModule}
 */
const SLOPE_START = -10;
const SLOPE_END = 12;
const TOP = 2.6;

export function groundY(x, z) {
  if (z <= SLOPE_START) return 0;
  if (z >= SLOPE_END) return TOP;
  return ((z - SLOPE_START) / (SLOPE_END - SLOPE_START)) * TOP;
}

export default {
  build(kit, { palette }) {
    const { THREE } = kit;
    const root = kit.group(null);
    const slopeLength = Math.hypot(SLOPE_END - SLOPE_START, TOP);
    const slopeAngle = Math.atan2(TOP, SLOPE_END - SLOPE_START);

    // Road: flat bottom, ramp, plateau. A subtly mottled canvas texture avoids a flat grey runway.
    const road = roadTexture(THREE);
    road.repeat.set(2.2, 12);
    kit.plane(root, [7, 20], '#ffffff', [0, 0.01, SLOPE_START - 10], { material: new THREE.MeshStandardMaterial({ map: road, roughness: 0.92 }) });
    kit.plane(root, [7, slopeLength], '#ffffff', [0, TOP / 2 + 0.01, (SLOPE_START + SLOPE_END) / 2], { rotX: -Math.PI / 2 - slopeAngle, material: new THREE.MeshStandardMaterial({ map: road, roughness: 0.92 }) });
    kit.plane(root, [30, 24], '#76716a', [0, TOP + 0.01, SLOPE_END + 12]);
    // Hillside either side of the road
    for (const side of [-1, 1]) {
      kit.plane(root, [40, 20], palette.grass, [side * 23.5, 0, SLOPE_START - 10]);
      kit.plane(root, [40, slopeLength], palette.grass, [side * 23.5, TOP / 2, (SLOPE_START + SLOPE_END) / 2], { rotX: -Math.PI / 2 - slopeAngle });
      kit.plane(root, [28, 24], palette.grass, [side * 29, TOP - 0.01, SLOPE_END + 12]);
    }
    // Kerbs
    for (const x of [-3.6, 3.6]) {
      kit.box(root, [0.25, 0.2, slopeLength], '#8b877e', [x, TOP / 2 - 0.1, (SLOPE_START + SLOPE_END) / 2], { rotX: -slopeAngle });
    }

    // Pines along the hill
    const rand = kit.random(7);
    for (let i = 0; i < 46; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (5 + rand() * 14);
      const z = -24 + rand() * 40;
      kit.pine(root, [x, groundY(x, z) - 0.05, z], 0.9 + rand() * 0.9);
    }
    // Fallen needles, weeds and old infrastructure give the sea-facing hill some age.
    for (let i = 0; i < 65; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (4.1 + rand() * 8.5);
      const z = -19 + rand() * 32;
      grassClump(kit, root, [x, groundY(x, z), z], 0.22 + rand() * 0.32);
      if (i % 3 === 0) kit.paper(root, [x + (rand() - 0.5), z + (rand() - 0.5)], { rotY: rand() * Math.PI, size: 0.055 + rand() * 0.07, color: '#9b713d' });
    }
    bench(kit, root, [-5.2, groundY(-5.2, -4), -4], 0.35);
    bench(kit, root, [5.2, groundY(5.2, 7), 7], -0.25);
    kit.cylinder(root, [0.24, 0.3, 0.58, 12], '#68716c', [-4.5, groundY(-4.5, 11), 11], { roughness: 0.8 });
    kit.sign(root, ['SƠ ĐỒ TRƯỜNG', 'Dãy A  ·  Sân chính  ·  Thư viện'], [1.5, 0.85], [-5.35, groundY(-5.35, 12) + 1.55, 12], { rotY: Math.PI / 2, bg: '#38534c', fg: '#e7ddc6', align: 'left', weight: 500, emissive: 0.08 });
    kit.crate(root, [5.2, 17.3], { w: 0.66, h: 0.42, d: 0.46, color: '#73513c' });

    // Gate pillars, iron gate, plaque
    const gateZ = 15;
    for (const x of [-3.3, 3.3]) {
      kit.box(root, [0.9, 4.2, 0.9], '#8f887a', [x, TOP, gateZ], { roughness: 0.95 });
      kit.box(root, [1.1, 0.25, 1.1], '#7a7468', [x, TOP + 4.2, gateZ]);
    }
    kit.box(root, [7.6, 0.5, 0.35], '#2a2a2c', [0, TOP + 3.7, gateZ], { metalness: 0.4, roughness: 0.5 });
    kit.sign(root, 'TĨNH ĐỂ TÂM SÁNG', [3.4, 0.46], [0, TOP + 3.95, gateZ - 0.19], {
      bg: '#8a6a2c', fg: '#f7e2a6', rotY: Math.PI, emissive: 0.25,
    });
    // Two leaves of the iron gate, left one half open
    for (const [x, rot] of [[-1.6, -0.9], [1.6, 0]]) {
      const leaf = kit.group(root, [x < 0 ? -2.85 : 2.85, TOP, gateZ], rot);
      for (let b = 0; b < 8; b++) {
        kit.box(leaf, [0.05, 2.6, 0.05], '#1b1b1e', [(x < 0 ? 1 : -1) * (0.2 + b * 0.33), 0, 0], { metalness: 0.6, roughness: 0.4 });
      }
      kit.box(leaf, [2.7, 0.08, 0.06], '#1b1b1e', [(x < 0 ? 1 : -1) * 1.35, 2.3, 0], { metalness: 0.6 });
    }

    // School building beyond the gate (faded yellow walls turned grey by sea wind)
    const school = kit.group(root, [0, TOP, 27]);
    kit.box(school, [26, 7.5, 8], '#b3a88e', [0, 0, 0], { roughness: 0.95 });
    kit.box(school, [27, 0.5, 9], '#6e4b3a', [0, 7.5, 0]);
    for (let floor = 0; floor < 2; floor++) {
      for (let i = -5; i <= 5; i++) {
        kit.box(school, [1.2, 1.5, 0.1], '#2d3440', [i * 2.2, 1.2 + floor * 3.2, -4.02], { roughness: 0.3, metalness: 0.2 });
      }
    }

    // Distant sea glimpse on the left
    kit.plane(root, [120, 60], '#6f8ea0', [-70, -6, -10], { roughness: 0.25, metalness: 0.1 });

    return {
      group: root,
      spawn: { x: 0, z: -14, yaw: 0 },
      bounds: { minX: -3.2, maxX: 3.2, minZ: -22, maxZ: 17.5 },
      colliders: [
        { minX: -3.8, maxX: -2.8, minZ: 14.5, maxZ: 15.5 },
        { minX: 2.8, maxX: 3.8, minZ: 14.5, maxZ: 15.5 },
      ],
      groundY,
      camera: { distance: 5.5, pitch: 0.22 },
      hotspots: {
        plaque: { x: -1.6, z: 12.8, radius: 1.6, y: TOP + 3.4 },
        gate_entrance: { x: 1.2, z: 16.4, radius: 1.5 },
      },
      marks: {
        behind: { x: -1.3, z: -15.2, yaw: 0.6 },
        gate_side: { x: 2.3, z: 12.6, yaw: Math.PI },
        center: { x: 0, z: -11 },
        left: { x: -1.5, z: -11 },
        right: { x: 1.5, z: -11 },
      },
    };
  },
};

function roadTexture(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d');
  g.fillStyle = '#5f605d';
  g.fillRect(0, 0, 128, 128);
  const rand = (() => { let s = 91; return () => ((s = Math.imul(s, 1664525) + 1013904223 >>> 0) / 4294967296); })();
  for (let i = 0; i < 240; i++) {
    const c = Math.floor(72 + rand() * 34);
    g.fillStyle = `rgba(${c},${c},${c - 3},${0.06 + rand() * 0.12})`;
    g.fillRect(rand() * 128, rand() * 128, 1 + rand() * 3, 1 + rand() * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function grassClump(kit, parent, [x, y, z], scale) {
  const { THREE } = kit;
  const g = kit.group(parent, [x, y, z]);
  const material = kit.mat('#77884d', { side: THREE.DoubleSide, roughness: 0.95 });
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.045 * scale, (0.35 + (i % 3) * 0.08) * scale), material);
    blade.position.set((i - 2) * 0.035 * scale, blade.geometry.parameters.height / 2, 0);
    blade.rotation.y = i * 0.72;
    g.add(blade);
  }
}

function bench(kit, parent, [x, y, z], rotY) {
  const g = kit.group(parent, [x, y, z], rotY);
  kit.box(g, [1.45, 0.09, 0.38], '#694630', [0, 0.52, 0]);
  kit.box(g, [1.45, 0.08, 0.32], '#694630', [0, 0.86, 0.14], { rotX: -0.18 });
  for (const px of [-0.48, 0.48]) kit.box(g, [0.08, 0.55, 0.08], '#3f4140', [px, 0, 0]);
}
