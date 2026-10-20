import {test,assert as a} from './harness.js';
async function withEditor(run){
 const frame=document.createElement('iframe');frame.src='../tools/world-editor.html';frame.style.cssText='position:relative;left:0;width:1200px;height:850px';document.body.append(frame);
 try{await new Promise((resolve,reject)=>{const start=Date.now(),poll=()=>frame.contentWindow.worldEditor?.world.ready?resolve():Date.now()-start>15000?reject(new Error('Tile editor timeout')):setTimeout(poll,20);poll();});
 const e=frame.contentWindow.worldEditor;e.overlay.setPointerCapture=()=>{};e.overlay.hasPointerCapture=()=>false;
 const pointer=(type,x,y,id=17)=>{const r=e.world.canvas.getBoundingClientRect(),ratio=r.width/e.world.canvas.width;const ev=new frame.contentWindow.PointerEvent(type,{button:0,pointerId:id,clientX:r.left+((x+.5)*16-e.world.camera.x)*ratio,clientY:r.top+((y+.5)*16-e.world.camera.y)*ratio,bubbles:true,cancelable:true});e.overlay.dispatchEvent(ev);};
 await run(e,frame.contentWindow,pointer);
 }finally{frame.contentWindow.worldEditor?.dispose();frame.remove();}
}
test('Tile editor: palette and brush preview commit once without moving entities',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tiles=e.tileEditor;
 a.equal(w.document.querySelectorAll('[data-tile-id]').length,16);a.equal(e.editLayer,'tiles');
 const source=e.document.exportJSON(),objects=JSON.stringify(e.document.draft.objects);tiles.setPrimaryTile(2);
 p('pointerdown',3,3);p('pointermove',7,3);
 a.equal(e.document.exportJSON(),source);a.equal(e.document.undoStack.length,0);a.ok(tiles.stroke);
 p('pointerup',7,3);a.equal(e.document.undoStack.length,1);
 for(let x=3;x<=7;x++)a.equal(e.document.draft.tiles[3][x],2);
 a.equal(JSON.stringify(e.document.draft.objects),objects);e.document.undo();a.equal(e.document.exportJSON(),source);
}));
test('Tile editor: rectangle, fill, eyedropper and replacement eraser use actual tile IDs',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const tiles=e.tileEditor;tiles.setPrimaryTile(2);tiles.setTool('rectangle');
 p('pointerdown',3,3);p('pointermove',5,4);p('pointerup',5,4);
 for(let y=3;y<=4;y++)for(let x=3;x<=5;x++)a.equal(e.document.draft.tiles[y][x],2);
 tiles.setTool('eyedropper');p('pointerdown',3,3);a.equal(tiles.primaryTile,2);a.equal(tiles.tool,'brush');a.equal(e.document.undoStack.length,1);
 tiles.setTool('fill');tiles.setPrimaryTile(4);p('pointerdown',3,3);p('pointerup',3,3);a.equal(e.document.draft.tiles[4][5],4);
 tiles.setTool('eraser');tiles.setEraseTile(0);p('pointerdown',3,3);p('pointerup',3,3);a.equal(e.document.draft.tiles[3][3],0);
}));
test('Tile editor: blocking a protected spawn rejects the whole gesture',()=>withEditor((e,w,p)=>{
 e.setEditLayer('tiles');const before=e.document.exportJSON();e.tileEditor.setPrimaryTile(5);const s=e.document.draft.spawn;
 p('pointerdown',s.x,s.y);p('pointerup',s.x,s.y);a.equal(e.document.exportJSON(),before);a.equal(e.document.undoStack.length,0);a.equal(e.tileEditor.stroke,null);
 a.ok(e.status.textContent.includes('cannot')||e.status.textContent.includes('Invalid'));
}));
