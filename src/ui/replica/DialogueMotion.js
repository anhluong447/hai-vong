// Concrete dialogue presentation clock. It never issues game actions.
const clamp=value=>Math.min(1,Math.max(0,value));
const ease=value=>1-(1-clamp(value))**3;
const tau=Math.PI*2;

export class DialogueMotion {
  constructor(stage) {
    this.stage=stage;this.config=stage.scene.motion;this.timeMs=0;this.rate=1;
    this.enabled=true;this.paused=false;this.frozen=false;this.sampled=false;
    this.visible=true;this.progress=1;this.transition=null;this.gestures=new Map();
    this.frameCount=0;this.handle=null;this.last=null;this.disposed=false;
    this.media=matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced=this.media.matches;this.hidden=document.hidden;
    this.mediaChange=()=>{this.reduced=this.media.matches;this.sync();};
    this.visibilityChange=()=>this.setHidden(document.hidden);
    this.media.addEventListener('change',this.mediaChange);
    document.addEventListener('visibilitychange',this.visibilityChange);
  }
  get interactive(){return this.visible&&!this.disposed;}
  get useRasterCache(){return this.enabled&&!this.reduced&&(!this.frozen||this.sampled);}
  attach(svg) {
    this.events?.abort();this.events=new AbortController();this.svg=svg;
    const signal=this.events.signal;
    const interaction=(event,type)=>{
      const target=event.target.closest?.('[data-choice-id]');
      if(!target||this.stage.captureLocked||!this.interactive)return;
      if(type==='leave'&&target.contains(event.relatedTarget))return;
      const id=target.dataset.choiceId,state=this.gestures.get(id)??{hover:0,press:0,goal:0};
      if(type==='enter')state.goal=1;
      if(type==='leave') {state.goal=target.matches(':focus')?1:0;state.press=0;}
      if(type==='down')state.press=1;
      if(type==='up')state.press=0;
      this.gestures.set(id,state);this.request();
    };
    for(const [event,type] of [['pointerover','enter'],['pointerout','leave'],['focusin','enter'],['focusout','leave'],['pointerdown','down'],['pointerup','up'],['pointercancel','up']])
      svg.addEventListener(event,e=>interaction(e,type),{signal});
    this.sync();
  }
  running(){return !this.disposed&&!this.frozen&&!this.paused&&!this.hidden&&!this.reduced&&this.enabled&&(this.visible||this.transition)&&this.svg?.isConnected;}
  request() {
    if(this.handle!==null||!this.running())return;
    this.handle=requestAnimationFrame(now=>{
      this.handle=null;
      if(!this.running())return;
      if(this.last===null)this.last=now;
      const elapsed=now-this.last;
      if(elapsed+this.config.clock.frameToleranceMs>=this.config.clock.frameIntervalMs) {
        this.last=now;this.advance(Math.min(elapsed,this.config.clock.maxStepMs)*this.rate);
      }
      this.request();
    });
  }
  stop(){if(this.handle!==null)cancelAnimationFrame(this.handle);this.handle=null;this.last=null;}
  sync() {
    this.stop();
    if(this.reduced||!this.enabled) {this.progress=this.visible?1:0;this.transition=null;this.gestures.clear();}
    this.paint();this.request();
  }
  setHidden(hidden){this.hidden=Boolean(hidden);this.sync();}
  setPaused(paused){this.paused=Boolean(paused);this.sync();}
  setEnabled(enabled){this.enabled=Boolean(enabled);this.frozen=false;this.sampled=false;this.sync();}
  setRate(rate){if(!this.config.clock.rates.includes(rate))throw new RangeError('Unsupported motion rate');this.rate=rate;}
  setVisible(visible,{replay=false}={}) {
    this.visible=Boolean(visible);
    this.transition={from:replay?0:this.progress,to:this.visible?1:0,elapsed:0,
      duration:this.visible?this.config.transition.enterMs:this.config.transition.exitMs};
    if(replay)this.progress=0;
    this.frozen=false;this.sampled=false;this.sync();
  }
  select(id){this.selectedPulse={id,elapsed:0};this.request();}
  freeze(timeMs=null) {
    if(timeMs!==null&&(!Number.isFinite(timeMs)||timeMs<0||timeMs>60000))throw new RangeError('Invalid motion sample');
    this.stop();this.frozen=true;this.sampled=timeMs!==null;this.timeMs=timeMs??0;
    this.visible=true;this.progress=1;this.transition=null;this.gestures.clear();this.selectedPulse=null;this.paint();
  }
  advance(ms) {
    if(this.disposed||this.hidden||this.reduced||!this.enabled||this.frozen)return;
    if(!Number.isFinite(ms)||ms<0)throw new RangeError('Invalid presentation delta');
    this.timeMs=(this.timeMs+ms)%this.config.clock.loopMs;
    if(this.transition) {
      const t=this.transition;t.elapsed+=ms;
      this.progress=t.from+(t.to-t.from)*ease(t.elapsed/t.duration);
      if(t.elapsed>=t.duration) {this.progress=t.to;this.transition=null;}
    }
    for(const state of this.gestures.values())state.hover+=(state.goal-state.hover)*Math.min(1,ms/this.config.choice.responseMs);
    if(this.selectedPulse) {this.selectedPulse.elapsed+=ms;if(this.selectedPulse.elapsed>=this.config.choice.selectMs)this.selectedPulse=null;}
    this.frameCount++;this.paint();
  }
  paint() {
    if(!this.svg||this.disposed)return;
    const c=this.config,active=this.enabled&&!this.reduced&&(!this.frozen||this.sampled);
    for(const image of this.svg.querySelectorAll('image[data-asset-id]')) {
      const asset=this.stage.assets.get(image.dataset.assetId);
      if(!asset?.presentationURL)continue;
      const url=this.useRasterCache?asset.presentationURL:asset.url;
      if(image.href.baseVal!==url)image.setAttribute('href',url);
    }
    const time=(this.timeMs%c.clock.loopMs),p=this.progress;
    const oscillation=(period,phase=0)=>{
      const value=active?Math.sin(time/period*tau+phase):0;
      return Math.abs(value)<1e-12?0:value;
    };
    const write=(node,transform,opacity)=>{
      if(!node)return;
      if(node.getAttribute('transform')!==transform)node.setAttribute('transform',transform);
      if(opacity!==undefined&&node.style.opacity!==String(opacity))node.style.opacity=String(opacity);
    };
    const paperLift=(1-p)*c.paper.enterLift;
    for(const node of this.svg.querySelectorAll('[data-motion-paper]'))write(node,
      `translate(0 ${paperLift}) ${node.dataset.motionRestTransform??''}`.trim(),p*Number(node.getAttribute('opacity')??1));
    const wave=this.svg.querySelector('[data-motion-wave]');
    write(wave,`translate(${oscillation(c.wave.periodMs)*c.wave.translate[0]} ${oscillation(c.wave.periodMs)*c.wave.translate[1]+paperLift})`,p);
    const flow=this.svg.querySelector('[data-motion-flow]');
    if(flow) {
      const path=c.wave.commands.map(segment=>segment.command+segment.points.map(([x,y])=>{
        const shift=active?c.wave.edgeAmplitude*(Math.sin(time/c.wave.periodMs*tau-x/1672*tau*c.wave.spatialTurns)-Math.sin(-x/1672*tau*c.wave.spatialTurns)):0;
        return `${x.toFixed(3)} ${(y+shift).toFixed(3)}`;
      }).join(' ')).join(' ');
      flow.setAttribute('d',path);flow.style.opacity=String(active?c.wave.opacity*p:0);
    }
    for(const [name,selector] of [['flowers','[data-region="foreground-left"]'],['notebook','[data-motion-notebook]']]) {
      const profile=c[name],s=oscillation(profile.periodMs,profile.phaseRadians??0),[x,y]=profile.pivot;
      write(this.svg.querySelector(selector),`translate(0 ${-s*profile.lift}) rotate(${s*profile.degrees+(1-p)*profile.enterDegrees} ${x} ${y})`,p);
    }
    const copyOpacity=clamp((p-c.transition.copyDelay)/(1-c.transition.copyDelay));
    for(const node of this.svg.querySelectorAll('[data-motion-copy]'))node.style.opacity=String(copyOpacity);
    this.stage.scene.choices.forEach((choice,index)=>{
      const art=this.svg.querySelector(`[data-choice-id="${choice.id}"] [data-choice-art]`);
      const state=this.gestures.get(choice.id);
      const stagger=index*c.transition.choiceStaggerMs/c.transition.enterMs;
      const reveal=clamp((p-stagger)/(1-stagger));
      const pulse=this.selectedPulse?.id===choice.id?Math.sin(this.selectedPulse.elapsed/c.choice.selectMs*Math.PI):0;
      const lift=active?-(state?.hover??0)*c.choice.hoverLift+(state?.press??0)*c.choice.pressLift-pulse:0;
      write(art,`translate(0 ${lift+(1-reveal)*c.transition.choiceEnterLift})`,reveal);
      const light=art?.querySelector('[data-choice-light]');
      if(light)light.style.opacity=String(active?Math.max(state?.hover??0,pulse)*c.choice.focusOpacity:0);
      const text=this.svg.querySelector(`[data-choice-copy="${choice.id}"]`);if(text)text.style.opacity=String(reveal);
    });
    const sheen=this.svg.querySelector('[data-motion-sheen]');
    if(sheen) {
      const phase=(time%c.sheen.periodMs)/c.sheen.activeMs;
      write(sheen,`translate(${c.sheen.startX+c.sheen.travelX*clamp(phase)} 0)`,
        active&&this.stage.lightingEnabled&&phase<1?Math.sin(phase*Math.PI)**2*c.sheen.opacity*p:0);
    }
    const disabled=!this.interactive||this.stage.captureLocked;
    this.svg.dataset.motion=this.reduced?'reduced':!this.enabled?'off':this.frozen?(this.sampled?'sampled':'settled'):this.paused?'paused':'full';
    this.svg.dataset.transition=this.transition?(this.visible?'entering':'exiting'):(this.visible?'settled':'hidden');
    for(const target of this.svg.querySelectorAll('[data-choice-id],.continue')) {
      target.setAttribute('aria-disabled',String(disabled));target.setAttribute('tabindex',disabled?'-1':'0');
      target.setAttribute('aria-hidden',String(!this.visible));
    }
    if(!this.visible&&this.svg.contains(document.activeElement))document.activeElement.blur();
  }
  snapshot(){return {timeMs:this.timeMs,rate:this.rate,paused:this.paused,hidden:this.hidden,reduced:this.reduced,
    frozen:this.frozen,enabled:this.enabled,progress:this.progress,visible:this.visible,frameCount:this.frameCount,pendingFrame:this.handle!==null};}
  dispose() {
    if(this.disposed)return;this.stop();this.disposed=true;this.events?.abort();
    this.media.removeEventListener('change',this.mediaChange);document.removeEventListener('visibilitychange',this.visibilityChange);
    this.svg=null;this.gestures.clear();
  }
}
