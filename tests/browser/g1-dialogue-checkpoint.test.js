import {test,assert,equal} from '/tests/harness.js';
import {runtimeCheckpoint} from '/src/bootstrap/RuntimeCheckpoint.js';
import {DialoguePresentationView} from '/src/presentation/ui/DialoguePresentationView.js';
const success=value=>({ok:true,value}),failed=()=>({ok:false,errors:[{code:'test.prepare.failed',sourceId:'fixture',pointer:'/'}]});
const model=name=>({speakerId:'actor.'+name,nameKey:name,expressionId:'neutral',portraitAssetId:'image.'+name});
async function setup({portraitFails=false,uiFails=false}={}){
 const root=document.createElement('div');root.innerHTML='<canvas data-role="dialogue-portrait"></canvas><span data-role="dialogue-name"></span>';document.body.append(root);
 const released=[],image=document.createElement('canvas');image.width=image.height=2;image.getContext('2d').fillRect(0,0,2,2);
 const view=(id,fail=false)=>new DialoguePresentationView({root,format:key=>key,revision:'test',assets:{acquire:async()=>fail?failed():success({get:()=>image,release:()=>released.push(id)})}});
 const ports=dialogue=>({dialogue,world:{dispose(){}},sequence:{cancel(){}},audio:{dispose:async()=>{}}});
 const previous=ports(view('old'));assert((await previous.dialogue.present(model('khue'))).ok);let live=previous;const next=ports(view('candidate',portraitFails));
 const runtime=runtimeCheckpoint({read:()=>live,write:value=>live=value,create:()=>next,freeze(){},thaw(){},captureUI:()=>({paused:false}),prepareUI:async()=>uiFails?failed():success(null),restoreUI(){},line:{snapshot:()=>null},text:{},speed:1,document,dialogueModel:()=>success(model('van'))});
 const state={world:{sceneId:null},story:{waiting:'idle'},presentation:{dialogue:null,view:{world:{sceneId:null,elapsed:0,camera:{x:0,y:0,zoom:1},actors:{}},ui:{paused:false},text:null}},sequence:{},audio:{}};
 return {root,previous,next,runtime,state,released,live:()=>live,name:()=>root.querySelector('span').textContent,cleanup(){previous.dialogue.dispose();next.dialogue.dispose();root.remove();}};
}
test('restore portrait failure leaves current ports name and portrait unchanged',async()=>{
 const f=await setup({portraitFails:true});try{const before=f.root.querySelector('canvas').toDataURL(),result=await f.runtime.prepare(f.state);assert(!result.ok);assert(f.live()===f.previous);equal(f.name(),'khue');equal(f.root.querySelector('canvas').toDataURL(),before);equal(f.released,[]);}finally{f.cleanup();}
});
test('later restore preparation failure releases the candidate portrait lease',async()=>{
 const f=await setup({uiFails:true});try{const result=await f.runtime.prepare(f.state);assert(!result.ok);equal(f.released,['candidate']);equal(f.name(),'khue');assert(f.live()===f.previous);}finally{f.cleanup();}
});
test('restore commit rollback abort and finalize preserve the right portrait owner',async()=>{
 const f=await setup();try{const result=await f.runtime.prepare(f.state);assert(result.ok);equal(f.name(),'khue');f.runtime.commit(result.value);equal(f.name(),'van');assert(f.live()===f.next);f.runtime.rollback(result.value);equal(f.name(),'khue');await f.runtime.abort(result.value);equal(f.released,['candidate']);}finally{f.cleanup();}
 const g=await setup();try{const result=await g.runtime.prepare(g.state);assert(result.ok);g.runtime.commit(result.value);await g.runtime.finalize(result.value);equal(g.name(),'van');equal(g.released,['old']);}finally{g.cleanup();}
});
