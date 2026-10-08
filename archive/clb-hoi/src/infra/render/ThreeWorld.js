import * as THREE from 'three';
import { CANCELLED } from '../../app/ports.js';
import { Input } from './Input.js';
import { CameraRig } from './CameraRig.js';
import { PlayerController, dampAngle } from './PlayerController.js';
import { applyEnvironment } from './Environment.js';
import { createKit } from './LocationKit.js';
import { createCharacter } from './CharacterFactory.js';
import { LOCATIONS, PLACEHOLDER } from './locations/index.js';

const INTERACT_GRACE_MS = 250; // ignore the key press that closed the previous dialogue line
const ACTOR_HOTSPOT_RADIUS = 1.7;

/**
 * WorldPort implementation with Three.js.
 *
 * Bus events: world:hotspot ({ id, prompt } | null), world:step
 */
export class ThreeWorld {
  #clock = { last: performance.now(), t: 0 };
  #location = null;
  #actors = new Map();           // id -> { object, target: Vector3|null, speed, resolve, faceYaw }
  #explore = null;               // { handlers: Map, resolve, startedAt }
  #nearHotspot = null;
  #autoHotspots = new Map();
  #focusId = null;
  #markers = [];

  /**
   * @param {{ canvas: HTMLCanvasElement, characters: import('../../core/model/CharacterRegistry.js').CharacterRegistry,
   *           locationsMeta: Record<string, { name: string, indoor: boolean }>, bus: import('../../core/events/EventBus.js').EventBus }} deps
   */
  constructor({ canvas, characters, locationsMeta, bus }) {
    this.characters = characters;
    this.locationsMeta = locationsMeta;
    this.bus = bus;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    this.hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
    this.sun = new THREE.DirectionalLight('#ffffff', 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 120 });
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.input = new Input(canvas);
    this.rig = new CameraRig(this.camera);
    this.player = createCharacter(characters.protagonist);
    this.scene.add(this.player);
    this.controller = new PlayerController(this.player, { onStep: () => bus.emit('world:step') });

