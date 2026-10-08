/**
 * Phòng Số 0 — the old astronomy room under a glass dome. The oval table,
 * the never-empty teapot, the empty chair at the head, the weekly question
 * on the chalkboard.
 * @type {import('./contract.js').LocationModule}
 */
const R = 6;
const WALL_H = 3.2;

export default {
  build(kit, { spec }) {
    const { THREE } = kit;
    const root = kit.group(null);

    // Floor and round wall. The tiled floor is an authored asset; other small marks
    // are geometry so the room still has character before a full asset library exists.
    const floorTile = new THREE.TextureLoader().load(new URL('../../../../content/assets/textures/aged-encaustic-tile.png', import.meta.url).href);
    floorTile.colorSpace = THREE.SRGBColorSpace;
    floorTile.wrapS = floorTile.wrapT = THREE.RepeatWrapping;
    floorTile.repeat.set(4.2, 4.2);
    floorTile.anisotropy = 8;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 64), kit.mat('#ffffff', { map: floorTile, roughness: 0.82 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, WALL_H, 40, 1, true),
      kit.mat('#b8a88a', { side: THREE.BackSide, roughness: 0.95 }),
    );
    wall.position.y = WALL_H / 2;
    wall.receiveShadow = true;
    root.add(wall);
    // A faded lower wall band stops the plaster cylinder from reading as a blank primitive.
    const dado = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.025, R - 0.025, 0.84, 40, 1, true),
      kit.mat('#6d8174', { side: THREE.BackSide, roughness: 0.9 }),
    );
    dado.position.y = 0.42;
    root.add(dado);

    // Glass dome with ribs
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      kit.mat('#bcd6e8', { transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide }),
    );
    dome.position.y = WALL_H;
    root.add(dome);
    for (let i = 0; i < 8; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(R, 0.05, 6, 32, Math.PI),
        kit.mat('#3b3a36', { metalness: 0.5, roughness: 0.4 }),
      );
      rib.position.y = WALL_H;
      rib.rotation.y = (i / 8) * Math.PI;
      root.add(rib);
    }

    // Oval table, chairs, the empty chair at the head
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 32), kit.mat('#5a3a26', { roughness: 0.5 }));
    table.scale.set(1.05, 1, 2.1);
    table.position.set(0, 0.76, 0.4);
    table.castShadow = table.receiveShadow = true;
    root.add(table);
    kit.cylinder(root, [0.12, 0.18, 0.72, 10], '#3f2a1c', [0, 0, 0.4]);
    for (const [x, z, rot] of [[-1.45, -0.6, Math.PI / 2], [-1.45, 1.4, Math.PI / 2], [1.45, -0.6, -Math.PI / 2], [1.45, 1.4, -Math.PI / 2], [0, -2.2, 0]]) {
      chair(kit, root, [x, z], rot, '#6d4c35');
    }
    chair(kit, root, [0, 3.0], Math.PI, '#7b2f2a'); // the empty chair (cushion worn red)

    // Teapot and cups
    kit.sphere(root, 0.13, '#8a4b2f', [0.1, 0.93, 0.4], { roughness: 0.6 });
    kit.cylinder(root, [0.02, 0.035, 0.14, 8], '#8a4b2f', [0.24, 0.9, 0.4], { rotZ: -0.9 });
    for (const [x, z] of [[-0.4, -0.3], [0.5, 1.1], [-0.3, 1.3]]) kit.cylinder(root, [0.04, 0.035, 0.07, 10], '#e9e1cf', [x, 0.8, z]);
    const steam = kit.sphere(root, 0.05, '#ffffff', [0.1, 1.15, 0.4], { transparent: true, opacity: 0.25, shadow: false });
    // The tiny still-life details make the club feel used, not staged.
    kit.box(root, [0.28, 0.035, 0.2], '#f0e7cf', [-0.8, 0.81, 0.85], { shadow: false }); // folded note
    kit.box(root, [0.18, 0.035, 0.25], '#2d4f66', [0.72, 0.81, -0.15], { shadow: false }); // notebook
    kit.cylinder(root, [0.035, 0.035, 0.18, 8], '#d5c8a2', [-0.45, 0.82, 0.92], { rotZ: Math.PI / 2, shadow: false }); // chalk

    // Chalkboard with the weekly question
    kit.box(root, [4.2, 1.8, 0.1], '#4a3a2a', [0, 0.95, R - 0.45]);
    kit.sign(root, ['NẾU KHÔNG AI CHẤM ĐIỂM BẠN,', 'BẠN CÒN HỌC KHÔNG?'], [4, 1.6], [0, 1.85, R - 0.52], {
      bg: '#26382e', fg: '#f2f2ea', rotY: Math.PI, weight: 500, emissive: 0.1,
    });

    // Door, bookshelves
    kit.box(root, [1.2, 2.3, 0.1], '#5b3d2a', [0, 0, -R + 0.25]);
    kit.sign(root, '0', [0.3, 0.3], [0, 2.5, -R + 0.32], { bg: '#c8c8c8', fg: '#222' });
    for (const side of [-1, 1]) {
      const shelf = kit.group(root, [side * (R - 0.9), 0, -1.5], -side * Math.PI / 2); // face the room centre
      kit.box(shelf, [2.4, 2.2, 0.45], '#4a3222', [0, 0, 0]);
      const rand = kit.random(side > 0 ? 3 : 9);
      for (let row = 0; row < 4; row++) {
        for (let b = 0; b < 12; b++) {
          const h = 0.3 + rand() * 0.12;
          kit.box(shelf, [0.14, h, 0.3], ['#7a2e2a', '#2f4a5a', '#5a5a2f', '#d9cfb2'][Math.floor(rand() * 4)], [-1.05 + b * 0.18, 0.1 + row * 0.52, 0.02], { shadow: false });
        }
      }
    }

    // Astronomy-club history: a scratched globe, rolled star charts, archive boxes and old notices.
    const globe = kit.group(root, [-3.8, 0, 2.2], 0.25);
    kit.cylinder(globe, [0.23, 0.3, 0.62, 10], '#4a3222', [0, 0, 0]);
    kit.sphere(globe, 0.36, '#587d8c', [0, 1.02, 0], { roughness: 0.7 });
    kit.cylinder(globe, [0.39, 0.39, 0.025, 16], '#ae9160', [0, 1.02, 0], { rotZ: Math.PI / 2, shadow: false });
    kit.crate(root, [3.9, 2.45], { w: 0.72, h: 0.46, d: 0.52 });
    kit.crate(root, [4.35, 2.78], { w: 0.5, h: 0.32, d: 0.4, color: '#6b4732' });
    for (const [x, z, rotY] of [[-2.8, 3.95, 0.2], [-2.3, 4.28, -0.5], [2.85, 4.1, 0.8]]) {
      kit.cylinder(root, [0.055, 0.055, 0.65, 10], '#d8c79f', [x, 0.03, z], { rotZ: Math.PI / 2, rotY, shadow: false });
    }
    kit.plant(root, [-4.65, -2.8], { scale: 1.2, leaves: '#45684a' });
    kit.plant(root, [4.5, -3.15], { scale: 0.85, pot: '#9b674b', leaves: '#607b45' });
    kit.cylinder(root, [0.22, 0.28, 0.42, 12], '#57605a', [4.5, 0, 0.4], { roughness: 0.75 }); // wastebasket
    const litter = kit.random(41);
    for (let i = 0; i < 13; i++) {
      const angle = litter() * Math.PI * 2;
      const radius = 3.2 + litter() * 1.7;
      kit.paper(root, [Math.cos(angle) * radius, Math.sin(angle) * radius], {
        rotY: litter() * Math.PI,
        color: i % 4 === 0 ? '#b9a982' : '#e1d6bb',
        size: 0.11 + litter() * 0.12,
      });
    }

    // Sunlit dust makes the glass dome legible and gives noon scenes a quiet, lived-in air.
    const dust = dustMotes(THREE, kit.random(77));
    root.add(dust);

    // Light pouring through the dome
    const warm = new THREE.PointLight('#ffe2b8', spec.time === 'night' ? 3 : 7, 12, 2);
    warm.position.set(0, WALL_H + 1.2, 0.5);
    warm.castShadow = true;
    root.add(warm);

    return {
      group: root,
      spawn: { x: 0, z: -3.6, yaw: 0 },
      bounds: { minX: -4.4, maxX: 4.4, minZ: -5.1, maxZ: 5.0 },
      colliders: [{ minX: -1.2, maxX: 1.2, minZ: -1.9, maxZ: 2.7 }],
      camera: { distance: 3.2, pitch: 0.35, radius: R - 0.35, maxY: WALL_H + 2.5 },
      hotspots: {
        chalkboard: { x: -1.8, z: 4.6, radius: 1.3, y: 2.9 },
        chair: { x: 0, z: 3.4, radius: 1.0 },
        teapot: { x: 1.6, z: 0.4, radius: 1.2, y: 1.4 },
        door: { x: 0, z: -4.9, radius: 1.2, y: 2.6 },
      },
      marks: {
        board: { x: 1.6, z: 4.6, yaw: 0 },
        window: { x: -3.2, z: 1.5, yaw: -Math.PI / 2 },
        center: { x: 0, z: -3 },
        left: { x: -1.5, z: -3 },
        right: { x: 1.5, z: -3 },
      },
      update: (dt, t) => {
        steam.position.y = 1.15 + (t * 0.25) % 0.4;
        steam.material.opacity = 0.25 * (1 - ((t * 0.25) % 0.4) / 0.4);
        dust.rotation.y = t * 0.018;
        dust.position.y = Math.sin(t * 0.22) * 0.05;
      },
    };
  },
};

function chair(kit, parent, [x, z], rotY, cushion) {
  const g = kit.group(parent, [x, 0, z], rotY);
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) kit.box(g, [0.05, 0.45, 0.05], '#3f2a1c', [lx, 0, lz]);
  kit.box(g, [0.48, 0.06, 0.48], cushion, [0, 0.45, 0]);
  kit.box(g, [0.48, 0.55, 0.05], '#3f2a1c', [0, 0.5, -0.22]);
}

function dustMotes(THREE, rand) {
  const count = 130;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 7;
    positions[i * 3 + 1] = 0.5 + rand() * 4.8;
    positions[i * 3 + 2] = (rand() - 0.5) * 6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#fff0c7', size: 0.026, transparent: true, opacity: 0.45, depthWrite: false }));
}
