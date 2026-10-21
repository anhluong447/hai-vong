import {test,assert} from './harness.js';
import {cellPassage} from '../src/shared/tilePassage.js';
import {canStep,findPath} from '../src/pixel/maps.js';
test('Layered passage keeps walls blocked beneath overhead decorations',async()=>{
 const {catalog,scene}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 const {normalizeTileLayers}=await import('../src/shared/tileLayers.js');
 const layers=normalizeTileLayers(scene),map={...scene,layers,objects:[],npcs:[]};delete map.tiles;
 layers[0].tiles[1][1]=27;layers[3].tiles[1][1]=0;assert.ok(cellPassage(map,1,1,catalog).blocked);
 layers[0].tiles[1][1]=0;assert.ok(!cellPassage(map,1,1,catalog).blocked);
});
test('Directional steps and BFS check both source and destination edges',async()=>{
 const {catalog,scene}=await fetch('fixtures/tile-foundation-cases.json').then(r=>r.json());
 catalog.tiles[1].collision='none';catalog.tiles[1].blockedEdges=['left'];
 const map={...scene,tiles:[[0,0,0],[0,27,0],[0,0,0]],objects:[]};
 assert.ok(!canStep(map,{x:0,y:1},{x:1,y:1},[],catalog));
 assert.ok(!canStep(map,{x:1,y:1},{x:0,y:1},[],catalog));
 assert.ok(canStep(map,{x:1,y:0},{x:1,y:1},[],catalog));
 assert.ok(!canStep(map,{x:0,y:0},{x:1,y:1},[],catalog));
 const start={x:0,y:1},path=findPath(map,start,{x:1,y:1},[],catalog);assert.ok(path.length>1);
 let p=start;for(const q of path){assert.ok(canStep(map,p,q,[],catalog));p=q;}
 assert.ok(canStep(map,{x:0,y:0},{x:1,y:0},[{x:0,y:0,solid:true}],catalog));
});
