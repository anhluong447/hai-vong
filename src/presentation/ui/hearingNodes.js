import {element} from './uiNodes.js';
export function hearingText(root,value){const node=element(root,'p');node.textContent=value;root.append(node);return node;}
export function hearingButton(root,label,action,id,dispatch,disabled=false){
 const node=element(root,'button',{'data-hearing-action':action});if(id!==undefined)node.dataset.id=id;node.textContent=label;node.disabled=disabled;node.addEventListener('click',()=>dispatch(action,id));root.append(node);return node;
}
