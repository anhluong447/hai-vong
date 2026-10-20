import {test,assert as a} from './harness.js';
import {WorldDocument} from '../tools/authoring/WorldDocument.js';
import {SCENES,PREFABS,KNOWN_REFS} from '../content/maps/scenes-data.js';
const api=()=>import('../tools/authoring/TilePaint.js');
test('Tile paint: lines and rectangles cover fast movement and inclusive reversed bounds',async()=>{
 const {lineCells,rectangleCells}=await api(),cases=await fetch('fixtures/tile-paint-cases.json').then(r=>r.json());
 for(const c of cases)a.equal(JSON.stringify(lineCells(c.from,c.to).map(p=>[p.x,p.y])),JSON.stringify(c.expected));
 a.equal(JSON.stringify(rectangleCells({x:2,y:2},{x:-2,y:1},{width:3,height:3}).map(p=>[p.x,p.y])),JSON.stringify([[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]]));
});
test('Tile paint: flood is four-connected and handles the maximum scene without recursion',async()=>{
 const {floodCells}=await api();
 a.equal(floodCells([[0,1,0],[1,0,1],[0,1,0]],{x:1,y:1}).length,1);
 a.equal(floodCells(Array.from({length:256},()=>Array(256).fill(0)),{x:0,y:0}).length,65536);
});
test('Tile paint: patches clone source, deduplicate and reject malformed coordinates and IDs',async()=>{
 const {applyTileEdits}=await api(),source=[[0,0],[0,0]],next=applyTileEdits(source,[{x:0,y:0,tile:2},{x:0,y:0,tile:3}]);
 a.equal(next[0][0],3);a.equal(source[0][0],0);a.ok(next[0]!==source[0]);
 for(const edit of [{x:-1,y:0,tile:2},{x:0,y:2,tile:2},{x:true,y:0,tile:2},{x:0,y:0,tile:16},{x:0,y:0,tile:true},{x:0,y:0,tile:'2'},{x:NaN,y:0,tile:2}])a.throws(()=>applyTileEdits(source,[edit]));
});
test('Tile paint: a complete gesture is one undo, no-op preserves redo, invalid patch is atomic',()=>{
 const doc=new WorldDocument({source:SCENES.home,prefabs:PREFABS,knownRefs:KNOWN_REFS,sourceHash:'fixture'}),before=doc.exportJSON(),edits=[];
 for(let y=1;y<5;y++)for(let x=1;x<5;x++)edits.push({x,y,tile:2});
 a.equal(doc.applyTileEdits(edits),true);a.equal(doc.undoStack.length,1);doc.undo();a.equal(doc.exportJSON(),before);
 a.equal(doc.applyTileEdits([{x:1,y:1,tile:doc.draft.tiles[1][1]}]),false);a.equal(doc.redoStack.length,1);
 a.throws(()=>doc.applyTileEdits([{x:1,y:1,tile:2},{...doc.draft.spawn,tile:5}]));a.equal(doc.exportJSON(),before);a.equal(doc.redoStack.length,1);
 doc.redo();a.equal(doc.draft.tiles[1][1],2);a.equal(JSON.stringify(doc.draft.objects),JSON.stringify(SCENES.home.objects));
});
