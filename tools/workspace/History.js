export class History {
 constructor(){this.past=[];this.future=[];}
 record(before){this.past.push(before);this.future=[];}
 undo(current){if(!this.past.length)return null;this.future.push(current);return this.past.pop();}
 redo(current){if(!this.future.length)return null;this.past.push(current);return this.future.pop();}
}
