import {t} from '../../shared/text.js';
import {dialoguePilot, replicaDesign, replicaFonts, replicaLayers} from '../../../content/ui/coastal-replica.js';

const namespace = 'http://www.w3.org/2000/svg';
const projectRoot = new URL('../../../',import.meta.url);
let nextStageId = 0;

function element(tag, attributes, parent) {
  const node = document.createElementNS(namespace,tag);
  for (const [key,value] of Object.entries(attributes)) if (value !== undefined) node.setAttribute(key,value);
  parent?.append(node);
  return node;
}

export class ReplicaStage {
  constructor(host,{scene=dialoguePilot,onAction=()=>{}}={}) {
    this.host = host;
    this.scene = scene;
    this.onAction = onAction;
    this.selectedChoice = scene.selectedChoice;
    this.view = 'stage';
    this.layer = '';
    this.disposed = false;
    this.captureLocked = false;
    this.abort = new AbortController();
    this.assets = new Map();
    this.deskClipId = `replica-desk-${++nextStageId}`;
  }

  async load(manifestURL) {
    const response = await fetch(manifestURL,{signal:this.abort.signal});
    if (!response.ok) throw new Error(`Replica asset pack HTTP ${response.status}`);
    const manifest = await response.json();
    if (manifest.version !== 1 || manifest.stage[0] !== replicaDesign.width || manifest.stage[1] !== replicaDesign.height) throw new RangeError('Unsupported replica asset pack');
    const entries = await Promise.all(manifest.assets.map(async asset => {
      if (!asset.file.startsWith('assets/ui/coastal-replica/v1/exports/')) throw new RangeError(`Invalid replica resource: ${asset.id}`);
      const url = new URL(asset.file,projectRoot).href;
      const image = new Image();
      await new Promise((resolve,reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`Replica image failed: ${asset.id}`));
        image.src = url;
      });
      await image.decode();
      if (image.naturalWidth !== asset.size[0] || image.naturalHeight !== asset.size[1]) throw new RangeError(`Replica image size mismatch: ${asset.id}`);
      return [asset.id,{...asset,url,image}];
    }));
    const probe = t('ui.replica.preview.typeGlyphs');
    await Promise.all(replicaFonts.map(async font => {
      const faces = await document.fonts.load(`${font.weight} ${font.size}px "${font.family}"`,probe);
      if (!faces.length || faces.some(face => face.status !== 'loaded')) throw new Error(`Replica font missing: ${font.family}`);
    }));
    await document.fonts.ready;
    if (this.disposed) return;
    this.assets = new Map(entries);
    this.manifest = manifest;
    this.render();
  }

  image(parent,id,bounds,{visibleRegistration=false}={}) {
    const asset = this.assets.get(id);
    if (!asset) throw new RangeError(`Unknown replica asset: ${id}`);
    const [x,y,width,height] = bounds;
    if (visibleRegistration) {
      const frame = element('svg',{x,y,width,height,viewBox:asset.visibleBounds.join(' '),preserveAspectRatio:'xMidYMin slice',overflow:'hidden','data-asset-id':id},parent);
      const [nativeWidth,nativeHeight] = asset.size;
      return element('image',{x:0,y:0,width:nativeWidth,height:nativeHeight,href:asset.url},frame);
    }
    return element('image',{x,y,width,height,href:asset.url,preserveAspectRatio:'none','data-asset-id':id},parent);
  }

  keyedText(parent,key,{x,y,size=24,weight=400,family='Source Serif 4',fill='#092d40',spacing=0,...extra}) {
    const node = element('text',{x,y,fill,'font-size':size,'font-weight':weight,'letter-spacing':spacing,...extra},parent);
    node.style.fontFamily = `"${family}", serif`;
    node.textContent = t(key);
    node.dataset.textKey = key;
    return node;
  }

  icon(parent,id,bounds) {
    const [x,y,width,height] = bounds;
    const node = element('svg',{x,y,width,height,viewBox:'0 0 32 32','aria-hidden':'true'},parent);
    element('use',{href:this.assets.get('material.icons').url+'#'+id},node);
    return node;
  }

  render() {
    if (this.disposed || !this.assets.size) return;
    const svg = element('svg',{class:'replica-stage',viewBox:`0 0 ${replicaDesign.width} ${replicaDesign.height}`,preserveAspectRatio:'xMidYMid meet',role:'group','aria-label':t('ui.replica.preview.stageAria')});
    this.svg = svg;
    this.groups = new Map();
    if (this.view === 'stage') this.drawStage(svg);
    else if (this.view.startsWith('material-')) this.drawContact(svg,this.view === 'material-dark');
    else if (this.view === 'typography') this.drawTypography(svg);
    else throw new RangeError(`Unknown replica view: ${this.view}`);
    this.host.replaceChildren(svg);
    this.applyLayer();
  }

  drawStage(svg) {
    const defs = element('defs',{},svg);
    const clip = element('clipPath',{id:this.deskClipId,clipPathUnits:'userSpaceOnUse'},defs);
    // Reuse only the clean pilot environment, masked to the front desk strip.
    // The paper/wave draw above this; no reference UI is embedded in the plate.
    element('path',{d:'M0 600 Q350 596 690 604 Q1180 615 1672 601 V941 H0Z'},clip);
    for (const layer of replicaLayers) this.groups.set(layer.id,element('g',{'data-layer':layer.id},svg));
    const layer = id => this.groups.get(id);
    this.image(layer('scene'),'pilot.newsroom',[0,0,1672,941]);
    for (const portrait of this.scene.portraits) this.image(layer('portraits'),portrait.asset,portrait.bounds,{visibleRegistration:true});
    const desk = element('g',{'clip-path':`url(#${this.deskClipId})`},layer('portraits'));
    this.image(desk,'pilot.newsroom',[0,0,1672,941]);
    this.image(layer('wave'),'material.dialogue-wave',this.scene.paperBounds);
    this.image(layer('paper'),'material.dialogue-paper',this.scene.paperBounds);
    const print = layer('print');
    this.image(print,'pilot.harbor-print',[0,746,770,195],{visibleRegistration:true});
    this.image(print,'material.insignia',[91,689,73,53]);
    this.image(print,'material.insignia',[1481,79,150,33]);
    this.image(print,'material.date-paper',[36,30,247,115]);
    this.image(print,'material.sun-seal',[44,40,87,127]);
    for (const rule of this.scene.rules) element('line',{...rule,stroke:'#126477','stroke-width':1.25},print);
    this.icon(print,'chevron',[496,715,32,22]);
    for (const choice of this.scene.choices) this.drawChoice(print,choice);
    const textLayer = layer('text');
    textLayer.classList.add('reading-copy');
    for (const text of this.scene.text) this.keyedText(textLayer,text.key,{...text,'data-region':text.id});
    for (const choice of this.scene.choices) {
      const [x,y] = choice.baseline;
      this.keyedText(textLayer,choice.textKey,{x,y,size:22,weight:600,'data-choice-copy':choice.id});
    }
    this.icon(textLayer,'return',[1295,877,28,28]);
    const next = element('g',{class:'continue',role:'button',tabindex:0,'aria-label':t('ui.replica.preview.continueAria'),'aria-disabled':String(this.captureLocked)},print);
    element('rect',{x:1208,y:866,width:124,height:43,fill:'transparent'},next);
    element('rect',{x:1208,y:866,width:124,height:43,fill:'none',stroke:'#087185','stroke-width':2,class:'focus-ring'},next);
    const activate = () => { if (!this.captureLocked && !this.disposed) this.onAction({type:'continue'}); };
    next.addEventListener('click',activate);
    next.addEventListener('keydown',event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();activate();} });
    for (const foreground of this.scene.foreground) this.image(layer('foreground'),foreground.asset,foreground.bounds,foreground);
  }

  drawChoice(parent,choice) {
    const [x,y,width,height] = choice.bounds;
    const selected = this.selectedChoice === choice.id;
    const group = element('g',{class:'choice',role:'button',tabindex:0,'data-choice-id':choice.id,
      'aria-label':t(choice.textKey),'aria-pressed':String(selected),'aria-disabled':String(this.captureLocked)},parent);
    this.image(group,selected?'material.choice-gold':'material.choice-plain',choice.bounds).style.filter = 'drop-shadow(0 2px 2px #07273845)';
    this.icon(group,choice.icon,[x+29,y+16,28,28]);
    if (selected) this.icon(group,'chevron',[x+width-40,y+15,25,29]);
    element('rect',{x:x-3,y:y-3,width:width+6,height:height+6,rx:4,fill:'none',stroke:'#f9edbe','stroke-width':3,class:'focus-ring'},group);
    group.addEventListener('click',() => this.choose(choice.id));
    group.addEventListener('keydown',event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();this.choose(choice.id);}
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const index = this.scene.choices.findIndex(item => item.id === choice.id);
        const offset = event.key === 'ArrowDown' ? 1 : -1;
        const next = this.scene.choices[(index+offset+this.scene.choices.length)%this.scene.choices.length];
        this.svg.querySelector(`[data-choice-id="${next.id}"]`).focus();
      }
    });
  }

  choose(id) {
    if (this.disposed || this.captureLocked) return;
    if (!this.scene.choices.some(choice => choice.id === id)) throw new RangeError(`Unknown replica choice: ${id}`);
    this.selectedChoice = id;
    const focused = this.svg.contains(document.activeElement);
    this.render();
    if (focused) this.svg.querySelector(`[data-choice-id="${id}"]`)?.focus();
    this.onAction({type:'choose',id});
  }

  nativePoint(clientX,clientY) {
    const matrix = this.svg.getScreenCTM();
    if (!matrix) throw new Error('Replica stage is detached');
    const point = new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());
    return [point.x,point.y];
  }

  hitTest(clientX,clientY) {
    const [x,y] = this.nativePoint(clientX,clientY);
    return this.scene.choices.find(choice => {
      const [left,top,width,height] = choice.bounds;
      return x >= left && x <= left+width && y >= top && y <= top+height;
    })?.id ?? null;
  }

  measureTypography() {
    return [...this.svg.querySelectorAll('text[data-text-key]')].map(node => {
      const box = node.getBBox();
      const style = getComputedStyle(node);
      return {key:node.dataset.textKey,region:node.dataset.region ?? node.dataset.choiceCopy ?? null,
        bounds:[box.x,box.y,box.width,box.height],family:style.fontFamily,size:style.fontSize,weight:style.fontWeight};
    });
  }

  setView(view) { this.view = view; this.render(); }
  setLayer(layer) {
    if (layer && !replicaLayers.some(item => item.id === layer)) throw new RangeError(`Unknown replica layer: ${layer}`);
    this.layer = layer;
    this.applyLayer();
  }
  applyLayer() {
    for (const [id,group] of this.groups ?? []) group.style.display = !this.layer || this.layer === id ? '' : 'none';
  }

  drawContact(svg,dark) {
    const paper = dark ? '#0e2630' : '#eee8dc';
    const ink = dark ? '#e9e4d7' : '#123d49';
    element('rect',{width:1672,height:941,fill:paper},svg);
    this.keyedText(svg,'ui.replica.preview.materialHeading',{x:40,y:60,size:40,fill:ink,weight:600});
    for (const item of this.scene.contact) {
      const [x,y,width,height] = item.bounds;
      const board = element('g',{},svg);
      element('rect',{x:x-4,y:y-4,width:width+8,height:height+8,fill:dark?'#29424a':'#fffaf0',stroke:dark?'#4c696e':'#cfccc0'},board);
      this.image(board,item.asset,item.bounds,{visibleRegistration:item.visibleRegistration});
      this.keyedText(svg,item.key,{x,y:y+height+28,size:18,fill:ink});
    }
    this.keyedText(svg,'ui.replica.preview.nativeCrop',{x:860,y:773,size:18,fill:ink});
    const crop = element('svg',{x:860,y:792,width:364,height:109,viewBox:'0 16 364 109',overflow:'hidden'},svg);
    this.image(crop,'material.dialogue-wave',[0,0,1672,342]);
    this.image(crop,'material.dialogue-paper',[0,0,1672,342]);
    this.keyedText(svg,'ui.replica.preview.scaleCrop',{x:1278,y:773,size:18,fill:ink});
    const scaled = element('svg',{x:1278,y:792,width:330,height:109,viewBox:'0 16 660 218',overflow:'hidden'},svg);
    this.image(scaled,'material.dialogue-wave',[0,0,1672,342]);
    this.image(scaled,'material.dialogue-paper',[0,0,1672,342]);
  }

  drawTypography(svg) {
    element('rect',{width:1672,height:941,fill:'#f6f0e3'},svg);
    this.keyedText(svg,'ui.replica.preview.typeHeading',{x:55,y:75,size:36,weight:600});
    this.keyedText(svg,'ui.replica.dialogue.brand.1',{x:55,y:208,size:100,weight:500,family:'Cormorant Garamond'});
    this.image(svg,'material.insignia',[460,125,132,88]);
    this.keyedText(svg,'ui.replica.preview.typeHeadingSample',{x:55,y:305,size:60,weight:600});
    this.keyedText(svg,'ui.replica.preview.typeBody',{x:55,y:404,size:32,weight:600});
    this.keyedText(svg,'ui.replica.preview.typeNumbers',{x:55,y:480,size:31,weight:500});
    const handwritten = this.keyedText(svg,'ui.replica.preview.typeHandwriting',{x:1090,y:280,size:40,family:'Dancing Script',fill:'#126477'});
    handwritten.replaceChildren();
    for (const [index,line] of t('ui.replica.preview.typeHandwriting').split('\n').entries()) element('tspan',{x:1090,dy:index?58:0},handwritten).textContent = line;
    const glyphs = t('ui.replica.preview.typeGlyphs').split('\n');
    glyphs.forEach((line,index) => {
      const node = element('text',{x:55,y:575+index*34,'font-size':25,fill:'#174551','data-glyph-probe':index},svg);
      node.style.fontFamily = '"Source Serif 4", serif';
      node.textContent = line;
    });
    this.image(svg,'material.icons',[990,558,576,96]);
    this.image(svg,'material.date-paper',[1100,696,247,115]);
    this.image(svg,'material.sun-seal',[1108,706,87,127]);
    this.keyedText(svg,'ui.replica.dialogue.date.1',{x:1185,y:740,size:25,weight:500});
    this.keyedText(svg,'ui.replica.dialogue.date.2',{x:1185,y:779,size:18,weight:500});
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    this.svg?.remove();
    this.assets.clear();
    this.onAction = ()=>{};
  }
}
