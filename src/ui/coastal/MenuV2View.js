import {element as el,text,button} from '../dom.js';
import {t} from '../../shared/text.js';
import {tabs,groups,branches} from '../../../content/ui/menu-v2.js';
import {MenuV2Effects} from './MenuV2Effects.js';
import {MenuV2Keyboard} from './MenuV2Keyboard.js';
import {itemMedia,slotMedia,branchColors} from '../../../content/ui/menu-v2-media.js';

const asset=file=>new URL(`../../../assets/${file}`,import.meta.url).href;
const label=id=>t(`menu.v2.${id}`);
const image=(src,className)=>el('img',{src,alt:'',class:className});
const paper=(...children)=>el('article',{class:'mv-paper'},children);
const paths={cases:'M7 3H21L29 11V33H7Z M21 3V11H29 M12 17H24 M12 23H24 M12 28H20',
  skills:'M18 7V15L7 28 M18 15L29 28 M18 15V29 M18 2A5 5 0 1 0 18 12A5 5 0 1 0 18 2 M7 25A4 4 0 1 0 7 33A4 4 0 1 0 7 25 M29 25A4 4 0 1 0 29 33A4 4 0 1 0 29 25',
  equipment:'M12 4L4 10L8 18L12 16V32H26V16L30 18L34 10L26 4Q19 12 12 4Z',
  team:'M11 3A6 6 0 1 0 11 15A6 6 0 1 0 11 3 M27 5A5 5 0 1 0 27 15A5 5 0 1 0 27 5 M2 33V25Q2 17 11 17Q20 17 20 25V33 M23 19Q34 17 34 26V33',
  map:'M3 8L13 3L24 8L34 3V29L24 34L13 29L3 34Z M13 3V29 M24 8V34',
  settings:'M18 4V10 M18 26V32 M4 18H10 M26 18H32 M8 8L12 12 M24 24L28 28 M8 28L12 24 M24 12L28 8 M18 9A9 9 0 1 0 18 27A9 9 0 1 0 18 9',
  interview:'M4 5H32V25H16L8 32V25H4Z M10 12H26 M10 18H22',investigation:'M15 3A12 12 0 1 0 15 27A12 12 0 1 0 15 3 M24 24L34 34',
  photo:'M3 10H10L13 5H23L26 10H33V31H3Z M18 13A7 7 0 1 0 18 27A7 7 0 1 0 18 13',
  documents:'M7 3H29V33H7Z M12 11H24 M12 18H24 M12 25H24',
  empathy:'M18 33V8Q10 2 3 6V30Q11 26 18 33Q25 26 33 30V6Q25 2 18 8',
  courage:'M18 3L31 8V20Q30 29 18 35Q6 29 5 20V8Z M11 18L16 23L25 12',
  check:'M8 19L15 26L30 10',
  bulb:'M12 24C12 20 7 19 7 13A11 11 0 0 1 29 13C29 19 24 20 24 24Z M13 29H23 M15 34H21 M18 2V0 M3 5L0 2 M33 5L36 2',
  head:'M5 23Q4 8 19 8Q31 8 31 23 M3 24Q19 19 35 25L29 29H4Z',
  hand:'M14 2H24V10M14 28V36H24V28 M19 9A10 10 0 1 0 19 29A10 10 0 1 0 19 9 M19 13V20L24 23',
  feet:'M5 6H15L19 21L32 25Q35 26 34 32H4V23Z M4 28H34',
  accessory1:'M8 3H29V34H8Z M5 9H11 M5 17H11 M5 25H11 M15 11H24',
  accessory2:'M10 3H28V34H10Z M14 8H24V16H14Z M19 21A4 4 0 1 0 19 29A4 4 0 1 0 19 21',
  lock:'M9 15V10A9 9 0 0 1 27 10V15 M6 15H30V34H6Z M18 23V28',
  heart:'M18 33C10 27 2 22 2 13C2 2 14 0 18 9C22 0 34 2 34 13C34 22 26 27 18 33Z',
  save:'M5 3H27L33 9V34H5Z M11 3V14H26V3 M11 34V22H27V34',
  load:'M4 14H32V34H4Z M18 25V3 M10 11L18 3L26 11',
  sound:'M3 14H10L20 5V32L10 23H3Z M26 11Q34 18 26 26',
  resolution:'M3 4H33V27H3Z M18 27V34 M10 34H26',
  graphics:'M3 4H33V33H3Z M3 28L13 16L21 25L27 19L33 27 M25 10A3 3 0 1 0 25 16A3 3 0 1 0 25 10'};
