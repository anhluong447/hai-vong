import * as THREE from 'three';

const PRESETS = {
  follow: { distance: 1, pitch: 0 },   // multipliers/offsets on the location defaults
  wide: { distance: 1.8, pitch: 0.2 },
  close: { distance: 0.6, pitch: -0.05 },
};

const HEAD = new THREE.Vector3(0, 1.45, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();

/**
 * Third-person orbit camera with a cinematic over-the-shoulder mode for dialogue.
 * `yaw` is the direction the camera looks at (0 = +Z).
 */
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0;
    this.pitch = 0.25;
    this.zoom = 1;
    this.preset = 'follow';
    this.base = { distance: 5.5, pitch: 0.25 };
    this.position = new THREE.Vector3(0, 3, -6);
    this.lookAt = new THREE.Vector3();
  }

  /**
   * @param {{ distance?: number, pitch?: number, bounds?: { minX: number, maxX: number, minZ: number, maxZ: number, maxY?: number }, radius?: number, maxY?: number }} options
   *   bounds/radius keep the camera inside rooms (pulled in towards the player when it would leave).
   */
  configure({ distance = 5.5, pitch = 0.25, bounds = null, radius = null, maxY = Infinity } = {}, yaw = 0) {
    this.base = { distance, pitch };
    this.limits = { bounds, radius, maxY: bounds?.maxY ?? maxY };
    this.pitch = pitch;
    this.yaw = yaw;
    this.zoom = 1;
    this.preset = 'follow';
  }

  /**
   * @param {number} dt seconds
   * @param {{ player: THREE.Object3D, speaker: THREE.Object3D|null, look: {dx:number, dy:number}, wheel: number, snap?: boolean }} frame
   */
  update(dt, { player, speaker, look, wheel, snap = false }) {
    const desiredPos = tmpA;
    const desiredLook = tmpB;

    if (speaker) {
      // Over the player's shoulder, looking at the speaker's face.
      const playerHead = tmpC.copy(player.position).add(HEAD);
      const speakerHead = desiredLook.copy(speaker.position).add(HEAD);
      const toPlayer = new THREE.Vector3().subVectors(playerHead, speakerHead).setY(0);
      const dist = Math.max(toPlayer.length(), 0.001);
      toPlayer.divideScalar(dist);
      const side = new THREE.Vector3(toPlayer.z, 0, -toPlayer.x);
      desiredPos.copy(playerHead)
        .addScaledVector(toPlayer, 1.6)
        .addScaledVector(side, 0.75)
        .add(new THREE.Vector3(0, 0.25, 0));
      desiredLook.lerp(playerHead, 0.15);
    } else {
      this.yaw -= look.dx * 0.005;
      this.pitch = THREE.MathUtils.clamp(this.pitch + look.dy * 0.003, -0.1, 1.1);
      this.zoom = THREE.MathUtils.clamp(this.zoom + wheel * 0.08, 0.5, 1.8);
      const preset = PRESETS[this.preset] ?? PRESETS.follow;
      const distance = this.base.distance * preset.distance * this.zoom;
      const pitch = this.pitch + preset.pitch;
      desiredLook.copy(player.position).add(HEAD);
      desiredPos.set(
        desiredLook.x - Math.sin(this.yaw) * Math.cos(pitch) * distance,
        desiredLook.y + Math.sin(pitch) * distance,
        desiredLook.z - Math.cos(this.yaw) * Math.cos(pitch) * distance,
      );
    }

    this.#keepInside(desiredLook, desiredPos);
    const k = snap ? 1 : 1 - Math.exp(-dt * (speaker ? 3.5 : 7));
    this.position.lerp(desiredPos, k);
    this.lookAt.lerp(desiredLook, k);
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.lookAt);
  }

  /** Pull the camera along the look ray until it is inside the room limits. */
  #keepInside(from, to) {
    const { bounds, radius, maxY } = this.limits ?? {};
    if (!bounds && !radius && maxY === Infinity) return;
    const inside = (p) => p.y <= maxY
      && (!radius || Math.hypot(p.x, p.z) <= radius)
      && (!bounds || (p.x >= bounds.minX && p.x <= bounds.maxX && p.z >= bounds.minZ && p.z <= bounds.maxZ));
    const probe = tmpC;
    for (let t = 1; t > 0.1; t -= 0.05) {
      probe.lerpVectors(from, to, t);
      if (inside(probe)) {
        to.copy(probe);
        return;
      }
    }
    to.lerpVectors(from, to, 0.1);
  }
}
