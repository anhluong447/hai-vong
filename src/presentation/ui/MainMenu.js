import {actionButton} from './uiNodes.js';
export class MainMenu {
 constructor(root,format){Object.assign(this,{root,format});}
 render(items,dispatch){this.root.replaceChildren(...items.map(item=>actionButton(this.root,this.format,item.key,item.action,dispatch)));}
}