function icon(id){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 38 38');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[id]||paths.documents);svg.append(path);return svg;}
function folioLabel(key,kind,mark){return el('h3',{class:`mv-folio-label mv-folio-${kind}`},[...(mark?[icon(mark)]:[]),text('span',label(key))]);}
function editorialIcon(id){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',id==='logo-waves'?'0 0 240 35':'0 0 40 40');svg.setAttribute('class','mv-editorial-icon');svg.setAttribute('aria-hidden','true');const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href',asset('ui/dossier-polish/editorial-icons.svg')+`#${id}`);svg.append(use);return svg;}
function itemArt(id,className=''){const media=itemMedia[id],svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 240 200');svg.setAttribute('class',`mv-item-art ${className}`);svg.setAttribute('aria-hidden','true');if(media){const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href',`${asset(media.file)}#${media.symbol}`);svg.append(use);}return svg;}
function region(node,id){node.dataset.menuRegion=id;node.setAttribute('tabindex','-1');return node;}
function decoratePaper(node){node.classList.add('mv-editorial-paper');return node;}
function waves(){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1672 941');svg.setAttribute('class','mv-waves');svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(svg.namespaceURI,'defs'),pattern=document.createElementNS(svg.namespaceURI,'pattern'),texture=document.createElementNS(svg.namespaceURI,'image');
  pattern.id='mv-wave-grain';pattern.setAttribute('patternUnits','userSpaceOnUse');pattern.setAttribute('width','560');pattern.setAttribute('height','560');
  texture.setAttribute('href',asset('ui/coastal/menu-case-paper.png'));texture.setAttribute('width','560');texture.setAttribute('height','560');texture.setAttribute('preserveAspectRatio','xMidYMid slice');pattern.append(texture);defs.append(pattern);svg.append(defs);
  ['side','side','side','bottom','bottom','bottom'].forEach((kind,i)=>{const path=document.createElementNS(svg.namespaceURI,'path');path.dataset.wave=kind;path.id=`mv-wave-${i}`;path.setAttribute('fill',['#147e90','#3da4ac','#062c40','#3ba1ab','#e5ddbf','#063247'][i]);svg.append(path);
    const grain=document.createElementNS(svg.namespaceURI,'use');grain.setAttribute('href',`#mv-wave-${i}`);grain.setAttribute('fill','url(#mv-wave-grain)');grain.style.fill='url(#mv-wave-grain)';grain.setAttribute('opacity','.13');grain.style.mixBlendMode='multiply';svg.append(grain);
  });return svg;}

