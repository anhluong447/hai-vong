import {test,assert as a} from './harness.js';
import {MAPS,walkable,findPath,pathToObject,safePosition,visibleNPCs} from '../src/pixel/maps.js?v=pixel-1';
import {createSession} from '../src/gameplay/engine.js?v=gameplay-1';
test('anime sprite atlas: 84 nonempty transparent frames, feet aligned, direction and walk poses distinct',async()=>{
 const atlas=await (await fetch('../assets/pixel/atlas.json')).json(),s=atlas.characters;
 a.equal(s.layout,'character-rows');a.equal(s.ids.length,7);a.equal(s.frames*s.directions.length,12);
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`../assets/pixel/${s.file}`;});
 a.equal(image.width,s.frameWidth*12);a.equal(image.height,s.frameHeight*7);
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
 for(let row=0;row<7;row++){
  const frames=[];
  for(let col=0;col<12;col++){
   const pixels=ctx.getImageData(col*s.frameWidth,row*s.frameHeight,s.frameWidth,s.frameHeight).data;let count=0,bottom=-1;
   for(let i=3;i<pixels.length;i+=4){a.ok(pixels[i]===0||pixels[i]===255,'Soft alpha in runtime sprite');if(pixels[i]){count++;bottom=Math.floor((i/4)/s.frameWidth);}}
   a.ok(count>100,`Empty/truncated ${s.ids[row]} frame ${col}`);a.equal(bottom,s.frameHeight-2,'Feet must share baseline');
   a.equal(pixels[3],0,'Cell corner must be transparent');frames.push(Array.from(pixels).join(','));
  }
  a.ok(frames[0]!==frames[9],`${s.ids[row]} front/back duplicated`);a.ok(frames[3]!==frames[6],`${s.ids[row]} side directions duplicated`);a.ok(frames[1]!==frames[2],`${s.ids[row]} walking frames duplicated`);
 }
});
test('pixel maps: all doors and interaction points are reachable; destination spawns are safe',()=>{
 for(const map of Object.values(MAPS)){
  const start=safePosition(map,map.spawn,map.npcs);a.ok(walkable(map,start.x,start.y,map.npcs));
  for(const portal of map.portals){a.ok(findPath(map,start,portal,map.npcs),`${map.id}: unreachable door`);const target=MAPS[portal.to];a.ok(walkable(target,portal.spawn.x,portal.spawn.y,target.npcs),`${portal.to}: blocked arrival`);}
  for(const object of [...map.objects.filter(o=>o.kind),...map.npcs])a.ok(pathToObject(map,start,object,map.npcs),`${map.id}/${object.id} is unreachable`);
 }
});
test('pixel collision: wall, water, furniture and NPC tiles reject movement; paths never skip tiles',()=>{
 const m=MAPS.yard;a.equal(walkable(m,0,0),false);a.equal(walkable(MAPS.street,35,20),false);a.equal(walkable(m,20,8),false);a.equal(walkable(m,31,12,m.npcs),false);a.equal(findPath(m,m.spawn,{x:20,y:8}),null);
 const path=pathToObject(m,m.spawn,m.objects.find(o=>o.id==='classroom'),m.npcs);let previous=m.spawn;for(const p of path){a.equal(Math.abs(p.x-previous.x)+Math.abs(p.y-previous.y),1);a.ok(walkable(m,p.x,p.y,m.npcs));previous=p;}
});
test('pixel NPC schedule: club during school hours, leisure after club and weekends, future joins hidden',()=>{
 const state=createSession();state.phase='club';a.equal(visibleNPCs(MAPS.newsroom,state).length,3);a.equal(visibleNPCs(MAPS.street,state).filter(n=>n.person).length,0);
 state.phase='personal';a.equal(visibleNPCs(MAPS.newsroom,state).length,0);a.equal(visibleNPCs(MAPS.street,state).filter(n=>n.person).length,3);
 state.day=8;state.phase='club';a.equal(visibleNPCs(MAPS.newsroom,state).length,4);state.day=13;a.equal(visibleNPCs(MAPS.newsroom,state).length,0);a.equal(visibleNPCs(MAPS.street,state).filter(n=>n.person).length,5);
});
test('pixel saves: invalid/out-of-bounds/blocked positions fall back to walkable spawn',()=>{
 const m=MAPS.home;for(const position of [{x:NaN,y:2},{x:999,y:3},{x:15,y:6},{x:-1,y:2}]){const p=safePosition(m,position);a.ok(walkable(m,p.x,p.y));a.equal(p.x,m.spawn.x);a.equal(p.y,m.spawn.y);}
});
