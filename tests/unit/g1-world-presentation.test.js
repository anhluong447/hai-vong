import {test,equal} from '/tests/harness.js';
import {resolveWorldPresentation} from '/src/application/WorldPresentation.js';
test('dialogue and hearing use standing sprites without modifying saved movement state',()=>{
 for(const waiting of ['say','choose','transition','idle','end'])for(const hearing of [null,{}]){
  const state={world:{position:42,moving:true},story:{waiting},gameplay:{hearing}},before=structuredClone(state);
  equal(resolveWorldPresentation(state).moving,['idle','end'].includes(waiting)&&!hearing);equal(state,before);
 }
});
