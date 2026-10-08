/**
 * 2D Canvas Top-Down World Engine for "Câu Lạc Bộ Hỏi".
 * Implements WorldPort without any 3D/Three.js dependencies.
 * Delivers a rich retro 16-bit RPG Maker aesthetic combined with modern Persona visual novel UI.
 */

import { CANCELLED } from '../../app/ports.js';
import { SpriteFactory, SPRITE_W, SPRITE_H, WALK_FRAMES, DRAW_W, DRAW_H } from './SpriteFactory.js';
import { MapRenderer, METER } from './MapRenderer.js';
import { LOCATIONS_2D, DEFAULT_LOCATION } from './locations.js';

const WALK_SPEED = 3.8; // meters per second
const STRIDE_DISTANCE = 0.85; // distance per footstep sound
const INTERACT_GRACE_MS = 250;

export class Canvas2DWorld {
  #canvas;
  #ctx;
  #bus;
  #characters;
  #locationsMeta;

  #spriteFactory = new SpriteFactory();
  #mapRenderer = new MapRenderer();

  #currentScene = null;
  #currentLocation = DEFAULT_LOCATION;
  #locationId = 'gate';

  // Player state (meters)
  #player = {
    x: 0,
    z: -14,
    dir: 0, // 0: down, 1: up, 2: left, 3: right
    frame: 0,
    moving: false,
    animTimer: 0,
    data: null,
  };

  // Actors (NPCs): Map<id, Actor>
  #actors = new Map();

  // Camera (screen space)
  #cam = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    scale: 2.5,
    baseScale: 2.5,
    preset: 'follow',
  };

  // Input
  #keys = new Set();
  #inputEnabled = true;
  #touchInput = { dx: 0, dy: 0, active: false };

  // Explore & Interaction
  #explore = null; // { handlers: Map, resolve, startedAt }
  #nearHotspot = null; // { id, prompt, x, z }
  #focusSpeakerId = null;

  // Animation Loop
  #animId = null;
  #lastTime = performance.now();
  #stepAccumulator = 0;
  #vignette = null;

  constructor({ canvas, characters, locationsMeta, bus }) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');
    this.#characters = characters;
    this.#locationsMeta = locationsMeta;
    this.#bus = bus;

    this.#player.data = characters.protagonist;
    this.ready = this.#spriteFactory.preload(characters.all());

    this.#setupCanvas();
    this.#setupInput();
    this.#startLoop();
  }

  // ---------------------------------------------------------------------------
  // Canvas & Resize
  // ---------------------------------------------------------------------------
  #setupCanvas() {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.#canvas.width = Math.floor(w * dpr);
      this.#canvas.height = Math.floor(h * dpr);
      this.#canvas.style.width = `${w}px`;
      this.#canvas.style.height = `${h}px`;

      // Wider framing: about 26% farther out on desktop, with more map on mobile.
      const baseScale = Math.min(w / 460, h / 315);
      this.#cam.baseScale = Math.max(1.55, Math.min(2.8, baseScale)) * dpr;
      this.setCamera(this.#cam.preset);

      this.#ctx.imageSmoothingEnabled = false;
      const shade = this.#ctx.createRadialGradient(w * dpr / 2, h * dpr * 0.42, h * dpr * 0.2,
        w * dpr / 2, h * dpr / 2, Math.max(w, h) * dpr * 0.7);
      shade.addColorStop(0, 'rgba(15,22,37,0)');
      shade.addColorStop(1, 'rgba(15,22,37,.32)');
      this.#vignette = shade;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  // ---------------------------------------------------------------------------
  // Input Handling (Keyboard + Touch)
  // ---------------------------------------------------------------------------
  #setupInput() {
    window.addEventListener('keydown', (e) => {
      if (!this.#inputEnabled) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')) return;
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'shift'].includes(key)) {
        e.preventDefault();
        this.#keys.add(key);
      }
      if (key === 'e' || key === ' ' || key === 'enter') {
        this.requestInteract();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.#keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => { this.#keys.clear(); this.#touchInput.active = false; });

    // Touch controls: tap on screen or drag
    let touchStartX = 0;
    let touchStartY = 0;

    this.#canvas.addEventListener('touchstart', (e) => {
      if (!this.#inputEnabled || e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      this.#touchInput.active = true;
    }, { passive: true });

    this.#canvas.addEventListener('touchmove', (e) => {
      if (!this.#touchInput.active || e.touches.length === 0) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - touchStartX;
      const dy = curY - touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist > 15) {
        this.#touchInput.dx = dx / dist;
        this.#touchInput.dy = dy / dist;
      } else {
        this.#touchInput.dx = 0;
        this.#touchInput.dy = 0;
      }
    }, { passive: true });

    const endTouch = () => {
      this.#touchInput.active = false;
      this.#touchInput.dx = 0;
      this.#touchInput.dy = 0;
    };
    this.#canvas.addEventListener('touchend', endTouch);
    this.#canvas.addEventListener('touchcancel', endTouch);
  }

  // ---------------------------------------------------------------------------
  // WorldPort Interface
  // ---------------------------------------------------------------------------

  async loadScene(spec) {
    this.cancelExplore();
    this.hideCharacter('*');
    this.#stepAccumulator = 0;
    this.#currentScene = spec;
    this.#locationId = spec.location;
    this.setCamera('follow');
    this.#currentLocation = LOCATIONS_2D[spec.location] ?? {
      ...DEFAULT_LOCATION,
      name: this.#locationsMeta[spec.location]?.name ?? spec.location,
    };

    // Place player at spawn point
    const spawn = this.#currentLocation.spawn;
    this.#player.x = spawn.x;
    this.#player.z = spawn.z;
    this.#player.dir = spawn.yaw != null ? this.#yawToDir(spawn.yaw) : 1;
    this.#player.moving = false;
    this.#player.frame = 0;

    // Reset camera onto player instantly
    this.#cam.targetX = this.#player.x * METER;
    this.#cam.targetY = -this.#player.z * METER;
    if (this.#locationId === 'room0') { this.#cam.targetX = 0; this.#cam.targetY = 20; }
    this.#cam.x = this.#cam.targetX;
    this.#cam.y = this.#cam.targetY;
    this.#focusSpeakerId = null;
  }

  showCharacter(id, at, expr) {
    const data = this.#characters.get(id);
    if (!data) return;

    let actor = this.#actors.get(id);
    if (!actor) {
      actor = {
        id,
        data,
        x: 0,
        z: 0,
        dir: 0,
        frame: 0,
        animTimer: 0,
        target: null,
        speed: 1.8,
        resolve: null,
        faceYaw: null,
        expr,
      };
      this.#actors.set(id, actor);
    }

    const mark = this.#getMark(at, id);
    actor.x = mark.x;
    actor.z = mark.z;
    actor.dir = mark.yaw != null ? this.#yawToDir(mark.yaw) : this.#dirTowards(actor, this.#player);
    actor.faceYaw = null;
    actor.expr = expr;

    // If character appears near player, player turns to face them
    if (Math.hypot(actor.x - this.#player.x, actor.z - this.#player.z) < 3.5) {
      this.#player.dir = this.#dirTowards(this.#player, actor);
    }
  }

  hideCharacter(id) {
    if (id === '*') {
      for (const a of this.#actors.values()) a.resolve?.();
      this.#actors.clear();
      this.#focusSpeakerId = null;
    } else {
      const a = this.#actors.get(id);
      if (a) {
        a.resolve?.();
        this.#actors.delete(id);
        if (this.#focusSpeakerId === id) this.#focusSpeakerId = null;
      }
    }
  }

  moveCharacter(id, to, speed = 1.8) {
    const actor = this.#actors.get(id);
    if (!actor) return Promise.resolve();
    actor.resolve?.();

    const mark = this.#getMark(to, id);
    actor.target = { x: mark.x, z: mark.z, targetYaw: mark.yaw };
    actor.speed = speed;
    actor.faceYaw = null;

    return new Promise((resolve) => {
      actor.resolve = resolve;
    });
  }

  faceCharacter(id, target) {
    const actor = this.#actors.get(id);
    if (!actor) return;

    let targetPos = null;
    if (target === 'player') {
      targetPos = this.#player;
    } else if (this.#actors.has(target)) {
      targetPos = this.#actors.get(target);
    } else {
      const m = this.#currentLocation.marks?.[target] ?? this.#currentLocation.hotspots?.[target];
      if (m) targetPos = m;
    }

    if (targetPos) {
      actor.dir = this.#dirTowards(actor, targetPos);
    }
  }

  focusSpeaker(id) {
    this.#focusSpeakerId = (id && this.#actors.has(id)) ? id : null;
    if (this.#focusSpeakerId) {
      const spk = this.#actors.get(this.#focusSpeakerId);
      // Turn speaker to face player
      spk.dir = this.#dirTowards(spk, this.#player);
      // Turn player to face speaker
      this.#player.dir = this.#dirTowards(this.#player, spk);
    }
  }

  setCamera(preset, target) {
    this.#cam.preset = preset;
    let baseScale = this.#cam.baseScale;
    if (this.#locationId === 'room0') {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Establish the whole club room, including Vân at the board, above dialogue.
      const fit = Math.min((this.#canvas.width - 48 * dpr) / 352, (this.#canvas.height - 260 * dpr) / 352);
      baseScale = Math.min(baseScale, Math.max(.65 * dpr, fit));
    }
    this.#cam.scale = baseScale * ({ cinematic: 1.15, wide: 0.85 }[preset] ?? 1);
  }

  cancelPending() {
    for (const actor of this.#actors.values()) {
      actor.target = null;
      actor.resolve?.(CANCELLED);
      actor.resolve = null;
      actor.frame = 0;
    }
  }

  snapshot() {
    return {
      location: this.#locationId,
      player: { x: this.#player.x, z: this.#player.z, dir: this.#player.dir },
      camera: { x: this.#cam.x, y: this.#cam.y, preset: this.#cam.preset },
      actors: Object.fromEntries([...this.#actors].map(([id, a]) => [id, { x: a.x, z: a.z, dir: a.dir }])),
    };
  }

  restoreSnapshot(snapshot) {
    if (!snapshot || snapshot.location !== this.#locationId) return;
    if (snapshot.player && [snapshot.player.x, snapshot.player.z].every(Number.isFinite)) Object.assign(this.#player, snapshot.player);
    for (const [id, saved] of Object.entries(snapshot.actors ?? {})) {
      const actor = this.#actors.get(id);
      if (actor && [saved.x, saved.z].every(Number.isFinite)) Object.assign(actor, saved);
    }
    if (snapshot.camera) {
      this.setCamera(snapshot.camera.preset ?? 'follow');
      if ([snapshot.camera.x, snapshot.camera.y].every(Number.isFinite)) {
        this.#cam.x = snapshot.camera.x;
        this.#cam.y = snapshot.camera.y;
      }
    }
  }

  explore(handlers) {
    this.#explore?.resolve(CANCELLED);

    return new Promise((resolve) => {
      this.#explore = {
        handlers: new Map(handlers.map((h) => [h.hotspot, h])),
        resolve,
        startedAt: performance.now() + INTERACT_GRACE_MS,
      };
      this.#focusSpeakerId = null;
    });
  }

  cancelExplore() {
    if (!this.#explore) return;
    const { resolve } = this.#explore;
    this.#explore = null;
    this.#nearHotspot = null;
    this.#bus.emit('world:hotspot', null);
    resolve(CANCELLED);
  }

  requestInteract() {
    if (!this.#inputEnabled) return;
    if (!this.#explore || performance.now() < this.#explore.startedAt) return;
    // Resolve against the current position, including immediately after a load.
    this.#checkHotspots();
    if (!this.#nearHotspot) return;

    const handler = this.#explore.handlers.get(this.#nearHotspot.id);
    if (!handler) return;

    const { resolve } = this.#explore;
    this.#explore = null;
    this.#nearHotspot = null;
    this.#bus.emit('world:hotspot', null);
    resolve(handler.hotspot);
  }

  setInputEnabled(enabled) {
    this.#inputEnabled = enabled;
    if (!enabled) {
      this.#keys.clear();
      this.#touchInput.active = false;
      this.#player.moving = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Main Game Loop (Update & Render)
  // ---------------------------------------------------------------------------
  #startLoop() {
    const loop = (time) => {
      const dt = Math.min((time - this.#lastTime) / 1000, 0.1);
      this.#lastTime = time;

      this.#update(dt, time / 1000);
      this.#render(time / 1000);

      this.#animId = requestAnimationFrame(loop);
    };
    this.#animId = requestAnimationFrame(loop);
  }

  #update(dt, t) {
    // 1. Update Player Movement (only during explore mode)
    if (this.#explore && this.#inputEnabled) {
      let vx = 0;
      let vz = 0;

      if (this.#keys.has('arrowup') || this.#keys.has('w')) vz += 1; // forward/North
      if (this.#keys.has('arrowdown') || this.#keys.has('s')) vz -= 1; // backward/South
      if (this.#keys.has('arrowleft') || this.#keys.has('a')) vx -= 1; // West
      if (this.#keys.has('arrowright') || this.#keys.has('d')) vx += 1; // East

      if (this.#touchInput.active) {
        vx = this.#touchInput.dx;
        vz = -this.#touchInput.dy; // invert screen touch Y
      }

      const len = Math.hypot(vx, vz);
      if (len > 0.05) {
        const speed = WALK_SPEED * (this.#keys.has('shift') ? 1.6 : 1);
        vx = (vx / len) * speed * dt;
        vz = (vz / len) * speed * dt;

        // Facing direction
        if (Math.abs(vx) > Math.abs(vz)) {
          this.#player.dir = vx > 0 ? 3 : 2; // right : left
        } else {
          this.#player.dir = vz > 0 ? 1 : 0; // up : down
        }

        // Try moving with AABB collision and sliding
        this.#moveWithCollision(this.#player, vx, vz);
        this.#player.moving = true;

        // Walk cycle animation
        this.#player.animTimer += dt * 12;
        this.#player.frame = Math.floor(this.#player.animTimer) % WALK_FRAMES;

        // Footstep sound event
        this.#stepAccumulator += Math.hypot(vx, vz);
        if (this.#stepAccumulator >= STRIDE_DISTANCE) {
          this.#stepAccumulator = 0;
          this.#bus.emit('world:step');
        }
      } else {
        this.#player.moving = false;
        this.#player.frame = 0; // idle stand
      }
    } else {
      this.#player.moving = false;
      this.#player.frame = 0;
    }

    // 2. Update NPCs
    for (const actor of this.#actors.values()) {
      if (actor.target && this.#inputEnabled) {
        const dx = actor.target.x - actor.x;
        const dz = actor.target.z - actor.z;
        const dist = Math.hypot(dx, dz);
        const step = actor.speed * dt;

        if (dist <= step) {
          actor.x = actor.target.x;
          actor.z = actor.target.z;
          if (actor.target.targetYaw != null) actor.dir = this.#yawToDir(actor.target.targetYaw);
          actor.target = null;
          actor.frame = 0;
          actor.resolve?.();
          actor.resolve = null;
        } else {
          actor.x += (dx / dist) * step;
          actor.z += (dz / dist) * step;
          if (Math.abs(dx) > Math.abs(dz)) {
            actor.dir = dx > 0 ? 3 : 2;
          } else {
            actor.dir = dz > 0 ? 1 : 0;
          }
          actor.animTimer += dt * 10;
          actor.frame = Math.floor(actor.animTimer) % WALK_FRAMES;
        }
      }
    }

    // 3. Hotspot Proximity Check
    this.#checkHotspots();

    // 4. Camera Follow
    let targetX = this.#player.x * METER;
    let targetY = -this.#player.z * METER;

    if (this.#focusSpeakerId && this.#actors.has(this.#focusSpeakerId)) {
      const spk = this.#actors.get(this.#focusSpeakerId);
      targetX = ((this.#player.x + spk.x) / 2) * METER;
      targetY = -((this.#player.z + spk.z) / 2) * METER;
    }
    if (this.#locationId === 'room0') { targetX = 0; targetY = 20; }

    // Smooth lerp camera
    const blend = 1 - Math.exp(-8 * dt);
    this.#cam.x += (targetX - this.#cam.x) * blend;
    this.#cam.y += (targetY - this.#cam.y) * blend;
  }

  #moveWithCollision(entity, vx, vz) {
    const loc = this.#currentLocation;
    const b = loc.bounds;

    // Test X movement
    let newX = entity.x + vx;
    if (b && (newX < b.minX || newX > b.maxX || this.#collides(newX, entity.z))) {
      // Wall hit on X
      newX = entity.x;
    }
    entity.x = newX;

    // Test Z movement
    let newZ = entity.z + vz;
    if (b && (newZ < b.minZ || newZ > b.maxZ || this.#collides(entity.x, newZ))) {
      // Wall hit on Z
      newZ = entity.z;
    }
    entity.z = newZ;
  }

  #collides(x, z) {
    const colliders = this.#currentLocation.colliders;
    if (!colliders) return false;
    for (const c of colliders) {
      if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) {
        return true;
      }
    }
    return false;
  }

  #checkHotspots() {
    if (!this.#explore) {
      if (this.#nearHotspot) {
        this.#nearHotspot = null;
        this.#bus.emit('world:hotspot', null);
      }
      return;
    }

    let closest = null;
    let minDist = 2.4; // interaction reach in meters

    // Check registered hotspots
    const hotspots = this.#currentLocation.hotspots ?? {};
    for (const [id, hs] of Object.entries(hotspots)) {
      if (!this.#explore.handlers.has(id)) continue;
      const d = Math.hypot(this.#player.x - hs.x, this.#player.z - hs.z);
      if (d <= (hs.radius ?? 1.8) && d < minDist) {
        minDist = d;
        closest = {
          id,
          prompt: this.#explore.handlers.get(id).prompt ?? hs.label ?? id,
          x: hs.x,
          z: hs.z,
        };
      }
    }

    // Check visible NPCs that are in handlers
    for (const [id, actor] of this.#actors.entries()) {
      if (!this.#explore.handlers.has(id)) continue;
      const d = Math.hypot(this.#player.x - actor.x, this.#player.z - actor.z);
      if (d <= 2.2 && d < minDist) {
        minDist = d;
        closest = {
          id,
          prompt: this.#explore.handlers.get(id).prompt ?? `Trò chuyện với ${actor.data.name}`,
          x: actor.x,
          z: actor.z,
        };
      }
    }

    if (closest?.id !== this.#nearHotspot?.id) {
      this.#nearHotspot = closest;
      this.#bus.emit('world:hotspot', closest ? { id: closest.id, prompt: closest.prompt } : null);
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  #render(t) {
    const ctx = this.#ctx;
    const canvas = this.#canvas;
    const w = canvas.width;
    const h = canvas.height;
    const scale = this.#cam.scale;

    // Clear Screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.#cam.x, -this.#cam.y);

    // 1. Draw Map Background
    this.#mapRenderer.drawBackground(ctx, this.#locationId, this.#currentScene, t);

    // 2. Draw Characters (sorted by Y for correct depth overlap!)
    const renderables = [
      { type: 'player', y: -this.#player.z * METER, obj: this.#player },
    ];
    for (const actor of this.#actors.values()) {
      renderables.push({ type: 'actor', y: -actor.z * METER, obj: actor });
    }
    renderables.sort((a, b) => a.y - b.y);

    for (const item of renderables) {
      if (item.type === 'player') {
        this.#drawSprite(ctx, this.#player.data, this.#player.x, this.#player.z, this.#player.dir, this.#player.frame, t, this.#player.moving);
      } else {
        const a = item.obj;
        this.#drawSprite(ctx, a.data, a.x, a.z, a.dir, a.frame, t, Boolean(a.target), a.expr);
      }
    }

    // 3. Draw Map Foreground (Dust, Sunbeams, Ambience)
    this.#mapRenderer.drawForeground(ctx, this.#locationId, this.#currentScene, t);

    // 4. Draw Tactical Floating Interaction Prompt in World Space
    if (this.#nearHotspot) {
      this.#drawInteractPrompt(ctx, this.#nearHotspot.x, this.#nearHotspot.z, this.#nearHotspot.prompt, t);
    }

    ctx.restore();
    // Scene grading affects the world only; dialogue and menus stay legible.
    if (this.#currentScene) {
      const time = this.#currentScene.time;
      ctx.fillStyle = time === 'night' ? 'rgba(21,33,72,.35)' : ['evening', 'dusk'].includes(time) ? 'rgba(163,77,53,.13)' :
        this.#locationId === 'room0' ? 'rgba(210,156,73,.045)' : 'rgba(97,149,172,.025)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = this.#vignette;
      ctx.fillRect(0, 0, w, h);
    }
  }

  #drawSprite(ctx, charData, x, z, dir, frame, t, moving, expr) {
    const phase = [...charData.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 17;
    const blink = (t + phase * 0.19) % 4.7 < 0.12;
    const sheet = this.#spriteFactory.getSpriteSheet(charData, { blink, expr });
    const px = Math.round(x * METER);
    const py = Math.round(-z * METER) + (!moving && Math.sin(t * 1.6 + phase) > 0.85 ? -1 : 0);

    const sx = frame * SPRITE_W;
    const sy = dir * SPRITE_H;

    // Feet anchor at (px, py)
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = 'rgba(17,25,38,.22)';
    ctx.beginPath(); ctx.ellipse(px, py - 1, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(
      sheet,
      sx, sy, SPRITE_W, SPRITE_H,
      px - DRAW_W / 2, py - DRAW_H + 2, DRAW_W, DRAW_H
    );
    ctx.restore();
  }

  #drawInteractPrompt(ctx, x, z, prompt, t) {
    const px = Math.round(x * METER);
    const py = Math.round(-z * METER) - 44;
    const bob = Math.sin(t * 6) * 3;

    ctx.save();
    ctx.translate(px, py + bob);

    // Measure text
    ctx.font = 'bold 9px sans-serif';
    const text = prompt.toUpperCase();
    const tw = ctx.measureText(text).width;
    const bw = tw + 28;
    const bh = 18;

    // Slanted blade tag (Persona style)
    ctx.save();
    ctx.transform(1, 0, -0.15, 1, 0, 0); // slant
    ctx.fillStyle = '#10141a';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = '#f3ca65';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();

    // Golden diamond icon & prompt text
    ctx.fillStyle = '#ffcf56';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`✦ [E] ${text}`, 0, 0);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Coordinate Helpers
  // ---------------------------------------------------------------------------
  #getMark(at, id) {
    const loc = this.#currentLocation;
    if (loc.marks?.[at]) return loc.marks[at];
    if (loc.hotspots?.[at]) return loc.hotspots[at];
    if (this.#actors.has(at)) {
      const other = this.#actors.get(at);
      return { x: other.x, z: other.z };
    }
    return { x: 0, z: -11 };
  }

  #yawToDir(yaw) {
    // normalize angle to [-PI, PI]
    const norm = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    if (norm > -Math.PI / 4 && norm <= Math.PI / 4) return 1; // UP (Forward along +Z, towards gate)
    if (norm > Math.PI / 4 && norm <= 3 * Math.PI / 4) return 3; // RIGHT (+X)
    if (norm < -Math.PI / 4 && norm >= -3 * Math.PI / 4) return 2; // LEFT (-X)
    return 0; // DOWN (-Z, backward)
  }

  #dirTowards(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 3 : 2; // right : left
    }
    return dz > 0 ? 1 : 0; // up : down
  }
}
