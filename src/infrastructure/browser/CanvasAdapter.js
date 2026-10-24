/** Logical scene units -> CSS letterbox -> device pixels. DPR never changes gameplay. */
export class CanvasAdapter {
 constructor(canvas,viewport){this.canvas=canvas;this.viewport=viewport;this.context=canvas.getContext('2d');}
 resize(width,height,dpr){
  if(![width,height,dpr].every(n=>Number.isFinite(n)&&n>0))return;
  this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.canvas.style.width=width+'px';this.canvas.style.height=height+'px';
  this.scale=Math.min(width/this.viewport.width,height/this.viewport.height);this.offsetX=(width-this.viewport.width*this.scale)/2;this.offsetY=(height-this.viewport.height*this.scale)/2;this.dpr=dpr;
 }
 toCSS({x,y}){return {x:this.offsetX+x*this.scale,y:this.offsetY+y*this.scale};}
 fromCSS({x,y}){return {x:(x-this.offsetX)/this.scale,y:(y-this.offsetY)/this.scale};}
 begin(){const c=this.context;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);c.setTransform(this.scale*this.dpr,0,0,this.scale*this.dpr,this.offsetX*this.dpr,this.offsetY*this.dpr);return c;}
 async fullscreen(){try{await this.canvas.parentElement.requestFullscreen();return {ok:true};}catch{return {ok:false};}}
 dispose(){this.canvas.width=0;this.canvas.height=0;}
}
