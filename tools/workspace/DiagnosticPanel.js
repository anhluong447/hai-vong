export class DiagnosticPanel {
 constructor(element,text,onSelect){this.element=element;this.text=text;this.onSelect=onSelect;}
 show(errors=[]){
  this.element.replaceChildren();
  for(const error of errors){const button=document.createElement('button');const label=this.text.format('workspace.diagnostic',{code:error.code,source:error.sourceId,pointer:error.pointer});button.textContent=label.ok?label.value:error.code;button.addEventListener('click',()=>this.onSelect(error));this.element.append(button);}
 }
}
