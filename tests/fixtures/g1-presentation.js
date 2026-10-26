import {projectSource} from './project.js';

/** Test-only authored examples; production never imports this file or its content. */
export async function presentationSource(){
 const source=await projectSource(),actors=source.documents.find(doc=>doc.kind==='actors');
 for(const doc of source.documents.filter(doc=>doc.kind==='locale')){
  doc.data['g1.test.van']={value:'Test Van',params:[]};
  doc.data['g1.test.khue']={value:'Test Khue',params:[]};
 }
 const base=actors.data[0];
 actors.data.push({...structuredClone(base),id:'actor.g1.van',nameKey:'g1.test.van',sampling:'pixel',portraits:{neutral:'image.fixture.actor0',guarded:'image.fixture.actor1'}},
  {...structuredClone(base),id:'actor.g1.khue',nameKey:'g1.test.khue',sampling:'smooth'});
 const scene=source.documents.find(doc=>doc.kind==='scenes').data[0];
 scene.actors[0]={...scene.actors[0],facing:-1,visibleDays:[1,3]};
 const story={id:'chapter.g1.presentation',entryNodeId:'entry',nodes:[{id:'entry',commands:[
  {id:'van',op:'say',textKey:'world.ready',speakerId:'actor.g1.van',expressionId:'guarded'},
  {id:'khue',op:'say',textKey:'world.ready',speakerId:'actor.g1.khue'},
  {id:'neutral',op:'say',textKey:'world.ready',speakerId:'actor.g1.van'},
  {id:'narration',op:'say',textKey:'world.ready'},
  {id:'done',op:'end'}
 ]}]};
 source.documents.push({kind:'story',sourceId:'/tests/fixtures/g1-presentation.story.json',data:story});
 return source;
}

export const presentationParts=source=>({
 actors:source.documents.find(doc=>doc.kind==='actors'),
 van:source.documents.find(doc=>doc.kind==='actors').data.find(actor=>actor.id==='actor.g1.van'),
 scene:source.documents.find(doc=>doc.kind==='scenes'),
 story:source.documents.find(doc=>doc.data?.id==='chapter.g1.presentation')
});
