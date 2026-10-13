import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {MotionScope} from './MotionScope.js';
import {replaceContent} from './surfaces.js';
import {menuSections,menuRouteLabels,menuCaseArt,menuPreviewCases} from '../../../content/ui/coastal-menu.js';

const asset=filename=>new URL(`../../../assets/ui/coastal/${filename}`,import.meta.url).href;
const art=(filename,className)=>el('div',{class:className,'aria-hidden':'true'},el('img',{src:asset(filename),alt:''}));
const handwritten=(key,className)=>{
  const lines=t(key).split('\n');
  return el('p',{class:className},lines.map((line,index)=>{
    const node=text('span',line);
    // Keep the catalog's closing punctuation legible independently of the script.
    if(className==='menu-lower-quote'&&index===lines.length-1){
      node.textContent=line.slice(0,-1);node.append(text('span',line.slice(-1),'menu-quote-close'));
    }
    return node;
  }));
};
function icon(id) {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',id==='cases'?'0 0 48 32':id==='coin'?'0 0 28 28':id==='lightning'?'0 0 24 28':'0 0 32 32');
  svg.setAttribute('aria-hidden','true');
  const use=document.createElementNS(svg.namespaceURI,'use');
  use.setAttribute('href',asset('nav-icons.svg')+`#icon-${id}`);svg.append(use);return svg;
}

