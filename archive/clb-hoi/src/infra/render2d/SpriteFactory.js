/** Smooth anime artwork, normalized to a common feet anchor and animation grid. */
export const SPRITE_W = 96;
export const SPRITE_H = 144;
export const WALK_FRAMES = 8;
export const DRAW_W = 48;
export const DRAW_H = 72;
const ART_IDS = ['khue', 'long', 'van', 'nhi'];
const MALE = new Set(['khue', 'long', 'an', 'dang', 'huy', 'thay_van', 'bac_tu']);

export class SpriteFactory {
  #cache = new Map();
  #illustrations = new Map();
  #loading = null;

  preload(characters) {
    if (this.#loading) return this.#loading;
    this.#loading = Promise.all(characters.filter(c => ART_IDS.includes(c.id)).map(async character => {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Không tải được sprite anime: ${character.id}`));
        image.src = new URL(`../../../content/sprites/anime/${character.id}.png`, import.meta.url).href;
      });
      this.#illustrations.set(character.id, this.#normalize(image));
    }));
    return this.#loading;
  }

  getSpriteSheet(data, { blink = false } = {}) {
    if (this.#illustrations.has(data.id)) return this.#illustrations.get(data.id);
    const key = `${data.id}:${blink}`;
    if (this.#cache.has(key)) return this.#cache.get(key);
    const sheet = document.createElement('canvas');
    sheet.width = SPRITE_W * WALK_FRAMES; sheet.height = SPRITE_H * 4;
    const ctx = sheet.getContext('2d');
    for (let dir = 0; dir < 4; dir++) for (let f = 0; f < WALK_FRAMES; f++) {
      ctx.save(); ctx.translate(f * SPRITE_W, dir * SPRITE_H);
      if (data.role === 'cat') drawCat(ctx, dir, f);
      else drawAnime(ctx, data, dir, f, blink);
      ctx.restore();
    }
    this.#cache.set(key, sheet);
    return sheet;
  }

  #normalize(image) {
    const output = document.createElement('canvas');
    output.width = SPRITE_W * WALK_FRAMES; output.height = SPRITE_H * 4;
    const ctx = output.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    const cellW = image.width / 4, cellH = image.height / 2;
    const poses = [];
    for (let row = 0; row < 2; row++) for (let dir = 0; dir < 4; dir++) {
      const cell = document.createElement('canvas'); cell.width = cellW; cell.height = cellH;
      const cc = cell.getContext('2d');
      cc.drawImage(image, dir * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
      const pixels = cc.getImageData(0, 0, cell.width, cell.height);
      let minX = cell.width, minY = cell.height, maxX = -1, maxY = -1;
      for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) {
        const alpha = pixels.data[(y * cell.width + x) * 4 + 3];
        if (alpha > 32) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      }
      if (maxX < minX) throw new Error('Sprite atlas has an empty pose.');
      poses.push({ cell, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
    // Same scale in every pose; varying hair and stride never alter character height.
    const ratio = Math.min(136 / Math.max(...poses.map(p => p.h)), 86 / Math.max(...poses.map(p => p.w)));
    for (let dir = 0; dir < 4; dir++) for (let frame = 0; frame < WALK_FRAMES; frame++) {
      const pose = poses[(frame % 4 >= 2 ? 4 : 0) + dir];
      const w = pose.w * ratio, h = pose.h * ratio;
      ctx.drawImage(pose.cell, pose.x, pose.y, pose.w, pose.h,
        frame * SPRITE_W + (SPRITE_W - w) / 2, dir * SPRITE_H + SPRITE_H - 4 - h, w, h);
    }
    return output;
  }
}

// Secondary cast uses the same organic anime proportions until painted atlases exist.
// Curves and tapered limbs deliberately replace the former rectangular pixel figures.
function drawAnime(ctx, data, dir, frame, blink) {
  const male = MALE.has(data.id), adult = data.role === 'adult' || data.id === 'me';
  const hair = data.hair ?? '#292735', accent = data.accent ?? '#6c7f94';
  const outfit = adult ? data.color : '#f5f0e4';
  const skin = '#f4cdb2', ink = '#34313f', step = Math.sin(frame / 8 * Math.PI * 2);
  const child = data.id === 'mai';
  ctx.translate(48, 140);
  ctx.scale(child ? .78 : .92, child ? .78 : .92);
  const side = dir >= 2;
  if (dir === 3) ctx.scale(-1, 1);
  ctx.lineWidth = 1.15; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const shape = (color, draw) => { ctx.beginPath(); draw(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = ink; ctx.stroke(); };
  const limb = (x, y, endX, endY, color, width) => {
    ctx.strokeStyle = ink; ctx.lineWidth = width + 1.8; ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.stroke();
    ctx.strokeStyle = color;ctx.lineWidth=width;ctx.stroke();ctx.lineWidth=1.15;
  };
  // Long hair sits behind the head and shoulders, with gentle separated locks.
  if (!male) shape(hair, () => {ctx.moveTo(-15,-126);ctx.bezierCurveTo(-30,-105,-24,-67,-14,-56);ctx.quadraticCurveTo(0,-64,17,-58);ctx.bezierCurveTo(27,-86,28,-110,12,-128);ctx.closePath();});
  for (const [x, sign] of [[-7, 1], [7, -1]]) {
    const offset = step * sign * (side ? 8 : 3);
    limb(x,-48,x+offset,-6,male?'#35435e':skin,male?9:6);
    if (!male) limb(x+offset,-20,x+offset,-6,'#f0eee5',6);
    shape('#222739', () => ctx.ellipse(x+offset-1,-3,side?7:6,3.5,0,0,Math.PI*2));
  }
  if (!male) {
    shape('#34415b', () => {ctx.moveTo(-12,-65);ctx.quadraticCurveTo(-15,-47,-19,-37);ctx.quadraticCurveTo(0,-30,19,-37);ctx.lineTo(12,-65);ctx.closePath();});
    ctx.strokeStyle='#68768b';for(let x=-12;x<=12;x+=6){ctx.beginPath();ctx.moveTo(x,-60);ctx.lineTo(x*1.3,-38);ctx.stroke();}
  }
  shape(outfit, () => {ctx.moveTo(-7,-95);ctx.quadraticCurveTo(-18,-93,-18,-83);ctx.lineTo(-12,-58);ctx.quadraticCurveTo(0,-54,12,-58);ctx.lineTo(18,-83);ctx.quadraticCurveTo(16,-93,7,-95);ctx.closePath();});
  const shade = ctx.createLinearGradient(-18,0,18,0);shade.addColorStop(0,'rgba(109,128,148,.25)');shade.addColorStop(.55,'rgba(255,255,255,.05)');shade.addColorStop(1,'rgba(69,89,116,.28)');
  ctx.fillStyle=shade;ctx.fill();
  for(const sign of [-1,1]) {
    limb(sign*15,-85,sign*(18+step*2),-67,outfit,7);
    limb(sign*(18+step*2),-67,sign*(16+step*3),-54,skin,5);
  }
  shape(skin, () => ctx.ellipse(0,-95,4,6,0,0,Math.PI*2));
  if (dir !== 1) {
    shape('#fff8ed',()=>{ctx.moveTo(-8,-94);ctx.lineTo(-1,-88);ctx.lineTo(-5,-84);ctx.closePath();});
    shape('#fff8ed',()=>{ctx.moveTo(8,-94);ctx.lineTo(1,-88);ctx.lineTo(5,-84);ctx.closePath();});
    shape(accent,()=>{ctx.moveTo(-3,-87);ctx.lineTo(3,-87);ctx.lineTo(4,-71);ctx.lineTo(0,-68);ctx.lineTo(-4,-71);ctx.closePath();});
    ctx.strokeStyle='#c5c5c1';ctx.beginPath();ctx.moveTo(0,-70);ctx.lineTo(0,-58);ctx.stroke();
  }
  shape(skin,()=>{ctx.moveTo(-15,-122);ctx.bezierCurveTo(-15,-140,16,-140,16,-122);ctx.quadraticCurveTo(15,-104,0,-100);ctx.quadraticCurveTo(-15,-106,-15,-122);});
  if (dir !== 1) {
    const eyes = side ? [-8] : [-7,7];
    for(const x of eyes) {
      ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-3,-118);ctx.quadraticCurveTo(x,-121,x+3,-118);ctx.stroke();
      if (!blink) {ctx.fillStyle='#fdf7ef';ctx.beginPath();ctx.ellipse(x,-116.5,3,2.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#806456';ctx.beginPath();ctx.ellipse(x,-116,1.8,2.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-.7,-117.2,.7,0,Math.PI*2);ctx.fill();}
    }
    ctx.lineWidth=.8;ctx.strokeStyle='#a7726d';ctx.beginPath();ctx.moveTo(-2,-106);ctx.quadraticCurveTo(0,-105,2,-106);ctx.stroke();
    if (['an','huy','thay_van'].includes(data.id)) {ctx.strokeStyle='#6f8591';for(const x of eyes)ctx.strokeRect(x-4,-120,8,7);}
  }
  shape(hair,()=>{ctx.moveTo(-17,-118);ctx.bezierCurveTo(-25,-140,-8,-145,3,-141);ctx.bezierCurveTo(19,-144,22,-128,17,-114);ctx.lineTo(11,-127);ctx.lineTo(7,-118);ctx.lineTo(2,-129);ctx.lineTo(-5,-119);ctx.lineTo(-8,-129);ctx.lineTo(-15,-113);ctx.closePath();});
  if (dir === 1) shape(hair,()=>{ctx.moveTo(-17,-127);ctx.lineTo(17,-127);ctx.quadraticCurveTo(19,-108,0,-101);ctx.quadraticCurveTo(-20,-108,-17,-127);});
  ctx.strokeStyle='rgba(173,151,129,.4)';ctx.lineWidth=.8;
  for(let x=-12;x<14;x+=5){ctx.beginPath();ctx.moveTo(x,-137);ctx.quadraticCurveTo(x+5,-132,x+2,-123);ctx.stroke();}
}

function drawCat(ctx, dir, frame) {
  ctx.translate(48,132);ctx.lineWidth=1.2;ctx.strokeStyle='#252c3b';ctx.fillStyle='#32384a';
  ctx.beginPath();ctx.ellipse(0,-12,18,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-13,-17);ctx.lineTo(-13,-39);ctx.lineTo(-5,-32);ctx.quadraticCurveTo(0,-36,6,-32);ctx.lineTo(13,-39);ctx.lineTo(14,-17);ctx.quadraticCurveTo(0,-7,-13,-17);ctx.fill();ctx.stroke();
  for(const x of [-7,7]){ctx.fillStyle='#9fcab5';ctx.beginPath();ctx.ellipse(x,-25,3,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172337';ctx.fillRect(x,-28,1,6);}
  ctx.strokeStyle='#8a919c';ctx.beginPath();ctx.moveTo(-19,-20);ctx.lineTo(-7,-18);ctx.moveTo(8,-18);ctx.lineTo(20,-20);ctx.stroke();
  ctx.strokeStyle='#343b4c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(16,-10);ctx.quadraticCurveTo(28,-19,24,-28+Math.sin(frame)*2);ctx.stroke();
}
