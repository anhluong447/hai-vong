import {GameSession} from '../../src/application/GameSession.js';
import {diagnostic,failure,success} from '../../src/contracts/Diagnostic.js';
/** A replacement fixture must validate and replay successfully before it is adopted. */
export class PlaytestSession {
 constructor({locate=id=>({sourceId:id,pointer:''})}={}){this.locate=locate;}
 start(bundle,id,checkpoint){const found=bundle.catalog.get('playtests',id),location=this.locate(id);return found.ok?this.startDefinition(bundle,found.value,location.sourceId,checkpoint,location.pointer):found;}
 startDefinition(bundle,definition,sourceId,checkpoint,prefix=''){
  const bad=(pointer,errors=[])=>failure(errors.length?errors.map(error=>({...error,sourceId,pointer:prefix+pointer,relatedIds:[error.code,...error.relatedIds]})):diagnostic('preview.fixture.invalid',sourceId,prefix+pointer));
  try{
   if(definition.kind!=='playtest-fixture')return bad('/kind');const next=new GameSession({bundle}),initial=structuredClone(next.snapshot());Object.assign(initial.gameplay.calendar,definition.initial.calendar);initial.gameplay.energy=definition.initial.energy;const checked=next.replace(initial);if(!checked.ok)return bad('/initial',checked.errors);
   for(const command of [{type:'scene.request',sceneId:definition.initial.sceneId,spawnId:definition.initial.spawnId,requestId:'authoring.fixture'},{type:'scene.commit',requestId:'authoring.fixture'}]){const result=next.execute(command);if(!result.ok)return bad('/initial',result.errors);}
   const end=checkpoint===undefined?definition.commands.length:definition.checkpoints.find(point=>point.id===checkpoint)?.after;if(!Number.isInteger(end)||end<0||end>definition.commands.length)return bad('/checkpoints');
   const trace=[];for(let index=0;index<end;index++){const command=definition.commands[index],result=next.execute(command);if(!result.ok)return bad('/commands/'+index,result.errors);trace.push({command,outcomes:result.value.outcomes});}
   this.session=next;this.trace=trace;return success(next.snapshot());
  }catch{return bad('/');}
 }
 execute(command){if(!this.session)return failure(diagnostic('preview.stopped','preview','/'));const result=this.session.execute(command);this.trace.push({command,result:result.ok?{outcomes:result.value.outcomes}:{errors:result.errors}});return result;}
 snapshot(){return this.session?.snapshot()??null;}
 stop(){this.session=null;this.trace=[];}
}
