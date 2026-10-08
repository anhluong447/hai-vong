import * as THREE from 'three';

const WALK = 3.2;
const RUN = 5.6;
const STEP_EVERY = 0.42; // metres per footstep sound at walking pace

/** Moves the player relative to the camera, clamped to the location's walkable area. */
export class PlayerController {
  #stepDistance = 0;

  constructor(player, { onStep } = {}) {
    this.player = player;
    this.onStep = onStep;
    this.moving = false;
  }

  /**
   * @param {number} dt
   * @param {{ x: number, z: number, run: boolean }} axis
   * @param {number} cameraYaw
   * @param {import('./locations/contract.js').BuiltLocation} location
   */
  update(dt, axis, cameraYaw, location) {
    const len = Math.hypot(axis.x, axis.z);
    this.moving = len > 0;
    if (!this.moving) return;

    const fx = Math.sin(cameraYaw);
    const fz = Math.cos(cameraYaw);
    // Camera right vector when looking along (fx, fz) in a right-handed world.
    const rx = -fz;
    const rz = fx;
    const mx = (fx * axis.z + rx * axis.x) / len;
    const mz = (fz * axis.z + rz * axis.x) / len;
    const speed = axis.run ? RUN : WALK;

    const pos = this.player.position;
    const nextX = pos.x + mx * speed * dt;
    const nextZ = pos.z + mz * speed * dt;
    const before = { x: pos.x, z: pos.z };
    if (walkable(location, nextX, pos.z)) pos.x = nextX;
    if (walkable(location, pos.x, nextZ)) pos.z = nextZ;
    pos.y = location.groundY?.(pos.x, pos.z) ?? 0;

    const targetYaw = Math.atan2(mx, mz);
    this.player.rotation.y = dampAngle(this.player.rotation.y, targetYaw, dt * 12);

    this.#stepDistance += Math.hypot(pos.x - before.x, pos.z - before.z);
    const every = axis.run ? STEP_EVERY * 1.5 : STEP_EVERY * 1.6;
    if (this.#stepDistance > every) {
      this.#stepDistance = 0;
      this.onStep?.();
    }
  }
}

export function walkable(location, x, z) {
  const b = location.bounds;
  if (b && (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ)) return false;
  for (const c of location.colliders ?? []) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return false;
  }
  return true;
}

export function dampAngle(current, target, t) {
  const delta = THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + delta * Math.min(1, t);
}
