import {t} from '../shared/text.js';
export const STATIONS = [
  { id: 'subjects', label: t("src.infra.DebugMap.bang_de_tai"), sub: t("src.infra.DebugMap.01_tim_tin"), x: 0.23, y: 0.24, color: '#e7b34e' },
  { id: 'team', label: t("src.infra.DebugMap.ban_phan_cong"), sub: t("src.infra.DebugMap.02_nhan_su"), x: 0.76, y: 0.24, color: '#8ca69d' },
  { id: 'editor', label: t("content.maps.definitions.ban_bien_tap"), sub: t("src.infra.DebugMap.03_dan_trang"), x: 0.23, y: 0.68, color: '#cd886e' },
  { id: 'reports', label: t("content.maps.definitions.may_in"), sub: t("src.infra.DebugMap.04_phat_hanh"), x: 0.76, y: 0.68, color: '#99a8ba' },
];
export class DebugMap {
  constructor(canvas,onStation) {
    this.canvas = canvas; this.onStation = onStation; this.player = { x: 0.5, y: 0.5 };
    this.keys = new Set(); this.active = 'subjects'; this.enabled = true; this.lastTime = 0;
    canvas.addEventListener('pointerdown',event => {
      const box = canvas.getBoundingClientRect(); const x = (event.clientX - box.left) / box.width; const y = (event.clientY - box.top) / box.height;
      const station = STATIONS.find(s => Math.abs(x - s.x) < 0.15 && Math.abs(y - s.y) < 0.15);
      if (station) { this.player = { x: station.x, y: station.y + 0.15 }; this.onStation(station.id); canvas.focus(); }
    });
    window.addEventListener('keydown',event => {
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || !this.enabled) return;
      if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','e','E'].includes(event.key)) {
        event.preventDefault(); this.keys.add(event.key);
        if (event.key.toLowerCase() === 'e') { const nearest = STATIONS.find(s => Math.hypot(this.player.x - s.x,this.player.y - s.y) < 0.22); if (nearest) this.onStation(nearest.id); }
      }
    });
    window.addEventListener('keyup',event => this.keys.delete(event.key));
    window.addEventListener('blur',() => this.keys.clear());
    document.addEventListener('visibilitychange',() => this.keys.clear());
    this.resizeObserver = new ResizeObserver(() => this.draw()); this.resizeObserver.observe(canvas);
    const frame = time => { const dt = Math.min(0.04,(time - this.lastTime) / 1000); this.lastTime = time; if (this.enabled) this.update(dt); this.draw(); this.frame = requestAnimationFrame(frame); };
    this.frame = requestAnimationFrame(frame);
  }
  update(dt) {
    const speed = dt * 0.32;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) this.player.y -= speed;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) this.player.y += speed;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) this.player.x -= speed;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) this.player.x += speed;
    this.player.x = Math.max(0.08,Math.min(0.92,this.player.x)); this.player.y = Math.max(0.10,Math.min(0.92,this.player.y));
    for (const station of STATIONS) if (Math.abs(this.player.x - station.x) < 0.12 && Math.abs(this.player.y - station.y) < 0.065) this.player.y = station.y + 0.07;
  }
  draw() {
    const rect = this.canvas.getBoundingClientRect(); if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1; const width = rect.width; const height = rect.height;
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) { this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr); }
    const ctx = this.canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = '#e8e1d1'; ctx.fillRect(0,0,width,height);
    ctx.strokeStyle = '#d4ccbb'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 38) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
    for (let y = 0; y < height; y += 38) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
    ctx.fillStyle = '#526c5f'; ctx.fillRect(0,0,width,12); ctx.fillRect(0,0,12,height); ctx.fillRect(width - 12,0,12,height);
    ctx.fillStyle = '#fbf8ef'; ctx.fillRect(width * 0.39,0,width * 0.22,12);
    ctx.fillStyle = '#637369'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t("src.infra.DebugMap.toa_soan_phong_thu_nghiem"),width / 2,40);
    for (const s of STATIONS) {
      const x = s.x * width; const y = s.y * height; const w = Math.min(170,width * 0.31);
      ctx.fillStyle = '#00000012'; ctx.fillRect(x - w/2 + 5,y - 26 + 7,w,60);
      ctx.fillStyle = s.color; ctx.fillRect(x - w/2,y - 26,w,56);
      ctx.strokeStyle = this.active === s.id ? '#254939' : '#ffffff66'; ctx.lineWidth = this.active === s.id ? 3 : 1; ctx.strokeRect(x - w/2,y - 26,w,56);
      ctx.fillStyle = '#243c30'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(s.label,x,y);
      ctx.font = '9px sans-serif'; ctx.fillText(s.sub,x,y + 17);
      if (s.id === 'editor' && this.vanTasks) { ctx.fillStyle = '#a23b29'; ctx.beginPath(); ctx.arc(x + w/2 - 8,y - 20,11,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('!',x + w/2 - 8,y - 15); }
    }
    const x = this.player.x * width; const y = this.player.y * height;
    ctx.fillStyle = '#00000024'; ctx.beginPath(); ctx.ellipse(x,y + 13,12,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#294e3b'; ctx.fillRect(x - 8,y - 3,16,17);
    ctx.fillStyle = '#e4ba86'; ctx.beginPath(); ctx.arc(x,y - 8,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#282e2a'; ctx.fillRect(x - 8,y - 16,16,6);
    ctx.fillStyle = '#f8f5ea'; ctx.fillRect(x + 7,y + 1,6,8);
    ctx.fillStyle = '#314b3e'; ctx.font = '10px sans-serif'; ctx.fillText(t("src.infra.DebugMap.khue"),x,y + 30);
    const near = STATIONS.find(s => Math.hypot(this.player.x - s.x,this.player.y - s.y) < 0.22);
    if (near) { ctx.fillStyle = '#244b3be8'; ctx.fillRect(width/2 - 105,height - 40,210,26); ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(t("src.infra.DebugMap.e_value0", {value0: (near.label)}),width/2,height - 23); }
  }
  snapshot() { return { ...this.player }; }
  restore(snapshot) { if (snapshot && Number.isFinite(snapshot.x) && Number.isFinite(snapshot.y)) this.player = { x: Math.max(0.08,Math.min(0.92,snapshot.x)), y: Math.max(0.10,Math.min(0.92,snapshot.y)) }; }
}
