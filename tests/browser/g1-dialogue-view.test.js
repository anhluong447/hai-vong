import {test,assert,equal} from '/tests/harness.js';
const van={speakerId:'actor.van',nameKey:'name.van',expressionId:'neutral',portraitAssetId:'image.van'};
const khue={speakerId:'actor.khue',nameKey:'name.khue',expressionId:'neutral',portraitAssetId:'image.khue'};
const success=value=>({ok:true,value});
const failure=()=>({ok:false,errors:[{code:'asset.load.failed',sourceId:'image.van',pointer:'/'}]});
async function fixture({manual=false,root=null}={}){
 const {DialoguePresentationView}=await import('/src/presentation/ui/DialoguePresentationView.js');
 root??=document.createElement('div');root.innerHTML='<canvas data-role="dialogue-portrait" aria-hidden="true"></canvas><span data-role="dialogue-name"></span>';document.body.append(root);
 const calls=[],released=new Map(),bitmap=document.createElement('canvas');bitmap.width=bitmap.height=2;bitmap.getContext('2d').fillRect(0,0,2,2);
 const lease=id=>({get:()=>bitmap,release(){released.set(id,(released.get(id)??0)+1);}});
 const assets={acquire(ids,options){const call={ids,options};calls.push(call);return manual?new Promise(resolve=>call.resolve=resolve):Promise.resolve(success(lease(ids[0])));}};
 const names={'name.van':'Van','name.khue':'Khue'};
 const view=new DialoguePresentationView({root,format:key=>names[key],assets,revision:'g1-test'});
 return {view,root,calls,released,lease,names,name:()=>root.querySelector('[data-role=dialogue-name]').textContent,cleanup(){view.dispose();root.remove();}};
}

test('late portrait acquisition cannot replace the current speaker',async()=>{
 const f=await fixture({manual:true});
 try{const a=f.view.present(van),b=f.view.present(khue);equal(f.calls.length,2);equal(f.calls[0].options.revision,'g1-test');f.calls[1].resolve(success(f.lease('khue')));assert((await b).ok);equal(f.name(),'Khue');f.calls[0].resolve(success(f.lease('van')));assert(!(await a).ok);equal(f.name(),'Khue');equal(f.released.get('van'),1);equal(f.released.get('khue'),undefined);}
 finally{f.cleanup();}equal(f.released.get('khue'),1);
});

test('narration clears speaker and portrait while a name-only model stays usable',async()=>{
 const f=await fixture();try{assert((await f.view.present(van)).ok);assert(!f.root.hidden);assert((await f.view.present(null)).ok);equal(f.name(),'');assert(f.root.hidden);equal(f.released.get('image.van'),1);assert((await f.view.present({...khue,portraitAssetId:null,expressionId:null})).ok);equal(f.name(),'Khue');assert(f.root.querySelector('canvas').hidden);equal(f.calls.length,1);}finally{f.cleanup();}
});

test('disposing during acquisition releases a late lease exactly once',async()=>{
 const f=await fixture({manual:true});try{const pending=f.view.present(van);f.view.dispose();assert(f.calls[0].options.signal.aborted);f.calls[0].resolve(success(f.lease('late')));assert(!(await pending).ok);equal(f.released.get('late'),1);equal(f.name(),'');}finally{f.cleanup();}equal(f.released.get('late'),1);
});

test('required portrait failure preserves the previous good model and canvas',async()=>{
 const f=await fixture({manual:true});try{let pending=f.view.present(khue);f.calls[0].resolve(success(f.lease('khue')));assert((await pending).ok);const before=f.root.querySelector('canvas').toDataURL();pending=f.view.present(van);assert(f.root.hidden,'old face was visible beside a new line while loading');f.calls[1].resolve(failure());assert(!(await pending).ok);assert(f.root.hidden,'failed new portrait exposed the previous speaker');equal(f.name(),'Khue');equal(f.root.querySelector('canvas').toDataURL(),before);equal(f.released.get('khue'),undefined);}finally{f.cleanup();}
});

test('prepare and abort leave the live view intact and commit performs no new I/O',async()=>{
 const f=await fixture();try{assert((await f.view.present(khue)).ok);let candidate=await f.view.prepare(van);assert(candidate.ok);equal(f.name(),'Khue');f.view.abort(candidate.value);equal(f.released.get('image.van'),1);assert(!f.view.commit(candidate.value).ok);candidate=await f.view.prepare(van);const count=f.calls.length;assert(f.view.commit(candidate.value).ok);equal(f.calls.length,count);equal(f.name(),'Van');equal(f.released.get('image.khue'),1);}finally{f.cleanup();}
});

test('unchanged model refreshes locale name without reacquiring the portrait',async()=>{
 const f=await fixture();try{assert((await f.view.present(khue)).ok);f.names['name.khue']='Localized Khue';assert((await f.view.present(khue)).ok);equal(f.calls.length,1);equal(f.name(),'Localized Khue');}finally{f.cleanup();}
});

test('disposing an old owner after replacement does not clear the committed view',async()=>{
 const f=await fixture();let replacement;
 try{assert((await f.view.present(khue)).ok);const {DialoguePresentationView}=await import('/src/presentation/ui/DialoguePresentationView.js');replacement=new DialoguePresentationView({root:f.root,format:()=> 'Van',assets:{acquire:async()=>success(f.lease('replacement'))},revision:'g1-test'});const ready=await replacement.prepare(van);assert(ready.ok);assert(replacement.commit(ready.value).ok);f.view.dispose();equal(f.name(),'Van');assert(!f.root.hidden);}
 finally{replacement?.dispose();f.cleanup();}
});