/** Fixed editorial composition; live controls stay independent of the art. */
export class MenuView {
  constructor(registry,onClose) {
    this.onClose=onClose;this.activeTab='cases';this.key='cases';this.page=0;this.selectedCase=null;
    this.summaries=menuPreviewCases.map(item=>({...item,title:t(item.titleKey),teaser:t(item.teaserKey)}));
    this.week=text('p',t('ui.replica.menu.week.1'),'menu-week-label');
    this.nav=el('nav',{class:'game-menu-nav menu-nav-tabs',role:'tablist','aria-label':t('src.gameplay.main.bang_he_thong'),'aria-orientation':'vertical'});
    this.tabButtons=menuSections.map(section=>{
      const node=button('',()=>this.selectTab(section.id),'menu-nav-tab-btn');
      node.dataset.tab=section.id;node.dataset.focusKey='tab/'+section.id;
      node.setAttribute('role','tab');node.setAttribute('aria-controls','game-menu-content');
      node.append(el('span',{class:'menu-nav-spine-dot','aria-hidden':'true'}),el('span',{class:'menu-nav-tab-icon'},icon(section.icon)),text('span',t(section.textKey)));
      this.nav.append(node);return node;
    });
    this.glider=art('menu-nav-dry-brush.png','menu-nav-highlight-glider');
    this.navContainer=el('div',{class:'menu-nav-container'},[el('div',{class:'menu-nav-spine-line','aria-hidden':'true'}),this.glider,this.nav]);
    this.title=text('h2',t('ui.replica.menu.heading.1'),'menu-section-title');
    this.intro=text('p',t('ui.replica.menu.intro.1'),'menu-section-intro');
    this.secondary=el('nav',{class:'menu-subnav','aria-label':t('src.gameplay.main.bang_he_thong')});
    this.casesStack=el('div',{class:'menu-cases-stack'});
    this.customBody=el('div',{class:'menu-custom-body-slot'});
    this.pages=el('div',{class:'menu-pagination'});
    this.content=el('div',{class:'game-menu-content menu-content-slot',id:'game-menu-content',role:'tabpanel',tabindex:'0','data-focus-key':'menu-content'},[this.secondary,this.casesStack,this.customBody,this.pages]);
    this.body=this.customBody;
    this.quote=handwritten('ui.replica.menu.quote.1','menu-lower-quote');
    this.energyValue=text('span',t('ui.replica.menu.energy.2'),'menu-resource-value');
    this.dots=el('div',{class:'menu-energy-dots','aria-hidden':'true'});
    this.moneyValue=text('span',t('ui.replica.menu.money.1'),'menu-resource-value money-val');
    const resources=el('aside',{class:'menu-resource-strip'},[
      el('div',{class:'menu-resource-row'},[el('span',{class:'menu-resource-icon'},icon('lightning')),el('div',{class:'menu-resource-details'},[
        text('p',t('ui.replica.menu.energy.1'),'menu-resource-label'),el('div',{class:'menu-resource-value-group'},[this.energyValue,this.dots])
      ])]),el('div',{class:'menu-resource-divider'}),
      el('div',{class:'menu-resource-row'},[el('span',{class:'menu-resource-icon'},icon('coin')),this.moneyValue])
    ]);
    const choose=button('',()=>this.focusChoice(),'menu-control-item');
    choose.setAttribute('aria-keyshortcuts','Enter');
    choose.append(el('span',{class:'menu-return-mark','aria-hidden':'true'},icon('enter')),text('span',t('ui.replica.menu.controls.2')));
    const close=button('',()=>{if(!this.back())this.onClose?.();},'menu-control-item coastal-menu-back');
    close.setAttribute('aria-label',t('src.gameplay.main.dong_esc'));
    close.append(text('kbd',t('ui.replica.menu.controls.3'),'menu-keycap'),text('span',t('ui.replica.menu.controls.4')));
    this.node=el('section',{class:'game-menu coastal-editorial-menu is-entering','aria-label':t('ui.replica.menu.preview.title')},[
      art('menu-context-plate.png','menu-plane-scene'),art('menu-ink-wash.png','menu-plane-teal'),
      el('div',{class:'menu-branding'},[
        el('div',{class:'menu-wordmark-row'},[text('h1',t('ui.replica.menu.brand.1'),'menu-wordmark'),art('brand-mark.svg','menu-brand-mark')]),
        el('div',{class:'menu-brand-rule'}),this.week
      ]),handwritten('ui.replica.menu.tagline.1','menu-tagline'),this.navContainer,
      el('main',{class:'game-menu-main menu-content-area'},[
        el('header',{class:'menu-section-header'},[this.title,el('div',{class:'menu-section-rule'}),this.intro]),this.content
      ]),this.quote,resources,art('menu-tidal-wash.png','menu-plane-wave'),art('menu-hint-paper.png','menu-hint-paper'),
      el('div',{class:'menu-foreground-flowers','aria-hidden':'true'}),el('div',{class:'menu-foreground-paper','aria-hidden':'true'}),
      el('footer',{class:'menu-bottom-controls'},[choose,text('span','|','menu-control-sep'),close])
    ]);
    this.motion=new MotionScope(this.node);
    this.node.addEventListener('keydown',event=>{
      if(event.defaultPrevented||event.repeat||!this.overview||!['PageDown','PageUp'].includes(event.key))return;
      event.preventDefault();this.changePage(event.key==='PageDown'?1:-1);
    });
    this.update();
  }
  selectTab(id,notify=true){
    const section=menuSections.find(item=>item.id===id);if(!section)return;
    this.activeTab=id;
    this.tabButtons.forEach(node=>{const active=node.dataset.tab===id;node.classList.toggle('is-active',active);node.setAttribute('aria-selected',String(active));});
    this.glider.style.transform=`translateY(${menuSections.indexOf(section)*86/1672*100}cqi)`;
    if(notify){this.selectedCase=null;this.page=0;if(this.onTab)this.onTab(section.routes[0]);else{this.key=section.routes[0];this.refresh();}}
  }
  stepTab(delta){const index=menuSections.findIndex(section=>section.id===this.activeTab),next=(index+delta+menuSections.length)%menuSections.length;this.selectTab(menuSections[next].id);this.tabButtons[next].focus({preventScroll:true});}
  focusChoice(){
    const focused=document.activeElement;
    if(this.content.contains(focused)&&focused.matches('button:not(:disabled)'))focused.click();
    else ([...this.content.querySelectorAll('button:not(:disabled)')].find(node=>!node.closest('[hidden]'))||this.content).focus({preventScroll:true});
  }
  focusDetails(){
    const target=[...this.customBody.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled)')].find(node=>!node.closest('[hidden]'));
    (target||this.content).focus({preventScroll:true});
  }
  back(){
    if(!this.selectedCase)return false;
    const id=this.selectedCase;this.selectedCase=null;this.refresh();
    [...this.casesStack.querySelectorAll('button')].find(node=>node.dataset.case===id)?.focus({preventScroll:true});return true;
  }
  changePage(delta){
    this.page=Math.max(0,Math.min(Math.ceil(this.summaries.length/2)-1,this.page+delta));this.renderCards();
    this.casesStack.querySelector('button')?.focus({preventScroll:true});
  }
  renderCards(){
    this.page=Math.max(0,Math.min(Math.max(0,Math.ceil(this.summaries.length/2)-1),this.page));
    this.casesStack.replaceChildren(...this.summaries.slice(this.page*2,this.page*2+2).map((item,index)=>{
      const card=button('',()=>{this.selectedCase=item.id;this.refresh();this.focusDetails();},`menu-case-card card-${index===0?'one':'two'}`);
      card.dataset.case=item.id;card.dataset.focusKey='case/'+item.id;
      const thumb=el('div',{class:'case-col-thumb'},el('img',{class:'case-thumb-img',src:asset(menuCaseArt[item.key]||menuCaseArt.documents),alt:''}));
      if(item.key==='community')thumb.append(text('span',t('ui.replica.menu.case_two_sign.1'),'case-gate-sign'));
      card.append(el('div',{class:'case-card-perforation','aria-hidden':'true'},Array.from({length:8},()=>el('span',{class:'perforation-hole'}))),
        text('span',String(this.page*2+index+1).padStart(2,'0'),'case-number-text'),el('span',{class:'case-card-divider','aria-hidden':'true'}),
        el('div',{class:'case-col-body'},[text('span',item.title,'case-title-text'),text('span',item.teaser,'case-teaser-text')]),thumb);
      return card;
    }));
    this.pages.hidden=this.summaries.length<=2;
    if(!this.pages.hidden)this.pages.replaceChildren(
      button(t('ui.menu.previousPage'),()=>this.changePage(-1),'',this.page===0),
      text('span',t('ui.menu.page',{current:this.page+1,total:Math.ceil(this.summaries.length/2)})),
      button(t('ui.menu.nextPage'),()=>this.changePage(1),'',this.page===Math.ceil(this.summaries.length/2)-1)
    );
  }
  refresh(){
    this.overview=this.key==='cases'&&!this.selectedCase&&this.summaries.length>0;
    this.node.classList.toggle('menu-overview',this.overview);
    this.casesStack.hidden=!this.overview;this.customBody.hidden=this.overview;this.quote.hidden=!this.overview;
    this.intro.hidden=!this.overview;
    const selected=this.summaries.find(item=>item.id===this.selectedCase);
    this.title.textContent=selected?.title||(this.overview?t('ui.replica.menu.heading.1'):this.contextTitle||t(menuRouteLabels[this.key]||'ui.replica.menu.heading.1'));
    this.customBody.querySelectorAll('[data-case]').forEach(node=>{node.hidden=Boolean(this.selectedCase&&node.dataset.case!==this.selectedCase);});
    this.renderCards();this.pages.hidden=!this.overview||this.summaries.length<=2;
  }
  update({title,body=[],key='cases',energy=3,maxEnergy=4,money=450,week,onTab,cases}={}){
    const focused=document.activeElement,hadFocus=this.content.contains(focused),focusKey=focused?.dataset?.focusKey;
    if(key!==this.key)this.selectedCase=null;
    this.key=key;this.contextTitle=title;this.onTab=onTab||null;
    const section=menuSections.find(item=>item.routes.includes(key));
    this.navContainer.hidden=!section;
    if(section)this.selectTab(section.id,false);
    if(cases!==undefined)this.summaries=cases;
    if(this.selectedCase&&!this.summaries.some(item=>item.id===this.selectedCase))this.selectedCase=null;
    if(week!==undefined)this.week.textContent=t('ui.menu.week',{week:String(week).padStart(2,'0')});
    this.energyValue.textContent=`${energy}/${maxEnergy}`;
    this.dots.replaceChildren(...Array.from({length:maxEnergy},(_,index)=>el('span',{class:'energy-dot'+(index>=energy?' is-empty':'')})));
    this.moneyValue.textContent=t('ui.replica.hud.resources.2',{money:Number(money).toLocaleString('vi-VN')});
    this.secondary.hidden=!this.onTab||!section||section.routes.length<2;
    if(!this.secondary.hidden)this.secondary.replaceChildren(...section.routes.map(route=>{
      const node=button(t(menuRouteLabels[route]),()=>{this.selectedCase=null;this.onTab(route);},route===key?'active':'');node.dataset.focusKey='route/'+route;return node;
    }));
    replaceContent(this.customBody,body);this.refresh();
    if(hadFocus&&!this.node.contains(document.activeElement)){
      const restored=[...this.content.querySelectorAll('[data-focus-key]')].find(node=>node.dataset.focusKey===focusKey&&!node.closest('[hidden]'));
      if(restored)restored.focus({preventScroll:true});else this.focusDetails();
    }
  }
  dispose(){this.motion.dispose();this.node.remove();}
}
