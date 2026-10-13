import {element as el,text} from '../dom.js';
import {t} from '../../shared/text.js';

function createSvg(htmlString) {
  const template = document.createElement('div');
  template.innerHTML = htmlString.trim();
  return template.firstElementChild;
}

const ICONS = {
  dateMark: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 28c4-4 8-4 12 0s8 4 12 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M14 22c3.5-3 7-3 10.5 0s7 3 10.5 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="14" r="4" fill="currentColor"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>',
  coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="7" rx="8" ry="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7v5c0 2.2 3.6 4 8 4s8-1.8 8-4V7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 12v5c0 2.2 3.6 4 8 4s8-1.8 8-4v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  bullet: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="2.8" fill="currentColor"/></svg>',
  locationPin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>',
  mapBook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5C10.5 3.5 8.5 3 6.5 3 4.5 3 2.5 3.5 1 4.5v15c1.5-1 3.5-1.5 5.5-1.5 2 0 4 .5 5.5 1.5 1.5-1 3.5-1.5 5.5-1.5 2 0 4 .5 5.5 1.5v-15c-1.5-1-3.5-1.5-5.5-1.5-2 0-4 .5-5.5 1.5zm-1 12.5c-1.3-.7-2.9-1-4.5-1-1.6 0-3.2.3-4.5 1V6.2c1.3-.7 2.9-1 4.5-1 1.6 0 3.2.3 4.5 1v10.8zm11 0c-1.3-.7-2.9-1-4.5-1-1.6 0-3.2.3-4.5 1V6.2c1.3-.7 2.9-1 4.5-1 1.6 0 3.2.3 4.5 1v10.8z" fill="currentColor"/></svg>',
  objectiveBackdrop: '<svg class="coastal-objective-backdrop" viewBox="0 0 342 240" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="coastalObjectiveGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#063c4b" stop-opacity="0.96"/><stop offset="100%" stop-color="#0a2636" stop-opacity="0.94"/></linearGradient></defs><path d="M0,0 L320,0 C324,50 324,80 304,136 C280,172 230,192 195,195 C117,196 68,212 42,216 C18,218 0,214 0,214 Z" fill="url(#coastalObjectiveGrad)"/><line x1="0" y1="0" x2="0" y2="220" stroke="#62d6d0" stroke-width="4"/></svg>',
  dateWash: '<svg class="coastal-date-wash" viewBox="0 0 420 160" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="coastalWashGrad" cx="15%" cy="20%" r="85%"><stop offset="0%" stop-color="#063c4b" stop-opacity="0.92"/><stop offset="55%" stop-color="#087f8c" stop-opacity="0.65"/><stop offset="100%" stop-color="#087f8c" stop-opacity="0"/></radialGradient></defs><path d="M0,0 L380,0 C360,40 330,75 280,105 C220,135 150,145 90,140 C40,135 0,110 0,90 Z" fill="url(#coastalWashGrad)"/></svg>'
};

