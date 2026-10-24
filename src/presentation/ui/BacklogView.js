import {element,actionButton} from './uiNodes.js';
export class BacklogView {
 constructor(root,format){Object.assign(this,{root,format});}
 render(history,back){const {root,format}=this;const rows=history.map(entry=>{const node=element(root,'p');node.textContent=format(entry.textKey,entry.params);return node;});if(!rows.length){const node=element(root,'p');node.textContent=format('player.historyEmpty');rows.push(node);}root.replaceChildren(...rows,actionButton(root,format,'player.back','back',back));}
}
