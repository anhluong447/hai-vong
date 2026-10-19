import {motion} from '../../../content/ui/menu-v2.js';
import {element as el} from '../dom.js';

export class MenuV2Effects{
  constructor(root){
    this.root=root;this.time=0;this.handle=null;this.visible=false;this.manualReduced=false;this.frozen=false;this.frameTimes=[];this.paintTimes=[];
    this.media=matchMedia('(prefers-reduced-motion: reduce)');
    this.paths=[...root.querySelectorAll('[data-wave]')];this.foliage=[...root.querySelectorAll('.mv-foliage')];
    this.sprites=Array.from({length:motion.particleCount},(_,i)=>{
      const top=i%2===0,node=el('i',{class:top?'mv-particle':'mv-particle mv-water-glint'});
      node.style.left=`${top?54+(i*17)%40:31+(i*13)%39}%`;node.style.top=`${top?2+(i*7)%10:87+(i%3)}%`;
      root.querySelector('.mv-particles').append(node);return node;
    });
    this.sync=()=>{root.dataset.reduced=String(this.reduced);if(this.reduced||this.hostVisible===false||!this.visible||document.hidden||this.frozen)this.stop();else this.start();if(this.reduced)this.paint(0);};
    this.visibility=event=>{this.hostVisible=event.detail.visible;this.visible=event.detail.visible;this.sync();};
    root.addEventListener('coastal-visibility',this.visibility);
    this.media.addEventListener('change',this.sync);document.addEventListener('visibilitychange',this.sync);
    this.observer=new IntersectionObserver(entries=>{this.visible=entries.at(-1).isIntersecting;this.sync();});this.observer.observe(root);
    this.ready=Promise.resolve();this.paint(0);this.sync();
  }
  get reduced(){return this.manualReduced||this.media.matches;}
  setReduced(value){this.manualReduced=value;this.sync();}
  start(){if(this.handle!==null||this.disposed)return;this.last=null;const tick=now=>{
    if(!this.root.isConnected||this.hostVisible===false||this.disposed){this.stop();return;}
    if(this.last!==null){this.frameTimes.push(now-this.last);if(this.frameTimes.length>360)this.frameTimes.shift();this.time+=Math.min(64,now-this.last);}
    this.last=now;const started=performance.now();this.paint(this.time);this.paintTimes.push(performance.now()-started);if(this.paintTimes.length>360)this.paintTimes.shift();this.handle=requestAnimationFrame(tick);
  };this.handle=requestAnimationFrame(tick);}
  stop(){if(this.handle!==null)cancelAnimationFrame(this.handle);this.handle=null;}
  paint(time){
    const phase=this.reduced?0:time/motion.wavePeriod*Math.PI*2;
    this.root.style.setProperty('--ds-wave-phase',String(this.reduced?0:Math.sin(phase)));
    this.paths.forEach((path,i)=>{
      const sway=this.reduced?0:Math.sin(phase+i)*motion.waveAmplitude;
      const other=this.reduced?0:Math.cos(phase*.8+i)*motion.waveAmplitude;
      if(path.dataset.wave==='side'){
        const x=370-i*18;path.setAttribute('d',`M0 0 H${x+65} C${x-95+sway} 210 ${x+60+other} 275 ${x-10} 420 S${x-55+sway} 570 ${x+15} 680 S${x-10+other} 850 ${x-25} 941 H0Z`);
      }else{const y=870+(i-3)*22;path.setAttribute('d',`M0 ${y} C250 ${y-60+sway} 300 ${y+35} 570 ${y+other} S930 ${y-35+sway} 1140 ${y-22} S1480 ${y-30+other} 1672 ${y-85} V941 H0Z`);}
    });
    this.foliage.forEach((node,i)=>{node.style.transform=`rotate(${this.reduced?0:Math.sin(time/motion.foliagePeriod*Math.PI*2+i*2)*motion.foliageDegrees}deg)`;});
    this.sprites.forEach((node,i)=>{
      const p=time/(6000+i*233)*Math.PI*2+i;node.style.opacity=this.reduced?'0':String(Math.max(0,Math.sin(p))*.5);
      node.style.transform=`translate(${Math.sin(p)*8}px,${Math.cos(p)*15}px)`;
    });
    this.root.style.setProperty('--mv-light',String(this.reduced?.12:.12+Math.sin(phase*.6)*.025));
  }
  freeze(time=0){this.frozen=true;this.stop();this.time=time;this.paint(time);return this.snapshot();}
  resume(){this.frozen=false;this.sync();}
  snapshot(){return {timeMs:this.time,running:this.handle!==null,reduced:this.reduced,spriteCount:this.sprites.length,visible:this.visible};}
  performanceSummary(){const stats=list=>{const ordered=[...list].sort((a,b)=>a-b);return {samples:list.length,meanMs:list.reduce((a,b)=>a+b,0)/Math.max(1,list.length),p95Ms:ordered[Math.floor(ordered.length*.95)]||0};};return {frames:stats(this.frameTimes),paint:stats(this.paintTimes)};}
  dispose(){this.disposed=true;this.stop();this.observer.disconnect();this.root.removeEventListener('coastal-visibility',this.visibility);this.media.removeEventListener('change',this.sync);document.removeEventListener('visibilitychange',this.sync);}
}