export class CoastalHud {
  constructor({onMap,onMenu,onInteract} = {}) {
    this.handlers = {onMap,onMenu,onInteract};
    this.lastDate = null;
    this.lastEnergy = null;
    this.lastMoney = null;

    // 1. Date Seal (date-paper)
    this.dateDay = text('div',t('ui.replica.hud.date.1'),'coastal-date-day');
    this.datePhase = text('div',t('ui.replica.hud.date.2'),'coastal-date-phase');
    const markNode = el('div',{class:'coastal-date-mark'},createSvg(ICONS.dateMark));
    const copyNode = el('div',{class:'coastal-date-copy'},[this.dateDay,this.datePhase]);
    this.datePaper = el('div',{class:'coastal-date-paper'},[markNode,copyNode]);
    this.datePaper.addEventListener('animationend',()=>this.datePaper.classList.remove('impact'));
    this.dateContainer = el('div',{class:'coastal-hud-date-container'},[
      createSvg(ICONS.dateWash),
      this.datePaper
    ]);

    // 2. Resource Ribbon (resource-ribbon)
    this.energyLabel = text('span','','coastal-energy-text');
    this.dots = [0,1,2,3].map(()=>el('div',{class:'coastal-energy-dot'}));
    this.dotsContainer = el('div',{class:'coastal-energy-dots'},this.dots);
    this.moneyLabel = text('span','','coastal-money-text');

    const energyCluster = el('div',{class:'coastal-energy-cluster'},[
      el('div',{class:'coastal-energy-icon'},createSvg(ICONS.lightning)),
      this.energyLabel,
      this.dotsContainer
    ]);
    const divider = el('div',{class:'coastal-resource-divider'});
    const moneyCluster = el('div',{class:'coastal-money-cluster'},[
      el('div',{class:'coastal-money-icon'},createSvg(ICONS.coin)),
      this.moneyLabel
    ]);

    this.resourceRibbon = el('div',{class:'coastal-hud-resource-ribbon'},[
      el('div',{class:'coastal-resource-inner'},[energyCluster,divider,moneyCluster])
    ]);
    this.resourceRibbon.addEventListener('animationend',()=>this.resourceRibbon.classList.remove('flash'));

    // 3. Objective Surface (objective-surface)
    this.objectiveTitle = text('span',t('ui.replica.hud.objective.1'),'coastal-objective-title');
    this.objectiveHighlight = el('div',{class:'coastal-objective-highlight'},[this.objectiveTitle]);
    this.objectiveCopy = text('div','','coastal-objective-copy');
    this.objectiveBullet = el('div',{class:'coastal-objective-bullet'},createSvg(ICONS.bullet));
    this.objectiveBody = el('div',{class:'coastal-objective-body'},[this.objectiveBullet,this.objectiveCopy]);

    this.objectiveSurface = el('div',{class:'coastal-hud-objective'},[
      el('div',{class:'coastal-objective-ink'},[
        createSvg(ICONS.objectiveBackdrop),
        this.objectiveHighlight,
        this.objectiveBody
      ])
    ]);

    // 4. Interaction Prompt (interaction-paper)
    this.interactionBubble = el('button',{
      type:'button',
      class:'coastal-interaction-bubble',
      onClick:()=>this.handlers.onInteract?.()
    },[
      text('span',t('ui.replica.hud.interaction.1'),'coastal-interaction-label')
    ]);
    this.interactionPrompt = el('div',{class:'coastal-interaction-prompt'},[this.interactionBubble]);
    this.interactionPrompt.hidden=true;

    // Default anchor (over NPC Vân in reference scene [936, 392])
    this.setPromptAnchor(936,392);

    // 5. Bottom Bar
    this.locationCopy = text('div',t('ui.replica.hud.location.1'),'coastal-location-copy');
    const locationRule = el('div',{class:'coastal-location-rule'});
    const locationHeader = el('div',{class:'coastal-location-header'},[
      el('div',{class:'coastal-location-pin'},createSvg(ICONS.locationPin)),
      this.locationCopy
    ]);
    const locationGroup = el('div',{class:'coastal-location-group'},[locationHeader,locationRule]);

    const mapBtn = el('button',{
      type:'button',
      class:'coastal-control-item interactive',
      onClick:()=>this.handlers.onMap?.()
    },[
      el('div',{class:'coastal-control-icon'},createSvg(ICONS.mapBook)),
      text('span',t('ui.replica.hud.controls.1'),'coastal-control-label')
    ]);
    const controlsDivider = el('div',{class:'coastal-controls-divider'});
    const escBtn = el('button',{
      type:'button',
      class:'coastal-control-item interactive',
      onClick:()=>this.handlers.onMenu?.()
    },[
      text('span',t('ui.replica.hud.controls.2'),'coastal-esc-keycap'),
      text('span',t('ui.replica.hud.controls.3'),'coastal-control-label')
    ]);
    const controlsGroup = el('div',{class:'coastal-controls-group'},[mapBtn,controlsDivider,escBtn]);

    this.bottomBar = el('div',{class:'coastal-hud-bottom'},[locationGroup,controlsGroup]);

    // Root HUD node
    this.node = el('div',{class:'coastal-hud'},[
      this.dateContainer,
      this.resourceRibbon,
      this.objectiveSurface,
      this.interactionPrompt,
      this.bottomBar
    ]);
  }

