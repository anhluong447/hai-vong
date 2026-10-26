import {test,assert,equal} from '/tests/harness.js';
import {validateProject} from '/src/domain/story/validateProject.js';
import {GameSession} from '/src/application/GameSession.js';
import {presentationSource,presentationParts} from '/tests/fixtures/g1-presentation.js';
import {projectSource} from '/tests/fixtures/project.js';

async function validSource(){const source=await presentationSource(),checked=validateProject(source);assert(checked.ok,JSON.stringify(checked));return {source,bundle:checked.value};}
async function resolver(){return (await import('/src/application/DialoguePresentation.js')).resolveDialoguePresentation;}
function rejectedAt(source,sourceId,field,code){const checked=validateProject(source);assert(!checked.ok,'invalid presentation accepted');assert(checked.errors.some(error=>error.sourceId===sourceId&&error.pointer.includes(field)&&(!code||error.code===code)),JSON.stringify(checked));}

test('optional presentation fields preserve valid legacy and authored content',async()=>{
 assert(validateProject(await projectSource()).ok);
 await validSource();
});

test('guarded portrait follows the story cursor independently of localized labels',async()=>{
 const {source,bundle}=await validSource(),resolve=await resolver(),session=new GameSession({bundle});
 assert(session.execute({type:'story.step',intent:{type:'start',chapterId:'chapter.g1.presentation'}}).ok);
 const state=session.snapshot(),before=structuredClone(state);
 equal(resolve(state,bundle),{ok:true,value:{speakerId:'actor.g1.van',nameKey:'g1.test.van',expressionId:'guarded',portraitAssetId:'image.fixture.actor1'}});
 for(const doc of source.documents.filter(doc=>doc.kind==='locale'))doc.data['g1.test.van'].value='A completely different translated label';
 const renamed=validateProject(source);assert(renamed.ok);
 equal(resolve(state,renamed.value).value,resolve(state,bundle).value);
 equal(state,before);
});

test('name-only speakers and neutral portraits resolve without persisting presentation metadata',async()=>{
 const {bundle}=await validSource(),resolve=await resolver(),session=new GameSession({bundle});
 assert(session.execute({type:'story.step',intent:{type:'start',chapterId:'chapter.g1.presentation'}}).ok);
 assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);
 equal(resolve(session.snapshot(),bundle),{ok:true,value:{speakerId:'actor.g1.khue',nameKey:'g1.test.khue',expressionId:null,portraitAssetId:null}});
 assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);
 equal(resolve(session.snapshot(),bundle),{ok:true,value:{speakerId:'actor.g1.van',nameKey:'g1.test.van',expressionId:'neutral',portraitAssetId:'image.fixture.actor0'}});
 equal(Object.keys(session.snapshot().presentation.dialogue).sort(),['params','revealed','textKey']);
});

test('narration and idle or ended stories clear the previous speaker model',async()=>{
 const {bundle}=await validSource(),resolve=await resolver(),session=new GameSession({bundle});
 equal(resolve(session.snapshot(),bundle),{ok:true,value:null});
 assert(session.execute({type:'story.step',intent:{type:'start',chapterId:'chapter.g1.presentation'}}).ok);
 for(let i=0;i<3;i++)assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);
 equal(resolve(session.snapshot(),bundle),{ok:true,value:null});
 assert(session.execute({type:'story.step',intent:{type:'advance'}}).ok);
 equal(resolve(session.snapshot(),bundle),{ok:true,value:null});
 const bad=structuredClone(session.snapshot());bad.story.waiting='say';bad.story.cursor.commandId='missing';
 assert(!resolve(bad,bundle).ok,'missing cursor accepted');
});

for(const [name,mutate,field,code]of [
 ['unknown speaker',command=>command.speakerId='actor.missing','/speakerId','story.speaker.invalid'],
 ['unknown expression',command=>command.expressionId='missing','/expressionId','story.expression.invalid'],
 ['expression without speaker',command=>delete command.speakerId,'/expressionId','story.expression.invalid'],
 ['expression on name-only actor',command=>command.speakerId='actor.g1.khue','/expressionId','story.expression.invalid'],
 ['speaker on non-say opcode',command=>{command.op='setBackdrop';command.assetId='image.fixture.scene';},'/speakerId','story.presentation.opcode']
])test('presentation metadata rejects '+name+' at its authored field',async()=>{
 const source=await presentationSource(),{story}=presentationParts(source);mutate(story.data.nodes[0].commands[0]);rejectedAt(source,story.sourceId,field,code);
});

for(const [name,mutate,field]of [
 ['portrait reference missing',actor=>actor.portraits.guarded='image.missing','/portraits/guarded'],
 ['portrait is audio',actor=>actor.portraits.guarded='audio.fixture.tone','/portraits/guarded'],
 ['neutral portrait absent',actor=>delete actor.portraits.neutral,'/portraits/neutral'],
 ['portrait value is not an ID',actor=>actor.portraits.guarded=7,'/portraits/guarded'],
 ['empty expression ID',actor=>actor.portraits['']='image.fixture.actor0','/portraits/'],
 ['unknown sampling',actor=>actor.sampling='blurred','/sampling']
])test('actor presentation rejects '+name+' at its authored field',async()=>{
 const source=await presentationSource(),{actors,van}=presentationParts(source);mutate(van);rejectedAt(source,actors.sourceId,field);
});

for(const [name,value,field]of [
 ['facing zero',0,'facing'],['empty days',[],'visibleDays'],['non-positive day',[0],'visibleDays'],
 ['fractional day',[1.5],'visibleDays'],['duplicate days',[1,1],'visibleDays'],['string day',['1'],'visibleDays']
])test('NPC presentation rejects '+name,async()=>{
 const source=await presentationSource(),{scene}=presentationParts(source);scene.data[0].actors[0][field]=value;rejectedAt(source,scene.sourceId,'/actors/0/'+field);
});

test('NPC instance IDs are unique within a scene to avoid snapshot ownership collisions',async()=>{
 const source=await presentationSource(),{scene}=presentationParts(source);scene.data[0].actors.push(structuredClone(scene.data[0].actors[0]));rejectedAt(source,scene.sourceId,'/actors');
});
