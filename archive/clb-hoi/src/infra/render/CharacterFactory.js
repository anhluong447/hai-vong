import * as THREE from 'three';

/**
 * Builds stylised placeholder characters from content/characters.json.
 * The rest of the renderer only relies on: a Group facing +Z, feet at y=0,
 * and `userData.animate(t, moving)`. Swap this for a VRM/glTF loader later
 * without touching ThreeWorld.
 */
export function createCharacter(data) {
  if (data.role === 'cat') return createCat(data);

  const h = data.height ?? 1.7;
  const s = h / 1.7;
  const broad = data.build === 'broad' ? 1.18 : 1;
  const skirt = ['heroine'].includes(data.role) || ['mai', 'me', 'linh', 'ba_sau'].includes(data.id);

  const root = new THREE.Group();
  root.name = data.id;
  const body = new THREE.Group();
  root.add(body);

  const shirt = std(data.color ?? '#eeeeee');
  const bottom = std(skirt ? '#2e3a57' : '#262a33');
  const skin = std('#e7c3a1');
  const hair = std(data.hair ?? '#1a1a1a', 0.6);
  const accent = std(data.accent ?? '#8c96a8');

  // Legs / skirt
  if (skirt) {
    add(body, new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 0.42 * s, 14), bottom, [0, 0.62 * s, 0]);
    for (const x of [-0.08, 0.08]) add(body, new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.45 * s, 8), skin, [x * s, 0.22 * s, 0]);
  } else {
    for (const x of [-0.1, 0.1]) add(body, new THREE.CylinderGeometry(0.075 * s, 0.07 * s, 0.84 * s, 8), bottom, [x * s * broad, 0.42 * s, 0]);
  }

  // Torso, arms, tie/ribbon
  add(body, new THREE.CapsuleGeometry(0.2 * s * broad, 0.34 * s, 4, 12), shirt, [0, 1.08 * s, 0]);
  for (const side of [-1, 1]) {
    const arm = add(body, new THREE.CapsuleGeometry(0.055 * s, 0.46 * s, 4, 8), shirt, [side * 0.27 * s * broad, 1.04 * s, 0]);
    arm.rotation.z = side * 0.08;
  }
  add(body, new THREE.BoxGeometry(0.06 * s, 0.22 * s, 0.02), accent, [0, 1.2 * s, 0.2 * s * broad]);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.5 * s, 0);
  body.add(head);
  add(head, new THREE.SphereGeometry(0.15 * s, 20, 16), skin, [0, 0, 0]);
  const cap = add(head, new THREE.SphereGeometry(0.162 * s, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, [0, 0.015 * s, -0.01 * s]);
  cap.rotation.x = -0.25;
  if (skirt) add(head, new THREE.CapsuleGeometry(0.06 * s, 0.22 * s, 4, 8), hair, [0, -0.08 * s, -0.13 * s]); // ponytail / long hair
  for (const x of [-0.05, 0.05]) add(head, new THREE.SphereGeometry(0.018 * s, 8, 6), std('#1b1b1b'), [x * s, 0.0, 0.14 * s]);

  root.userData.head = head;
  root.userData.height = h;
  root.userData.animate = (t, moving) => {
    const bob = moving ? Math.abs(Math.sin(t * 9)) * 0.04 : Math.sin(t * 1.6) * 0.006;
    body.position.y = bob;
    head.rotation.z = moving ? Math.sin(t * 9) * 0.03 : 0;
  };
  return root;
}

function createCat(data) {
  const root = new THREE.Group();
  const fur = std(data.color ?? '#111', 0.9);
  add(root, new THREE.CapsuleGeometry(0.09, 0.22, 4, 8), fur, [0, 0.14, 0]).rotation.x = Math.PI / 2;
  add(root, new THREE.SphereGeometry(0.08, 12, 10), fur, [0, 0.22, 0.17]);
  for (const x of [-0.03, 0.03]) add(root, new THREE.SphereGeometry(0.012, 6, 6), std('#e8c040', 0.3, '#e8c040'), [x, 0.24, 0.24]);
  root.userData.head = root;
  root.userData.height = 0.3;
  root.userData.animate = () => {};
  return root;
}

function std(color, roughness = 0.75, emissive) {
  return new THREE.MeshStandardMaterial({ color, roughness, emissive: emissive ?? '#000000', emissiveIntensity: emissive ? 0.8 : 0 });
}

function add(parent, geometry, material, [x, y, z]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
