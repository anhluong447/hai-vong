import {element as el} from '../dom.js';
const ns='http://www.w3.org/2000/svg';
/** Repeated paths meet at the same height/tangent; translating a period is seamless. */
export function waveLayer() {
  const root=el('div',{class:'coastal-waves','aria-hidden':'true'});
  for(let layer=0;layer<3;layer++){
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 2400 180');svg.setAttribute('preserveAspectRatio','none');
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d','M0 90 C200 10 400 10 600 90 S1000 170 1200 90 C1400 10 1600 10 1800 90 S2200 170 2400 90 V180 H0 Z');
    svg.append(path);root.append(svg);
  }
  return root;
}
export function paperSurface(children=[],className='') {return el('section',{class:`coastal-paper ${className}`},children);}

/** Retain user choices, scroll and focus through a state-driven panel update. */
export function replaceContent(node,children) {
  const fields=new Map([...node.querySelectorAll('select[name],textarea[name],input[name]')].map(field=>[field.name,{value:field.value,checked:field.checked}]));
  const active=document.activeElement,focusName=node.contains(active)?active.name:null;
  const scroll=node.scrollTop;
  node.replaceChildren(...children);
  for(const field of node.querySelectorAll('select[name],textarea[name],input[name]')){
    const previous=fields.get(field.name);if(!previous)continue;
    if(field.tagName!=='SELECT'||[...field.options].some(option=>option.value===previous.value))field.value=previous.value;
    if(field.type==='checkbox')field.checked=previous.checked;
    if(focusName&&field.name===focusName)field.focus({preventScroll:true});
  }
  node.scrollTop=scroll;
}
