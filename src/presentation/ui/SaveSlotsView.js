import {element,actionButton} from './uiNodes.js';
export class SaveSlotsView {
 constructor(root,format){Object.assign(this,{root,format});}
 render({config,records,mode,dispatch,back}){
  const {root,format}=this;root.replaceChildren();const input=element(root,'textarea',{'data-role':'save-transfer','aria-label':format('player.transfer')});
  for(const kind of ['manual','auto'])for(let index=0;index<(kind==='manual'?config.manualSlots:config.autoSlots);index++){
   const id=kind+'.'+index,record=records.find(r=>r.id===id),row=element(root,'section',{'data-slot':id}),label=element(root,'p');
   label.textContent=format('player.slot',{kind:format(kind==='manual'?'player.manual':'player.autoSlot'),index:index+1,state:format(record?'player.occupied':'player.empty')});row.append(label);
   const add=(key,action,disabled=false)=>{const node=actionButton(root,format,key,action,()=>dispatch(action,id,input),{'data-slot':id});node.disabled=disabled;row.append(node);};
   if(mode==='save'&&kind==='manual')add('player.save','save-slot');
   add('player.load','load-slot',!record);add('player.backup','backup-slot',!record?.backup);add('player.export','export-slot',!record);
   if(kind==='manual')add('player.import','import-slot');root.append(row);
  }
  root.append(input,actionButton(root,format,'player.back','back',back));
 }
}
