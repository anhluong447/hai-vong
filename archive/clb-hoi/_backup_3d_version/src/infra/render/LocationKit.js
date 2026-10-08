import * as THREE from 'three';

/**
 * Small toolkit so location modules stay short and declarative.
 * Everything created through the kit is disposed with the location.
 * Replace primitives with glTF models later by adding a `model()` helper here.
 */
export function createKit(palette) {
  const materials = new Map();

  const mat = (color, { roughness = 0.85, metalness = 0, emissive, emissiveIntensity = 1, transparent = false, opacity = 1, side, map } = {}) => {
    const key = [color, roughness, metalness, emissive, emissiveIntensity, transparent, opacity, side, map?.uuid].join('|');
    if (!materials.has(key)) {
      materials.set(key, new THREE.MeshStandardMaterial({
        color, roughness, metalness, transparent, opacity,
        side: side ?? THREE.FrontSide,
        emissive: emissive ?? '#000000',
        emissiveIntensity,
        ...(map ? { map } : {}),
      }));
    }
    return materials.get(key);
  };

  const place = (parent, mesh, [x, y, z], { rotY = 0, rotX = 0, rotZ = 0, shadow = true } = {}) => {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, rotZ);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const kit = {
    THREE,
    palette,
    mat,

    /** Seeded RNG so decorative scatter (trees, extras) is identical on every load. */
    random(seed) {
      return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    group(parent, [x, y, z] = [0, 0, 0], rotY = 0) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      parent?.add(g);
      return g;
    },

    /** Box positioned by its bottom-centre, so y=0 sits on the floor. */
    box(parent, [w, h, d], color, [x, y, z], options = {}) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), options.material ?? mat(color, options));
      return place(parent, mesh, [x, y + h / 2, z], options);
    },

    cylinder(parent, [rTop, rBottom, h, segments = 16], color, [x, y, z], options = {}) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), options.material ?? mat(color, options));
      return place(parent, mesh, [x, y + h / 2, z], options);
    },

    sphere(parent, radius, color, [x, y, z], options = {}) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), options.material ?? mat(color, options));
      return place(parent, mesh, [x, y, z], options);
    },

    /** Horizontal plane (floor/ground) unless rotX is given. */
    plane(parent, [w, d], color, [x, y, z], options = {}) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), options.material ?? mat(color, options));
      return place(parent, mesh, [x, y, z], { rotX: -Math.PI / 2, shadow: false, ...options });
    },

    /** Flat sign with text drawn on a canvas (plaques, boards, room numbers). */
    sign(parent, lines, [w, h], [x, y, z], { bg = '#1c1c1c', fg = '#f1e7c8', font = 'Be Vietnam Pro', weight = 700, rotY = 0, align = 'center', padding = 0.08, emissive = 0.15 } = {}) {
      const texture = textTexture(Array.isArray(lines) ? lines : [lines], w / h, { bg, fg, font, weight, align, padding });
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: emissive });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      return place(parent, mesh, [x, y, z], { rotY, shadow: false });
    },

    /** Stylised pine: stacked cones. */
    pine(parent, [x, y, z], scale = 1) {
      const g = kit.group(parent, [x, y, z]);
      kit.cylinder(g, [0.12 * scale, 0.18 * scale, 1.4 * scale, 6], '#4a3626', [0, 0, 0]);
      for (let i = 0; i < 3; i++) {
        const r = (1.3 - i * 0.32) * scale;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.6 * scale, 7), mat(palette.foliage));
        place(g, cone, [0, (1.6 + i * 0.9) * scale, 0], { rotY: i * 0.7 });
      }
      return g;
    },

    /** Background figure (a student in the crowd). Not interactive. */
    extra(parent, [x, z], { yaw = 0, color = '#eeeeea', skirt = false, y = 0 } = {}) {
      const g = kit.group(parent, [x, y, z], yaw);
      kit.box(g, [0.34, 0.8, 0.22], skirt ? '#2e3a57' : '#2a2d35', [0, 0, 0]);
      kit.box(g, [0.42, 0.6, 0.26], color, [0, 0.8, 0]);
      kit.sphere(g, 0.16, '#e2bf9f', [0, 1.6, 0]);
      kit.sphere(g, 0.17, '#1a1612', [0, 1.66, -0.02]);
      return g;
    },

    /** Small set-dressing helpers. They deliberately use the same palette/material cache as the map. */
    plant(parent, [x, z], { scale = 1, pot = '#8b5b3d', leaves = palette.foliage } = {}) {
      const g = kit.group(parent, [x, 0, z]);
      kit.cylinder(g, [0.17 * scale, 0.24 * scale, 0.34 * scale, 10], pot, [0, 0, 0], { roughness: 0.9 });
      for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 8, 6), mat(leaves, { roughness: 0.9 }));
        leaf.scale.set(0.55, 1.45, 0.36);
        leaf.position.set(Math.sin(i * 2.4) * 0.14 * scale, 0.42 * scale + (i % 2) * 0.11 * scale, Math.cos(i * 2.4) * 0.14 * scale);
        leaf.rotation.y = i * 0.9;
        leaf.castShadow = true;
        g.add(leaf);
      }
      return g;
    },

    crate(parent, [x, z], { w = 0.55, h = 0.42, d = 0.42, color = '#76513a' } = {}) {
      const g = kit.group(parent, [x, 0, z]);
      kit.box(g, [w, h, d], color, [0, 0, 0], { roughness: 0.9 });
      for (const [px, pz] of [[0, -d / 2 - 0.006], [0, d / 2 + 0.006]]) {
        kit.box(g, [w * 0.82, h * 0.12, 0.02], '#4a3022', [px, h * 0.25, pz], { shadow: false });
        kit.box(g, [w * 0.82, h * 0.12, 0.02], '#4a3022', [px, h * 0.64, pz], { shadow: false });
      }
      return g;
    },

    paper(parent, [x, z], { rotY = 0, color = '#d9cfb8', size = 0.22 } = {}) {
      return kit.plane(parent, [size, size * 1.35], color, [x, 0.012, z], { rotY, roughness: 1, shadow: false });
    },
  };
  return kit;
}

function textTexture(lines, aspect, { bg, fg, font, weight, align, padding }) {
  const height = 256;
  const width = Math.round(height * aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);

  const pad = padding * height;
  const lineHeight = (height - pad * 2) / lines.length;
  g.fillStyle = fg;
  g.textBaseline = 'middle';
  g.textAlign = align;
  lines.forEach((line, i) => {
    let size = lineHeight * 0.62;
    g.font = `${weight} ${size}px "${font}", sans-serif`;
    const maxWidth = width - pad * 2;
    while (g.measureText(line).width > maxWidth && size > 8) {
      size -= 2;
      g.font = `${weight} ${size}px "${font}", sans-serif`;
    }
    const x = align === 'left' ? pad : align === 'right' ? width - pad : width / 2;
    g.fillText(line, x, pad + lineHeight * (i + 0.5));
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
