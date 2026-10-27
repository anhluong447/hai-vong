import {test,assert,equal} from '/tests/harness.js';
import {projectSource} from '/tests/fixtures/project.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {GameSession} from '/src/application/GameSession.js';
import {AnimationPlayer} from '/src/presentation/world/AnimationPlayer.js';
const options={speed:160,accelSeconds:.09,stopSeconds:.08,bounds:{min:0,max:10000}};
test('piecewise motion is equivalent at 30/60/120Hz, ramps .09s and coasts 6.4 units',async()=>{
 const {integrateMotion}=await import('/src/domain/world/Motion.js');
 for(const hz of [30,60,120]){let s={position:100,velocity:0,travelled:0};for(let i=0;i<hz;i++)s=integrateMotion(s,{axis:1,delta:1/hz},options);assert(Math.abs(s.position-252.8)<.001);equal(s.velocity,160);
  const x=s.position;for(let i=0;i<hz;i++)s=integrateMotion(s,{axis:0,delta:1/hz},options);assert(Math.abs(s.position-x-6.4)<.001);equal(s.velocity,0);assert(Math.abs(s.travelled-159.2)<.001);}
 const s=integrateMotion({position:100,velocity:0,travelled:0},{axis:1,delta:.09},options);equal(s.velocity,160);assert(Math.abs(s.position-107.2)<.001);
});
test('session motion emits actual distance, stops without moving progress, and resets at scene entry',async()=>{
 const source=await projectSource(),runtime=source.documents.find(d=>d.kind==='config'&&d.data.kind==='runtime').data;runtime.movementSpeed=160;runtime.locomotionConfigId='motion.test';source.documents.push({sourceId:'motion.json',kind:'config',data:{id:'motion.test',kind:'locomotion',accelSeconds:.09,stopSeconds:.08}});
 const checked=validateProject(source);assert(checked.ok);const session=new GameSession({bundle:checked.value});assert(session.execute({type:'scene.request',sceneId:runtime.startSceneId,requestId:'test'}).ok);assert(session.execute({type:'scene.commit',requestId:'test'}).ok);
 const before=session.snapshot();let result=session.execute({type:'world.move',axis:1,delta:.05});assert(result.ok);assert(session.snapshot().world.velocity>0&&session.snapshot().world.velocity<160);assert(result.value.outcomes.some(o=>o.type==='world.moved'&&o.actualDistance>0));equal(session.snapshot().gameplay,before.gameplay);equal(session.snapshot().executionLedger,before.executionLedger);
 const position=session.snapshot().world.position;assert(session.execute({type:'world.stop'}).ok);equal(session.snapshot().world.velocity,0);equal(session.snapshot().world.position,position);
});
test('distance seeking selects all six gait poses independently of delta time',async()=>{
 const frames=Array.from({length:6},(_,i)=>({assetId:String(i),duration:.1})),player=new AnimationPlayer({get:()=>({ok:true,value:{id:'walk',loop:true,frames}})});player.play('walk');
 for(let i=0;i<6;i++){assert(player.seekDistance(i*16,96).ok);equal(player.frame().assetId,String(i));}player.seekDistance(96,96);equal(player.frame().assetId,'0');
});
test('motion reversal counts actual path, clamps bounds and never advances a blocked gait',async()=>{
 const {integrateMotion}=await import('/src/domain/world/Motion.js');
 let s=integrateMotion({position:100,velocity:160,travelled:0},{axis:-1,delta:.18},options);assert(Math.abs(s.position-100)<.001);assert(Math.abs(s.travelled-14.4)<.001);equal(s.velocity,-160);
 s=integrateMotion({position:9999,velocity:160,travelled:8},{axis:1,delta:.05},options);equal(s.position,10000);equal(s.velocity,0);equal(s.travelled,9);
 s=integrateMotion(s,{axis:1,delta:.05},options);equal(s.travelled,9);equal(s.actualDistance,0);
 const before={position:100,velocity:0,travelled:0};equal(integrateMotion(before,{axis:0,delta:0},options).position,100);equal(before,{position:100,velocity:0,travelled:0});
 for(const delta of [-1,NaN,Infinity]){let rejected=false;try{integrateMotion(before,{axis:1,delta},options);}catch{rejected=true;}assert(rejected);}
});
