const controls='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export class FocusRouter {
 constructor(target){this.stack=[];this.controller=new AbortController();target.addEventListener('keydown',event=>{
  const top=this.stack.at(-1);if(!top||event.key!=='Tab')return;
  const list=this.items(top.root);if(!list.length){event.preventDefault();top.root.focus();return;}
  const current=list.indexOf(top.root.ownerDocument.activeElement);
  if(event.shiftKey&&(current<=0)||!event.shiftKey&&(current<0||current===list.length-1)){event.preventDefault();list[event.shiftKey?list.length-1:0].focus();}
 },{signal:this.controller.signal});}
 items(root){return [...root.querySelectorAll(controls)].filter(node=>!node.closest('[hidden]')&&node.getClientRects().length);}
 push(root){this.stack.push({root,opener:root.ownerDocument.activeElement});(this.items(root)[0]??root).focus();}
 pop(){const top=this.stack.pop();if(!top)return;if(top.opener?.isConnected)top.opener.focus();else{const root=this.stack.at(-1)?.root;this.items(root??top.root)[0]?.focus();}}
 dispose(){this.controller.abort();this.stack=[];}
}
