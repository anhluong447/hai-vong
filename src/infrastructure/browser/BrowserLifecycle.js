/** Movement/presentation seconds only. No calendar or gameplay rules live here. */
export class BrowserLifecycle {
 constructor({window:win,document:doc,maxDelta}){
  this.window=win;this.document=doc;this.maxDelta=maxDelta;this.focused=true;this.previous=null;this.subscribers=new Set();this.controller=new AbortController();
  const options={signal:this.controller.signal};
  doc.addEventListener('visibilitychange',()=>this.changed(),options);
  win.addEventListener('blur',()=>{this.focused=false;this.changed();},options);
  win.addEventListener('focus',()=>{this.focused=true;this.changed();},options);
 }
 get active(){return !this.document.hidden&&this.focused;}
 changed(){this.previous=null;for(const callback of this.subscribers)callback(this.active);}
 subscribe(callback){this.subscribers.add(callback);return ()=>this.subscribers.delete(callback);}
 delta(now){if(!this.active){this.previous=null;return 0;}const before=this.previous;this.previous=now;return before===null?0:Math.max(0,Math.min(this.maxDelta,(now-before)/1000));}
 start(update){this.stop();const frame=now=>{update(this.delta(now));this.frame=this.window.requestAnimationFrame(frame);};this.frame=this.window.requestAnimationFrame(frame);}
 stop(){if(this.frame!==undefined)this.window.cancelAnimationFrame(this.frame);this.frame=undefined;this.previous=null;}
 dispose(){this.stop();this.controller.abort();this.subscribers.clear();}
}
