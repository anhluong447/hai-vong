import {test,assert as a} from './harness.js';
import {menuLayout} from '../content/ui/menu-layout-data.js';

test('layout document: transaction groups pointer edits, cancel is atomic and redo invalidates on new edit',async()=>{
 const {LayoutDocument}=await import('../tools/authoring/LayoutDocument.js');
 const doc=new LayoutDocument(menuLayout);doc.begin();
 for(let i=1;i<=100;i++)doc.set('resources','x',45+i);
 doc.commit();a.equal(doc.value.regions.resources.x,145);a.equal(doc.history.length,1);
 doc.undo();a.equal(doc.value.regions.resources.x,45);doc.redo();a.equal(doc.value.regions.resources.x,145);
 doc.begin();doc.set('resources','x',900);doc.cancel();a.equal(doc.value.regions.resources.x,145);a.equal(doc.history.length,1);
 doc.undo();doc.set('resources','y',720);a.equal(doc.redo(),false);
});
test('layout import/export: stable round trip, unknown data rejection and prior state preservation',async()=>{
 const {LayoutDocument}=await import('../tools/authoring/LayoutDocument.js');
 const doc=new LayoutDocument(menuLayout);doc.set('resources','x',51.125);
 const exported=doc.export();const restored=new LayoutDocument(menuLayout);restored.import(exported);
 a.equal(restored.value.regions.resources.x,51.13);a.equal(restored.export(),exported);
 const before=restored.export();a.throws(()=>restored.import('{"schemaVersion":999}'));a.equal(restored.export(),before);
 const data=JSON.parse(exported);for(const key of ['history','selection','energy','people','state'])a.equal(Object.hasOwn(data,key),false);
});
test('layout draft: base hash conflicts do not replace current document',async()=>{
 const {LayoutDocument}=await import('../tools/authoring/LayoutDocument.js');
 const doc=new LayoutDocument(menuLayout);doc.set('resources','x',85);const draft=doc.draft('original');
 const other=new LayoutDocument(menuLayout);a.throws(()=>other.restore(draft,'changed'),/conflict/);a.equal(other.value.regions.resources.x,45);
 other.restore(draft,'original');a.equal(other.value.regions.resources.x,85);
});
