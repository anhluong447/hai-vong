import {test,assert,equal} from '/tests/harness.js';
test('cached authored beam and seeded dust restore deterministically and respect reduced motion',async()=>{
 const {AtmosphereView}=await import('/src/presentation/world/AtmosphereView.js');
 const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;const c=canvas.getContext('2d'),definition={beam:{points:[{x:10,y:10},{x:80,y:10},{x:80,y:90},{x:10,y:90}],color:'#ffab55',opacity:.2,blend:'screen'},dust:{count:18,seed:9,x:12,y:12,width:65,height:75,color:'#ffe1a6',size:1,speed:.2,amplitude:2}};
 const a=new AtmosphereView({definition,width:100,height:100,createCanvas:()=>document.createElement('canvas')});
 const draw=(time,reducedMotion)=>{c.clearRect(0,0,100,100);a.draw(c,time,{reducedMotion});return [...c.getImageData(0,0,100,100).data];};
 const before={alpha:c.globalAlpha,blend:c.globalCompositeOperation,smoothing:c.imageSmoothingEnabled};const first=draw(5,false);equal(draw(5,false),first);assert(JSON.stringify(draw(7,false))!==JSON.stringify(first));equal(draw(5,true),draw(7,true));equal({alpha:c.globalAlpha,blend:c.globalCompositeOperation,smoothing:c.imageSmoothingEnabled},before);
 equal(a.stats().particles,18);equal(a.stats().buffers,1);a.dispose();equal(a.stats().buffers,0);
});
