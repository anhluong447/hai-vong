import {test,assert} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {ActorView} from '/src/presentation/world/ActorView.js';
import {resourceService} from '/tests/fixtures/resources.js';
test('authored plant compensation locks support anchor across poses without changing motion state',async()=>{
 const {resolveFootPlant}=await import('/src/presentation/world/FootPlant.js'),clip={frames:Array.from({length:6},()=>({duration:1})),locomotion:{cycleDistance:96,contacts:[{phase:0,foot:'left'},{phase:.5,foot:'right'}],plant:{kneeY:144,anchors:[118,118,96,123,120,101].map(x=>({x,y:199}))}}},scale=152/192;
 for(const start of [0,48]){let anchor;for(let d=start;d<start+48;d+=.5){const p=resolveFootPlant(clip,d,scale),world=d+(p.anchor.x+p.shift)*scale;if(anchor===undefined)anchor=world;assert(Math.abs(world-anchor)<.001);}}
});
test('actual six-frame pixel sprite has at most two logical units of sole drift during each plant',async()=>{
 const checked=validateProject(await loadProject('/docs/art-direction/review-b-r1/c2/project.json'));assert(checked.ok);const bundle=checked.value,definition=bundle.catalog.get('actors','actor.first3.khue').value,clip=bundle.catalog.get('animations',definition.walkClipId).value;assert(clip.locomotion.plant,'no authored support-foot data');
 const assets=resourceService(bundle),loaded=await assets.acquire([...new Set(clip.frames.map(f=>f.assetId))],{revision:bundle.revision});assert(loaded.ok);const actor=new ActorView(definition,bundle.catalog),canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const c=canvas.getContext('2d');let worst=0;
 try{for(const facing of [1,-1])for(const start of [0,48]){let initial;
  for(let d=start;d<start+48;d+=.5){c.clearRect(0,0,960,540);actor.draw(c,loaded.value,{x:450+facing*d,y:420,facing,moving:true,travelled:d},0);const pixels=c.getImageData(0,419,960,1).data,positions=[];for(let x=0;x<960;x++)if(pixels[x*4+3]>128)positions.push(x);assert(positions.length,'support sole disappeared');const edge=facing===1?Math.max(...positions):Math.min(...positions);initial??=edge;worst=Math.max(worst,Math.abs(edge-initial));assert(Math.abs(edge-initial)<=2,'sole drift '+Math.abs(edge-initial)+' at '+d);}
 }}finally{actor.dispose();loaded.value.release();assets.dispose();}return {worstDrift:worst,samplesPerPlant:96,art:'actual atlas pixels',directions:2};
});