export class MenuV2View{
  constructor(registry,{onClose=()=>{},onAction=()=>{},onTravel=()=>{},onSave=()=>{},onLoad=()=>{},onConfirm=(_,fn)=>fn(),debug=false}={}){
    Object.assign(this,{registry,onClose,onAction,onTravel,onSave,onLoad,onConfirm,debug});
    this.activeTab='cases';this.group='main';this.selected={};this.settingsPage='basic';
    this.nav=el('nav',{class:'game-menu-nav mv-nav',role:'tablist','aria-label':label('choose'),'aria-orientation':'vertical'});
    region(this.nav,'navigation');
    this.tabs=tabs.map(id=>{const node=button('',()=>this.selectTab(id),'mv-tab');node.dataset.tab=id;node.dataset.focusKey=`v2-tab/${id}`;node.id=`v2-tab-${id}`;node.setAttribute('role','tab');node.setAttribute('aria-controls','v2-content');node.append(editorialIcon(id),text('span',label(id)));this.nav.append(node);return node;});
    this.content=el('main',{class:'game-menu-content mv-content',id:'v2-content',role:'tabpanel',tabindex:'0'});
    this.resources=el('div',{class:'mv-resources'});this.status=text('p','','mv-status');this.status.setAttribute('role','status');
    const close=button('',()=>{if(!this.back())onClose();},'mv-close');close.append(text('kbd',t('ui.replica.menu.controls.3')),text('span',label('close')));
    this.node=el('section',{class:'game-menu menu-v2','aria-label':label('cases')},[
      image(asset('ui/coastal-menu-v2/scene.png'),'mv-scene'),image(asset('ui/dossier-polish/school-window.png'),'mv-dossier-scene'),el('div',{class:'mv-shade'}),image(asset('ui/coastal-menu-v2/foliage.png'),'mv-foliage mv-canopy'),image(asset('ui/dossier-polish/desk-cluster.png'),'mv-desk'),
      el('div',{class:'mv-light','aria-hidden':'true'}),el('div',{class:'mv-particles','aria-hidden':'true'}),waves(),image(asset('ui/dossier-polish/side-wave.png'),'mv-painted-wave mv-painted-side'),image(asset('ui/dossier-polish/harbor-wave.png'),'mv-painted-wave mv-painted-harbor'),
      el('div',{class:'mv-brand','data-asset-status':'logo-placeholder'},[text('strong',t('ui.replica.menu.brand.1')),image(asset('ui/dossier-polish/logo-stamp-placeholder.svg'),'mv-logo-placeholder'),editorialIcon('logo-waves')]),this.nav,this.resources,this.content,
      image(asset('ui/coastal-replica/v3/exports/foreground-left-v2.png'),'mv-foliage mv-flowers'),
      image(asset('ui/coastal-replica/v1/exports/harbor-print.svg'),'mv-harbor'),
      el('footer',{class:'mv-footer'},[this.status,text('span',t('menu.refinement.regions'),'mv-region-hint'),el('span',{class:'mv-keyhint'},[text('kbd',label('enter')),text('span',label('choose'))]),close])
    ]);
    this.effects=new MenuV2Effects(this.node);
    this.keyboard=new MenuV2Keyboard(this);
  }
  open(){this.selected={};this.group='main';this.selectTab('cases');}
  update(model){this.model=model;this.render();}
  selectTab(id){if(!tabs.includes(id))return;this.activeTab=id;this.picker=false;delete this.selected.item;this.assigning=false;this.render();}
  back(){
    if(this.picker){this.picker=false;delete this.selected.item;this.render();this.keyboard.focusKey(`slot/${this.selected.slot}`);return true;}
    if(this.assigning){this.assigning=false;this.render();return true;}
    if(this.activeTab==='skills'&&this.content.querySelector('.mv-skill-detail')?.contains(document.activeElement)){this.keyboard.focusKey(`skill/${this.selected.skill}`);return true;}
    return false;
  }
  openPicker(){this.picker=true;delete this.selected.item;this.render();const picker=this.content.querySelector('.mv-item-picker');this.keyboard.focus(picker?.querySelector('button:not(:disabled)')||this.content.querySelector('[data-focus-key="gear/cancel"]'));}
  act(action){this.onAction(action);}
  render(){
    if(!this.model)return;
    const token=document.activeElement?.dataset?.focusKey,owned=this.content.contains(document.activeElement),oldRegion=document.activeElement?.closest('[data-menu-region]')?.dataset.menuRegion;
    const treeScroll=this.content.querySelector('.mv-tree')?.scrollLeft||0;
    const oldRows=this.content.querySelector('.mv-quest-rows'),listScroll=oldRows?.scrollTop||0;
    const oldQuest=this.content.querySelector('.mv-quest-rows .active')?.dataset.focusKey,paperScroll=this.content.querySelector('.mv-dossier')?.scrollTop||0;
    this.node.dataset.tab=this.activeTab;
    this.tabs.forEach(n=>n.setAttribute('aria-selected',String(n.dataset.tab===this.activeTab)));
    this.content.setAttribute('aria-labelledby',`v2-tab-${this.activeTab}`);
    this.resources.replaceChildren(text('small',t('menu.dossier.date',{weekday:this.model.weekday||t('menu.v2.day',{day:this.model.day,phase:this.model.phaseText}),phase:this.model.phaseText})),
      el('div',{class:'mv-energy-row'},[editorialIcon('lightning'),text('strong',`${this.model.energy}/${this.model.maxEnergy}`)]),text('span',t('ui.replica.hud.resources.2',{money:this.model.money.toLocaleString('vi-VN')}),'mv-money'));
    const heading=text('h1',label(this.activeTab),'mv-heading');
    this.content.replaceChildren(el('div',{class:`mv-dossier-heading mv-title-${this.activeTab}`},[editorialIcon('gull'),heading,editorialIcon(this.activeTab==='cases'?'document-stamp':this.activeTab)]));
    ({cases:()=>this.renderCases(),skills:()=>this.renderSkills(),equipment:()=>this.renderEquipment(),team:()=>this.renderTeam(),map:()=>this.renderMap(),settings:()=>this.renderSettings()})[this.activeTab]();
    const tree=this.content.querySelector('.mv-tree');if(tree)tree.scrollLeft=treeScroll;
    const rows=this.content.querySelector('.mv-quest-rows');if(rows&&rows.dataset.group===oldRows?.dataset.group)rows.scrollTop=listScroll;
    const currentQuest=this.content.querySelector('.mv-quest-rows .active')?.dataset.focusKey;
    if(currentQuest&&currentQuest===oldQuest)this.content.querySelector('.mv-dossier').scrollTop=paperScroll;
    if(owned){const next=[...this.content.querySelectorAll('[data-focus-key]')].find(n=>n.dataset.focusKey===token&&!n.disabled);(next||this.content.querySelector(`[data-menu-region="${oldRegion}"]`)||this.content).focus({preventScroll:true});}
  }
  action(labelText,action,disabled=false){return button(labelText,()=>this.act(action),'mv-brush',disabled);}
  setNotice(value,{debug=false}={}){this.status.textContent=value;this.status.hidden=debug&&!this.debug;this.status.dataset.debug=String(debug);}
  pick(key,id){this.selected[key]=id;this.render();}
  stats(list){return el('dl',{class:'mv-stats'},list.flatMap(stat=>[el('dt',{},[icon(stat.id),text('span',stat.name)]),text('dd',String(stat.value))]));}
  renderCases(){
    const list=el('div',{class:'mv-quest-list'}),filter=el('div',{class:'mv-filters'});
    region(filter,'quest-filters');
    groups.forEach(id=>{const b=button(label(id),()=>{this.group=id;this.assigning=false;this.render();},this.group===id?'active':'');b.setAttribute('aria-pressed',String(this.group===id));b.dataset.focusKey=`group/${id}`;filter.append(b);});list.append(filter);
    const matches=this.model.quests.filter(q=>q.kind===this.group),current=matches.find(q=>q.id===this.selected.quest)||matches[0];
    const rows=el('div',{class:'mv-quest-rows','data-group':this.group});list.append(rows);
    region(rows,'quest-list');
    matches.forEach(q=>{const b=button('',()=>{this.assigning=false;this.pick('quest',q.id);},`mv-row ${q===current?'active':''}`);b.append(text('span',q.kind==='main'?'!':'','mv-quest-mark'),text('span',q.title),icon('cases'));b.dataset.kind=q.kind;b.dataset.focusKey=`quest/${q.id}`;b.setAttribute('title',q.title);b.setAttribute('aria-pressed',String(q===current));rows.append(b);});
    const detail=paper();detail.classList.add('mv-dossier');
    region(detail,'quest-detail');
    if(!current){detail.append(text('p',label('empty')));}else{
      const summary=el('div',{class:'mv-dossier-summary'},[text('h2',current.title),text('p',current.description,'mv-description')]);
      const intro=el('header',{class:'mv-dossier-intro'},summary);
      detail.dataset.hasPhoto=String(Boolean(current.photo));
      if(current.photo){const photo=el('img',{src:asset(current.photo.file),alt:current.photo.alt});intro.prepend(el('figure',{class:'mv-polaroid'},photo));}
      detail.append(intro,folioLabel('history','tape'));
      if(current.history.length){
        detail.append(el('ul',{class:'mv-history'},current.history.map(line=>{
          const item=typeof line==='string'?{text:line,completed:true}:line;
          const check=el('span',{class:'mv-history-check',role:'img','aria-label':item.completed?label('done'):t('menu.dossier.pending')},item.completed?icon('check'):[]);
          return el('li',{'data-completed':String(item.completed)},[check,text('span',item.text)]);
        })));
      }else detail.append(text('p',label('emptyHistory'),'mv-history-empty'));
      detail.append(el('div',{class:'mv-hint'},[folioLabel('hint','gold','bulb'),text('p',current.hint||'')]));
      const actions=el('div',{class:'mv-actions'});current.actions.forEach(a=>actions.append(this.action(a.label,a.action,a.disabled)));
      if(current.assignable)actions.append(button(label('assign'),()=>{this.assigning=!this.assigning;this.render();this.content.querySelector('.mv-assignment select')?.focus();},'mv-brush'));
      detail.append(actions);
      if(this.assigning&&current.assignable){
        const people=this.model.people.filter(p=>!p.busy),person=people.find(p=>p.id===this.selected.assignee)||people[0];
        const select=el('select',{'aria-label':label('team'),'data-focus-key':'assignee'},people.map(p=>el('option',{value:p.id},p.name)));
        if(person)select.value=person.id;select.addEventListener('change',()=>this.pick('assignee',select.value));
        detail.append(el('div',{class:'mv-assignment'},[select,text('p',person?t('menu.v2.fee',{fee:person.fee,day:person.finishDay}):label('unavailable')),
          button(t('menu.v2.assignConfirm',{cost:this.model.assignCost}),()=>this.onConfirm(t('menu.v2.fee',{fee:person.fee,day:person.finishDay}),()=>{this.assigning=false;this.act({type:'assign',id:current.id,person:person.id});}),'mv-brush',!person?.canAssign)]));
      }
    }
    const stack=el('div',{class:'mv-dossier-stack'},[
      el('div',{class:'mv-paper-back mv-paper-back-far','aria-hidden':'true'}),
      el('div',{class:'mv-paper-back mv-paper-back-near','aria-hidden':'true'}),detail
    ]);
    this.content.append(el('div',{class:'mv-cases-layout'},[list,stack]));
  }
  renderSkills(){
    const n=this.model.skills.find(n=>n.id===this.selected.skill)||this.model.skills[0];
    this.selected.skill=n.id;
    const board=region(el('div',{class:'mv-tree','data-focus-key':'tree'}),'skill-tree'),tree=el('div',{class:'mv-tree-inner'});
    branches.forEach(stat=>{const nodes=this.model.skills.filter(n=>n.stat===stat),column=el('section',{class:'mv-branch'},el('h3',{},[icon(stat),text('span',nodes[0]?.branch||'')]));
      column.style.setProperty('--branch-color',branchColors[stat]);
      nodes.forEach(node=>{const b=button('',()=>this.pick('skill',node.id),`mv-skill ${node.learned?'learned':''} ${node.locked?'locked':''} ${n.id===node.id?'selected':''}`);b.append(icon(node.locked?'lock':node.learned?'check':node.stat),text('span',String(node.rank)));b.setAttribute('aria-label',node.name);b.setAttribute('aria-pressed',String(n.id===node.id));b.dataset.focusKey=`skill/${node.id}`;b.dataset.skill=node.id;column.append(b);});tree.append(column);});board.append(tree);
    const learn=this.action(n.learned?label('learned'):t('menu.v2.learn',{cost:n.cost}),{type:'learnSkill',id:n.id},n.disabled);learn.dataset.focusKey=`skill/${n.id}/learn`;
    const detail=region(decoratePaper(paper(el('div',{class:'mv-skill-art'},[image(asset('ui/dossier-polish/field-photo.png'),'mv-skill-photo'),icon(n.stat)]),text('h2',n.name),text('p',n.description),
      text('p',n.locked?label('skillLocked'):n.learned?label('learned'):t('menu.refinement.skillCost',{cost:n.cost}),'mv-skill-state'),learn)),'skill-detail');detail.classList.add('mv-skill-detail');
    this.content.append(el('div',{class:'mv-skills-layout'},[board,detail,el('small',{class:'mv-tree-hint'},[text('span',label('skillKeys')),text('span',t('menu.refinement.skillAction'))])]));
    this.content.querySelector('.mv-dossier-heading').append(text('p',t('menu.v2.skillPoints',{points:this.model.points}),'mv-points-badge'));
  }
  renderEquipment(){
    const current=this.model.equipment.find(s=>s.id===this.selected.slot)||this.model.equipment[0],equipped=this.model.items.find(i=>i.id===current.item);
    this.selected.slot=current.id;
    const grid=region(el('div',{class:'mv-slots'}),'gear-slots');
    this.model.equipment.forEach(slot=>{const item=this.model.items.find(i=>i.id===slot.item),b=button('',()=>{this.picker=false;this.pick('slot',slot.id);},`mv-slot ${slot.id===current.id?'selected':''} ${item?'occupied':'unoccupied'}`);b.append(text('span',label(slot.id)),itemArt(item?.id||slotMedia[slot.id]),text('small',item?.name||label('emptySlot')));b.dataset.focusKey=`slot/${slot.id}`;b.dataset.slot=slot.id;b.setAttribute('aria-pressed',String(slot.id===current.id));grid.append(b);});
    const preview=(this.picker?this.model.items.find(i=>i.id===this.selected.item):null)||equipped;
    const detail=region(decoratePaper(paper(itemArt(preview?.id||slotMedia[current.id],'mv-item-hero'),text('h2',preview?.name||label(current.id)),text('p',preview?t('menu.refinement.itemBonus',{name:preview.statName,bonus:preview.bonus}):label('emptySlot'),'mv-item-bonus'))),'gear-detail');
    if(!this.picker)detail.append(folioLabel('stats','tape'),this.stats(this.model.stats));
    const change=button(label(this.picker?'cancel':'changeGear'),()=>{if(this.picker)this.back();else this.openPicker();},'mv-brush');change.dataset.focusKey=this.picker?'gear/cancel':'gear/change';
    detail.append(change);
    if(this.picker){const items=this.model.items.filter(i=>i.slot===(current.id.startsWith('accessory')?'accessory':current.id));
      const picker=el('div',{class:'mv-item-picker'});items.forEach(i=>{
        const comparisons=this.model.stats.filter(s=>s.id===i.stat||s.id===equipped?.stat).map(stat=>{
          const after=Math.round((stat.value-(equipped?.stat===stat.id?equipped.bonus:0)+(i.stat===stat.id?i.bonus:0))*10)/10;
          return t('menu.v2.compare',{name:stat.name,before:stat.value,after});
        });
        const used=this.model.equipment.some(s=>s.id!==current.id&&s.item===i.id);
        const choose=button('',()=>{this.picker=false;delete this.selected.item;this.act({type:'equip',slot:current.id,id:i.id});this.keyboard.focusKey(`slot/${current.id}`);},'mv-item',used||this.model.ended);
        choose.append(itemArt(i.id),el('span',{},[text('strong',i.name),...comparisons.map(line=>text('small',line))]));choose.dataset.item=i.id;choose.dataset.focusKey=`item/${i.id}`;
        choose.addEventListener('focus',()=>{this.selected.item=i.id;detail.querySelector('.mv-item-hero').replaceWith(itemArt(i.id,'mv-item-hero'));detail.querySelector('h2').textContent=i.name;detail.querySelector('.mv-item-bonus').textContent=t('menu.refinement.itemBonus',{name:i.statName,bonus:i.bonus});});picker.append(choose);
      });const unequip=button(label('unequip'),()=>{this.picker=false;delete this.selected.item;this.act({type:'equip',slot:current.id,id:null});this.keyboard.focusKey(`slot/${current.id}`);},'mv-brush',!current.item||this.model.ended);unequip.dataset.focusKey='gear/unequip';picker.append(unequip);if(!items.length)picker.prepend(text('p',label('empty')));detail.append(picker);}
    this.content.append(el('div',{class:'mv-equipment-layout'},[grid,detail]));
  }
  portrait(id,className){const src=this.registry?.characters?.[id]?.expressions?.neutral;return src?image(asset(`dialogue/${src}`),className):el('div',{class:className},icon('team'));}
  renderTeam(){
    const p=this.model.people.find(p=>p.id===this.selected.person)||this.model.people[0];if(!p){this.content.append(paper(text('p',label('empty'))));return;}
    this.selected.person=p.id;
    const strip=region(el('nav',{class:'mv-roster','aria-label':label('team')}),'team-roster');this.model.people.forEach(person=>{const b=button('',()=>this.pick('person',person.id),person.id===p.id?'active':'');b.append(this.portrait(person.id,'mv-thumb'),text('span',person.name.split(' ').at(-1)));b.dataset.person=person.id;b.dataset.focusKey=`person/${person.id}`;b.setAttribute('aria-label',person.name);strip.append(b);});
    const hearts=el('span',{class:'mv-hearts','aria-hidden':'true'},Array.from({length:5},(_,i)=>{const heart=icon('heart');heart.classList.add(i<Math.min(5,Math.floor(p.bond))?'filled':'unfilled');return heart;}));
    const detail=region(decoratePaper(paper(el('div',{class:'mv-postmark','aria-hidden':'true'},editorialIcon('document-stamp')),text('h2',p.name),text('p',p.nickname,'mv-nickname'),el('div',{class:'mv-bond'},[text('span',t('menu.v2.bond',{bond:p.bond})),hearts]),folioLabel('assignment','tape','cases'))),'team-detail');
    if(p.assignments.length)p.assignments.forEach(q=>{detail.append(button(q.title,()=>{this.group='general';this.selected.quest=q.id;this.selectTab('cases');},'mv-assignment-link'),text('small',q.progress));});else detail.append(text('p',label('noAssignment')));
    detail.append(folioLabel('skills','tape','skills'),this.stats(p.stats),folioLabel('biography','tape','empathy'),text('p',p.bio,'mv-biography'));
    this.content.append(el('div',{class:'mv-team-layout'},[strip,this.portrait(p.id,'mv-portrait'),detail]));
  }
  stepPlace(delta){const list=this.model.places,index=list.findIndex(p=>p.id===this.selected.place);this.selected.place=list[(Math.max(0,index)+delta+list.length)%list.length].id;this.render();this.content.querySelector(`[data-place="${this.selected.place}"]`)?.focus({preventScroll:true});}
  renderMap(){
    const current=this.model.places.find(p=>p.id===this.selected.place)||this.model.places[0];
    const map=region(el('div',{class:'mv-map','data-map-input':'true','data-focus-key':'map'}),'map');
    map.append(image(asset('ui/coastal-menu-v2/map.png'),'mv-map-art'));
    this.model.places.forEach((p,i)=>{const b=button('',()=>this.onTravel(p),`mv-pin ${p.id===current.id?'selected':''}`);
      b.append(text('span',String(i+1).padStart(2,'0'),'mv-pin-number'),text('span',p.name),text('span',p.marker?{quest:'!',bond:'\u2665',job:'\u25c9'}[p.marker]:''));
      b.style.left=`${p.x}%`;b.style.top=`${p.y}%`;b.dataset.place=p.id;b.dataset.focusKey=`place/${p.id}`;
      b.addEventListener('mouseenter',()=>{this.selected.place=p.id;this.content.querySelectorAll('.mv-pin').forEach(n=>n.classList.toggle('selected',n.dataset.place===p.id));this.travelLabel.textContent=p.name;});
      b.addEventListener('focus',()=>{this.selected.place=p.id;this.travelLabel.textContent=p.name;this.content.querySelectorAll('.mv-pin').forEach(n=>n.classList.toggle('selected',n.dataset.place===p.id));});map.append(b);
    });
    this.travelLabel=text('strong',current.name);
    const travel=region(el('div',{class:'mv-map-travel'},[this.travelLabel,button(label('travel'),()=>this.onTravel(this.model.places.find(p=>p.id===this.selected.place)||current),'mv-brush'),text('small',label('mapKeys'))]),'map-travel');
    this.content.append(map,travel,el('div',{class:'mv-map-legend'},[text('span',label('questMarker')),text('span',label('bondMarker')),text('span',label('jobMarker'))]));
  }
  renderSettings(){
    const options=region(el('div',{class:'mv-settings-options'}),'settings-categories');['basic','save','load'].forEach(id=>{const b=button('',()=>{this.settingsPage=id;this.render();},`mv-row ${this.settingsPage===id?'active':''}`);b.append(icon(id==='basic'?'settings':id),text('span',label(id)));b.dataset.setting=id;b.dataset.focusKey=`settings/${id}`;b.setAttribute('aria-pressed',String(this.settingsPage===id));options.append(b);});
    const detail=region(decoratePaper(paper(el('div',{class:'mv-postmark','aria-hidden':'true'},editorialIcon('document-stamp')),text('h2',label(this.settingsPage==='basic'?'basic':'saveSlot')))),'settings-detail');
    if(this.settingsPage==='basic'){
      ['sound','resolution','graphics'].forEach(id=>detail.append(el('div',{class:'mv-setting-row'},[el('span',{},[icon(id),text('span',label(id))]),button(label('placeholder'),()=>{},'',true)])));
      const input=el('input',{type:'checkbox',checked:this.effects.manualReduced||this.effects.media.matches,disabled:this.effects.media.matches});input.addEventListener('change',()=>this.effects.setReduced(input.checked));
      detail.append(el('label',{class:'mv-setting-row'},[text('span',t('ui.menu.reduceMotion')),input]));
    }else{
      const action=button(label(this.settingsPage),()=>this.settingsPage==='save'?this.onSave():this.onLoad(),'mv-brush');action.dataset.focusKey=`settings/${this.settingsPage}/action`;
      detail.append(text('p',t('menu.v2.day',{day:this.model.day,phase:this.model.phaseText})),action);
    }
    this.content.append(el('div',{class:'mv-settings-layout'},[options,detail]));
  }
  dispose(){this.effects.dispose();this.keyboard.dispose();this.node.remove();}
}
