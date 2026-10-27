import {test,assert} from '/tests/harness.js';
import {loadProject} from '/src/infrastructure/resources/ProjectLoader.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {ActorView} from '/src/presentation/world/ActorView.js';
import {resourceService} from '/tests/fixtures/resources.js';
test('real pixel walk support poses with authored plant compensation',async()=>{
 const b=validateProject(await loadProject('/content/first-three-days.project.json')).value,actor=b.catalog.get('actors','actor.first3.khue').value,clip=b.catalog.get('animations',actor.walkClipId).value,assets=resourceService(b),lease=await assets.acquire([...new Set(clip.frames.map(f=>f.assetId))],{revision:b.revision});assert(lease.ok);
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=260;const c=canvas.getContext('2d'),view=new ActorView(actor,b.catalog);c.fillStyle='#e8d6bc';c.fillRect(0,0,960,260);c.fillStyle='#56616b';c.fillRect(0,220,960,1);
 try{for(let i=0;i<6;i++){view.draw(c,lease.value,{x:90+i*150,y:220,facing:1,moving:true,travelled:i*8},0);c.fillText(String(i*8),80+i*150,245);}return {screenshot:canvas.toDataURL('image/png').split(',')[1],distances:[0,8,16,24,32,40],purpose:'actual renderer deformation inspection; no bitmap edits'};}
 finally{view.dispose();lease.value.release();assets.dispose();}
});
