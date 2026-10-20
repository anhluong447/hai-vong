import {test,assert} from './harness.js';
import {validateAssetPack} from '../src/shared/validateAssetPack.js';
test('Active pack validation keeps pixel pivots, frames and separate pick bounds',async()=>{
 const inventory=await fetch('../content/assets/active-inventory.json').then(r=>r.json());
 const pack=validateAssetPack(inventory),khue=pack.assets.find(a=>a.id==='pixel.character.khue');assert.equal(khue.pivotPx.x,16);assert.equal(khue.pivotPx.y,46);assert.equal(khue.framePx.height,48);
 const desk=pack.assets.find(a=>a.id==='pixel.prop.desk');assert.equal(desk.pickHeightTiles,1);assert.equal(desk.framePx.height,48);
 for(const change of [p=>p.assets.push(p.assets[0]),p=>p.assets[0].path='archive/missing.png',p=>p.assets[1].pivotUnit='tile',p=>p.assets[1].regionPx.x=99999]){const bad=structuredClone(inventory);change(bad);assert.throws(()=>validateAssetPack(bad));}
});
