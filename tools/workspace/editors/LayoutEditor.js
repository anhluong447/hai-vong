import {Inspector} from './Inspector.js';
import {MainMenu} from '../../../src/presentation/ui/MainMenu.js';
export class LayoutEditor extends Inspector {
 render(){super.render();const {data}=this.selected(),preview=this.node('div',{'data-role':'layout-preview'});this.previewRoot.append(preview);
  const world=this.workspace.bundle.catalog.list('config').find(config=>config.kind==='world-ui');for(const [key,value]of Object.entries(data.tokens??world.tokens))preview.style.setProperty(key,value);
  if(data.kind==='player-navigation'){const menu=this.node('div');preview.append(menu);new MainMenu(menu,(...args)=>this.label(...args)).render(data.main,action=>{preview.dataset.lastAction=action;});}
  for(const state of this.ui.states){const node=this.node(state.id==='error'?'p':'button',{'data-state':state.id},this.label(state.labelKey));if(state.id==='disabled')node.disabled=true;if(state.id==='selected')node.setAttribute('aria-pressed','true');if(state.id==='error')node.setAttribute('role','alert');preview.append(node);}
 }
}
