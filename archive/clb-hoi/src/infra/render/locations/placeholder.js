/**
 * Stand-in set for locations that have no 3D module yet. Shows the location
 * name so scenes can be written and played before the set is built.
 * Hotspots the script needs are laid out automatically by ThreeWorld.
 * @type {import('./contract.js').LocationModule}
 */
export default {
  build(kit, { meta, palette }) {
    const root = kit.group(null);
    kit.plane(root, [30, 30], meta.indoor ? '#6b5a48' : palette.grass, [0, 0, 0]);
    const grid = new kit.THREE.GridHelper(30, 30, '#ffffff', '#ffffff');
    grid.material.opacity = 0.12;
    grid.material.transparent = true;
    grid.position.y = 0.01;
    root.add(grid);
    kit.sign(root, [meta.name, '(bối cảnh tạm — chưa dựng 3D)'], [4.4, 1.1], [0, 2.2, 6], { rotY: Math.PI, bg: '#1f2430', fg: '#f3e6c4' });
    kit.box(root, [0.1, 1.7, 0.1], '#444', [0, 0, 6.05]);

    return {
      group: root,
      spawn: { x: 0, z: -4, yaw: 0 },
      bounds: { minX: -12, maxX: 12, minZ: -12, maxZ: 12 },
      camera: { distance: 5, pitch: 0.25 },
      hotspots: {},
      marks: {
        center: { x: 0, z: 0, yaw: Math.PI },
        left: { x: -1.5, z: 0, yaw: Math.PI },
        right: { x: 1.5, z: 0, yaw: Math.PI },
      },
    };
  },
};
