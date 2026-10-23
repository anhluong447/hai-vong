import {actionButton,element} from './uiNodes.js';
export class SettingsView {
 constructor(root,format){Object.assign(this,{root,format});}
 render(value,{config,actions,change,remap,defaults,back}){
  const {root,format}=this;root.replaceChildren();
  const select=(id,key,options,current,convert=x=>x)=>{const label=element(root,'label'),caption=element(root,'span'),control=element(root,'select',{'data-setting':id});caption.textContent=format(key);
   for(const option of options){const node=element(root,'option',{value:String(option.value)});node.textContent=option.label;node.selected=option.value===current;control.append(node);}
   control.addEventListener('change',()=>change(id,convert(control.value)));label.append(caption,control);root.append(label);
  };
  select('textScale','player.textScale',config.textScales.map(value=>({value,label:format('player.value',{value})})),value.textScale,Number);
  select('textSpeed','player.textSpeed',config.textSpeeds.map(value=>({value,label:format('player.value',{value})})),value.textSpeed,Number);
  select('reducedMotion','player.motion',[{value:false,label:format('player.off')},{value:true,label:format('player.on')}],value.reducedMotion,v=>v==='true');
  select('locale','player.locale',Object.entries(actions.locales).map(([value,key])=>({value,label:format(key)})),value.locale);
  for(const [bus,gain]of Object.entries(value.audio)){
   const label=element(root,'label'),caption=element(root,'span'),control=element(root,'input',{type:'number',min:'0',max:'1',step:'any','data-bus':bus});caption.textContent=format('player.audioBus',{bus:format(actions.buses[bus])});control.value=String(gain);control.addEventListener('change',()=>change('audio',{...value.audio,[bus]:Number(control.value)}));label.append(caption,control);root.append(label);
  }
  for(const [index,binding]of value.bindings.entries()){
   const node=element(root,'button',{'data-action':'remap','data-remap':String(index)});node.textContent=format('player.remap',{action:format(actions.labels[binding.action]),code:binding.code});node.addEventListener('click',()=>remap(index));root.append(node);
  }
  root.append(actionButton(root,format,'player.defaults','defaults',defaults),actionButton(root,format,'player.back','back',back));
 }
}
