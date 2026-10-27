import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
const clamp=(v,max)=>Math.max(0,Math.min(Math.max(0,max),v));
export class Camera2D {
 constructor(width,height=0){Object.assign(this,{width,height,x:0,y:0,zoom:1,initialized:false});}
 follow(position,sceneWidth){this.x=clamp(position-this.width/2,sceneWidth-this.width);this.y=0;this.zoom=1;this.initialized=true;return this.x;}
 update(target,delta,{sceneWidth,sceneHeight,profile,snap=false}){
  const immediate=snap||!profile||!this.initialized,blend=response=>immediate?1:1-Math.pow(1-response,Math.max(0,delta)*60);
  const zoomAlpha=blend(target.zoomResponse60??profile?.zoomResponse60??1);this.zoom+=(target.zoom-this.zoom)*zoomAlpha;
  const x=clamp(target.focusX-this.width/this.zoom/2,sceneWidth-this.width/this.zoom),y=clamp(target.focusY-this.height/this.zoom/2,sceneHeight-this.height/this.zoom),alpha=blend(profile?.followResponse60??1);
  this.x=clamp(this.x+(x-this.x)*alpha,sceneWidth-this.width/this.zoom);this.y=clamp(this.y+(y-this.y)*alpha,sceneHeight-this.height/this.zoom);this.initialized=true;return this.snapshot();
 }
 snapshot(){return {x:this.x,y:this.y,zoom:this.zoom};}
 restore(state,{sceneWidth,sceneHeight}){
  if(!state||Object.keys(state).some(k=>!['x','y','zoom'].includes(k))||![state.x,state.y,state.zoom].every(Number.isFinite)||state.zoom<1||state.zoom>1.1||state.x<0||state.y<0||state.x>Math.max(0,sceneWidth-this.width/state.zoom)||state.y>Math.max(0,sceneHeight-this.height/state.zoom))return failure(diagnostic('camera.state.invalid','camera','/'));
  Object.assign(this,state,{initialized:true});return success(this.snapshot());
 }
 fromWorld({x,y}){return {x:(x-this.x)*this.zoom,y:(y-this.y)*this.zoom};}
 toWorld({x,y}){return {x:x/this.zoom+this.x,y:y/this.zoom+this.y};}
}