    window.addEventListener('resize', () => this.#resize());
    this.#resize();
    this.renderer.setAnimationLoop(() => this.#frame());
  }

  // ---- WorldPort -------------------------------------------------------

  async loadScene(spec) {
    this.#clearLocation();
    const meta = this.locationsMeta[spec.location] ?? { name: spec.location, indoor: false };
    const module = LOCATIONS[spec.location] ?? PLACEHOLDER;
    if (module === PLACEHOLDER) console.info(`[world] "${spec.location}" has no 3D set yet; using placeholder.`);

    const palette = applyEnvironment(this, spec, { indoor: Boolean(meta.indoor) });
    const built = module.build(createKit(palette), { spec, meta, palette });
    this.#location = built;
    this.scene.add(built.group);

    const { x, z, yaw = 0 } = built.spawn;
    this.player.position.set(x, built.groundY?.(x, z) ?? 0, z);
    this.player.rotation.y = yaw;
    this.rig.configure(built.camera, yaw);
    this.#focusId = null;
    this.#update(0, true);
  }

  showCharacter(id, at, expr) {
    const data = this.characters.get(id);
    if (!data) {
      console.warn(`[world] unknown character "${id}"`);
      return;
    }
    let actor = this.#actors.get(id);
    if (!actor) {
      actor = { object: createCharacter(data), target: null, speed: 1.6, resolve: null, faceYaw: null };
      this.#actors.set(id, actor);
      this.scene.add(actor.object);
    }
    const mark = this.#mark(at, id);
    this.#placeOnGround(actor.object, mark.x, mark.z);
    actor.object.rotation.y = mark.yaw ?? this.#yawTowards(actor.object.position, this.player.position);
    actor.faceYaw = null;
    actor.object.userData.expr = expr; // TODO: drive facial expressions once real models exist
  }

  hideCharacter(id) {
    const ids = id === '*' ? [...this.#actors.keys()] : [id];
    for (const actorId of ids) {
      const actor = this.#actors.get(actorId);
      if (!actor) continue;
      actor.resolve?.();
      this.scene.remove(actor.object);
      disposeTree(actor.object);
      this.#actors.delete(actorId);
      if (this.#focusId === actorId) this.#focusId = null;
    }
  }

  moveCharacter(id, to, speed = 1.6) {
    const actor = this.#actors.get(id);
    if (!actor) return Promise.resolve();
    actor.resolve?.();
    const mark = this.#mark(to, id);
    actor.target = new THREE.Vector3(mark.x, 0, mark.z);
    actor.targetYaw = mark.yaw;
    actor.speed = speed;
    actor.faceYaw = null;
    return new Promise((resolve) => { actor.resolve = resolve; });
  }

  faceCharacter(id, target) {
    const actor = this.#actors.get(id);
    if (!actor) return;
    let point;
    if (target === 'player') point = this.player.position;
    else if (this.#actors.has(target)) point = this.#actors.get(target).object.position;
    else {
      const m = this.#location?.marks?.[target] ?? this.#location?.hotspots?.[target];
      point = m ? new THREE.Vector3(m.x, 0, m.z) : null;
    }
    if (point) actor.faceYaw = this.#yawTowards(actor.object.position, point);
  }

  focusSpeaker(id) {
    this.#focusId = id && this.#actors.has(id) ? id : null;
  }

  setCamera(preset) {
    this.rig.preset = preset;
  }

  explore(handlers) {
    this.#explore?.resolve(CANCELLED);
    return new Promise((resolve) => {
      this.#explore = {
        handlers: new Map(handlers.map((h) => [h.hotspot, h])),
        resolve,
        startedAt: performance.now() + INTERACT_GRACE_MS,
      };
      this.#focusId = null;
      this.rig.preset = 'follow';
      this.#buildMarkers();
    });
  }

  cancelExplore() {
    if (!this.#explore) return;
    const { resolve } = this.#explore;
    this.#endExplore();
    resolve(CANCELLED);
  }

  /** Lets UI buttons (touch) trigger interaction. */
  requestInteract() { this.input.requestInteract(); }
  setInputEnabled(enabled) {
    this.input.enabled = enabled;
    if (!enabled) this.input.releaseAll();
  }

  // ---- internals -------------------------------------------------------

  #frame() {
    const now = performance.now();
    const dt = Math.min((now - this.#clock.last) / 1000, 0.1);
    this.#clock.last = now;
    this.#clock.t += dt;
    this.#update(dt, false);
    this.renderer.render(this.scene, this.camera);
  }

  #update(dt, snap) {
    const location = this.#location;
    if (!location) return;
    const t = this.#clock.t;

    if (this.#explore) {
      this.controller.update(dt, this.input.axis(), this.rig.yaw, location);
      this.#updateHotspots();
    } else {
      this.controller.moving = false;
      this.input.consumeInteract();
      const speaker = this.#focusId ? this.#actors.get(this.#focusId)?.object : null;
      if (speaker) {
        const yaw = this.#yawTowards(this.player.position, speaker.position);
        this.player.rotation.y = dampAngle(this.player.rotation.y, yaw, dt * 6);
      }
    }
    this.player.userData.animate(t, this.controller.moving);

    for (const actor of this.#actors.values()) this.#updateActor(actor, dt, t);
    location.update?.(dt, t);
    for (const marker of this.#markers) {
      const actor = this.#actors.get(marker.userData.actorId);
      if (actor) marker.position.set(actor.object.position.x, marker.position.y, actor.object.position.z);
      marker.position.y = marker.userData.baseY + Math.sin(t * 2.5) * 0.08;
      marker.rotation.y += dt * 1.5;
    }

    const speaker = this.#focusId ? this.#actors.get(this.#focusId)?.object ?? null : null;
    this.rig.update(dt, {
      player: this.player,
      speaker,
      look: this.input.consumeLook(),
      wheel: this.input.consumeWheel(),
      snap,
    });
  }

  #updateActor(actor, dt, t) {
    const obj = actor.object;
    let moving = false;
    if (actor.target) {
      const dx = actor.target.x - obj.position.x;
      const dz = actor.target.z - obj.position.z;
      const dist = Math.hypot(dx, dz);
      const stepLen = actor.speed * dt;
      if (dist <= stepLen || dist < 0.02) {
        this.#placeOnGround(obj, actor.target.x, actor.target.z);
        if (actor.targetYaw !== undefined) actor.faceYaw = actor.targetYaw;
        actor.target = null;
        const done = actor.resolve;
        actor.resolve = null;
        done?.();
      } else {
        this.#placeOnGround(obj, obj.position.x + (dx / dist) * stepLen, obj.position.z + (dz / dist) * stepLen);
        obj.rotation.y = dampAngle(obj.rotation.y, Math.atan2(dx, dz), dt * 10);
        moving = true;
      }
    }
    if (!moving && actor.faceYaw !== null && actor.faceYaw !== undefined) {
      obj.rotation.y = dampAngle(obj.rotation.y, actor.faceYaw, dt * 6);
    }
    obj.userData.animate(t, moving);
  }

  #updateHotspots() {
    const p = this.player.position;
    let best = null;
    for (const handler of this.#explore.handlers.values()) {
      const spot = this.#hotspotPosition(handler.hotspot);
      const d = Math.hypot(spot.x - p.x, spot.z - p.z);
      if (d <= spot.radius && (!best || d < best.d)) best = { d, handler };
    }
    const id = best?.handler.hotspot ?? null;
    if (id !== this.#nearHotspot) {
      this.#nearHotspot = id;
      this.bus.emit('world:hotspot', best ? { id, prompt: this.#promptFor(best.handler) } : null);
    }
    const pressed = this.input.consumeInteract(this.#explore.startedAt);
    if (id && pressed) {
      const { resolve } = this.#explore;
      this.#endExplore();
      resolve(id);
    }
  }

  #endExplore() {
    this.#explore = null;
    this.#nearHotspot = null;
    this.bus.emit('world:hotspot', null);
    this.#clearMarkers();
  }

  #hotspotPosition(id) {
    const actor = this.#actors.get(id);
    if (actor) return { x: actor.object.position.x, z: actor.object.position.z, radius: ACTOR_HOTSPOT_RADIUS, y: actor.object.userData.height + 0.45 };
    const spot = this.#location.hotspots?.[id];
    if (spot) return { radius: 1.5, y: 1.9, ...spot };
    // Script references a hotspot this set doesn't define: lay it out around the spawn.
    if (!this.#autoHotspots.has(id)) {
      const i = this.#autoHotspots.size;
      const angle = (i / 6) * Math.PI * 2 + 0.5;
      const { x, z } = this.#location.spawn;
      this.#autoHotspots.set(id, { x: x + Math.sin(angle) * 3.5, z: z + 3 + Math.cos(angle) * 3.5, radius: 1.4, y: 1.4 });
      console.warn(`[world] hotspot "${id}" not defined in this location; auto-placed.`);
    }
    return this.#autoHotspots.get(id);
  }

  #promptFor(handler) {
    if (handler.prompt) return handler.prompt;
    const spot = this.#location.hotspots?.[handler.hotspot];
    if (spot?.prompt) return spot.prompt;
    return this.characters.get(handler.hotspot)?.short ?? this.characters.get(handler.hotspot)?.name ?? handler.hotspot;
  }

  #buildMarkers() {
    this.#clearMarkers();
    const geometry = new THREE.OctahedronGeometry(0.09);
    for (const handler of this.#explore.handlers.values()) {
      const spot = this.#hotspotPosition(handler.hotspot);
      const material = new THREE.MeshBasicMaterial({ color: handler.kind === 'exit' ? '#8fd3c7' : '#f2c14e', transparent: true, opacity: 0.9 });
      const marker = new THREE.Mesh(geometry, material);
      const ground = this.#location.groundY?.(spot.x, spot.z) ?? 0;
      marker.position.set(spot.x, ground + spot.y, spot.z);
      marker.userData.baseY = ground + spot.y;
      marker.userData.actorId = handler.hotspot;
      this.scene.add(marker);
      this.#markers.push(marker);
    }
  }

  #clearMarkers() {
    for (const marker of this.#markers) {
      this.scene.remove(marker);
      marker.material.dispose();
    }
    this.#markers[0]?.geometry.dispose();
    this.#markers = [];
  }

  #mark(name, actorId) {
    const mark = this.#location?.marks?.[name];
    if (mark) return mark;
    console.warn(`[world] mark "${name}" not defined in this location; placing ${actorId} near the player.`);
    const p = this.player.position;
    const offset = (this.#actors.size % 3) - 1;
    return { x: p.x + offset * 1.2, z: p.z + 2.2 };
  }

  #placeOnGround(obj, x, z) {
    obj.position.set(x, this.#location?.groundY?.(x, z) ?? 0, z);
  }

  #yawTowards(from, to) {
    return Math.atan2(to.x - from.x, to.z - from.z);
  }

  #clearLocation() {
    this.cancelExplore();
    this.hideCharacter('*');
    this.#autoHotspots.clear();
    if (this.#location) {
      this.scene.remove(this.#location.group);
      disposeTree(this.#location.group);
      this.#location = null;
    }
  }

  #resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}

function disposeTree(root) {
  root.traverse((node) => {
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const m of materials) {
      m.map?.dispose();
      m.emissiveMap?.dispose();
      m.dispose();
    }
  });
}
