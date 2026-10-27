const inside=(p,points)=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
/** One scene-owned RGBA beam cache; particles derive entirely from elapsed/seed. */
export class AtmosphereView {
 constructor({definition,width,height,createCanvas}){
  this.definition=definition;this.particles=[];const beam=definition?.beam,dust=definition?.dust;
  if(beam?.points){const canvas=createCanvas();canvas.width=width;canvas.height=height;const c=canvas.getContext('2d'),points=beam.points,gradient=c.createLinearGradient(points[0].x,points[0].y,points.at(-1).x,points.at(-1).y);gradient.addColorStop(0,beam.color);gradient.addColorStop(1,beam.color+'00');c.fillStyle=gradient;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();this.buffer=canvas;}
  let seed=dust?.seed??0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<(dust?.count??0);i++){let p;for(let tries=0;tries<100;tries++){p={x:dust.x+random()*dust.width,y:dust.y+random()*dust.height,phase:random()*Math.PI*2};if(!beam?.points||inside(p,beam.points))break;}this.particles.push(p);}
 }
 draw(context,elapsed,{reducedMotion=false,lease}={}){
  const beam=this.definition?.beam,dust=this.definition?.dust;if(!beam)return;context.save();context.globalCompositeOperation=beam.blend;context.globalAlpha=beam.opacity;context.imageSmoothingEnabled=true;
  if(this.buffer)context.drawImage(this.buffer,0,0);else if(beam.assetId){const image=lease?.get(beam.assetId);if(image)context.drawImage(image,beam.x,beam.y,beam.width,beam.height);}
  if(dust&&!reducedMotion){context.globalAlpha=1;context.fillStyle=dust.color;for(const p of this.particles){const point={x:p.x+Math.sin(elapsed*dust.speed+p.phase)*dust.amplitude,y:p.y+Math.cos(elapsed*dust.speed+p.phase)*dust.amplitude};if(!beam.points||inside(point,beam.points))context.fillRect(point.x,point.y,dust.size,dust.size);}}
  context.restore();
 }
 stats(){return {buffers:this.buffer?1:0,decodedBytes:this.buffer?this.buffer.width*this.buffer.height*4:0,particles:this.particles.length};}
 dispose(){if(this.buffer){this.buffer.width=0;this.buffer.height=0;this.buffer=null;}this.particles=[];}
}