  update({date,day,weekday,phase,energy,maxEnergy=4,money,location,objective,prompt,promptVisible=true,targetPosition}={}) {
    if(day!==undefined||date!==undefined||weekday!==undefined){
      this.setDate({day,date,weekday,phase});
    }
    if(energy!==undefined||money!==undefined){
      this.setResources({energy,maxEnergy,money});
    }
    if(objective!==undefined){
      this.setObjective(objective);
    }
    if(location!==undefined){
      this.setLocation(location);
    }
    if(prompt!==undefined||promptVisible!==undefined||targetPosition!==undefined){
      this.setPrompt({label:prompt,visible:promptVisible,position:targetPosition});
    }
  }

  setDate({day,date,weekday,phase,animate=true}={}) {
    const dayLabel = weekday||(date?String(date):null);
    if(dayLabel&&this.dateDay.textContent!==dayLabel){
      this.dateDay.textContent=dayLabel;
      if(animate)this.triggerDateStamp();
    }
    if(phase&&this.datePhase.textContent!==phase){
      this.datePhase.textContent=phase;
    }
    if(day!==undefined&&day!==this.lastDate){
      this.lastDate=day;
      if(animate)this.triggerDateStamp();
    }
  }

  triggerDateStamp() {
    this.datePaper.classList.remove('impact');
    void this.datePaper.offsetWidth;
    this.datePaper.classList.add('impact');
  }

  setResources({energy,maxEnergy=4,money,animate=true}={}) {
    let changed = false;
    if(energy!==undefined){
      const current = Math.max(0,Number(energy));
      if(this.dots.length!==maxEnergy){
        this.dots=Array.from({length:Math.max(0,Math.floor(maxEnergy))},()=>el('div',{class:'coastal-energy-dot'}));
        this.dotsContainer.replaceChildren(...this.dots);
      }
      this.energyLabel.textContent=t('ui.replica.hud.resources.1',{current,max:maxEnergy});
      this.dots.forEach((dot,index)=>{
        dot.classList.toggle('active',index<current);
      });
      if(this.lastEnergy!==null&&this.lastEnergy!==current)changed=true;
      this.lastEnergy=current;
    }
    if(money!==undefined){
      const moneyText=t('ui.replica.hud.resources.2',{money:Number(money).toLocaleString('vi-VN')});
      if(this.moneyLabel.textContent!==moneyText){
        this.moneyLabel.textContent=moneyText;
        if(this.lastMoney!==null)changed=true;
      }
      this.lastMoney=money;
    }
    if(changed&&animate){
      this.triggerResourceFlash();
    }
  }

  triggerResourceFlash() {
    this.resourceRibbon.classList.remove('flash');
    void this.resourceRibbon.offsetWidth;
    this.resourceRibbon.classList.add('flash');
  }

  setObjective(textValue) {
    if(!textValue){
      this.objectiveSurface.hidden=true;
      return;
    }
    this.objectiveSurface.hidden=false;
    this.objectiveCopy.textContent=textValue;
  }

  setLocation(locationName) {
    if(!locationName)return;
    this.locationCopy.textContent=locationName;
  }

  setPrompt({label,visible=true,position}={}) {
    this.interactionPrompt.hidden=!visible;
    if(label){
      this.interactionBubble.querySelector('.coastal-interaction-label').textContent=label;
    }
    if(position){
      this.setPromptAnchor(position.x,position.y);
    }
  }

  setPromptAnchor(x,y) {
    if(typeof x==='number')this.interactionPrompt.style.left=`${x}px`;
    else if(x)this.interactionPrompt.style.left=x;
    if(typeof y==='number')this.interactionPrompt.style.top=`${y}px`;
    else if(y)this.interactionPrompt.style.top=y;
  }

  setReducedMotion(reduced) {
    this.node.dataset.motion=reduced?'reduced':'standard';
  }

  dispose() {
    this.node.remove();
  }
}
