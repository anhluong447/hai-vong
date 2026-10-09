import {t,setLocale} from '../src/shared/text.js';
import {applyDocumentText} from '../src/shared/documentText.js';
import {ReplicaStage} from '../src/ui/replica/ReplicaStage.js';
import {dialoguePilot,replicaAssetManifest,replicaViews,replicaLayers} from '../content/ui/coastal-replica.js';
import {dialogueReplica,dialogueAssetManifest} from '../content/ui/coastal-dialogue.js';
import {dialogueUi,dialogueUiManifest} from '../content/ui/coastal-dialogue-ui.js';

applyDocumentText();
const params = new URLSearchParams(location.search);
const version = params.get('version')??'3';
if (!['1','2','3'].includes(version)) throw new RangeError('Unsupported replica version');
const scene = {1:dialoguePilot,2:dialogueReplica,3:dialogueUi}[version];
const assetManifest = {1:replicaAssetManifest,2:dialogueAssetManifest,3:dialogueUiManifest}[version];
const views = scene.views??(version==='1'?replicaViews:[...replicaViews,{id:'props',textKey:'ui.replica.stage2.props'}]);
if (version!=='1') {
  document.title=t(`ui.replica.stage${version}.title`);
  document.querySelector('h1').textContent=t(`ui.replica.stage${version}.heading`);
  document.querySelector('.replica-authoring > p').textContent=t(`ui.replica.stage${version}.note`);
}
const viewSelect = document.getElementById('view');
const layerSelect = document.getElementById('layer');
viewSelect.replaceChildren(...views.map(view => new Option(t(view.textKey),view.id)));
layerSelect.replaceChildren(new Option(t('ui.replica.preview.allLayers'),''),...replicaLayers.map(layer => new Option(t(layer.textKey),layer.id)));
const stage = new ReplicaStage(document.getElementById('pilot'),{scene,onAction:action => {
  if (action.type === 'choose') {
    const choice = scene.choices.find(item => item.id === action.id);
    document.getElementById('selection').textContent = t('ui.replica.preview.action',{choice:t(choice.textKey)});
  }
}});
const ready = stage.load(new URL('../'+assetManifest,import.meta.url));
const presentationControls={};
if(version==='3') for(const [id,key,checked] of [['lighting','ui.replica.stage3.lighting',true],['logo','ui.replica.stage3.logo',false]]) {
  const label=document.createElement('label'),input=document.createElement('input');
  input.type='checkbox';input.checked=checked;input.id=id;
  label.append(input,document.createTextNode(t(key)));
  document.querySelector('.replica-controls').append(label);
  presentationControls[id]=input;
  input.addEventListener('change',()=>stage.setPresentation({[id]:input.checked}));
}
const showView = view => { viewSelect.value=view; stage.setView(view); };
viewSelect.addEventListener('change',() => showView(viewSelect.value));
layerSelect.addEventListener('change',() => stage.setLayer(layerSelect.value));
window.addEventListener('pagehide',() => stage.dispose(),{once:true});

window.replicaPreview = {stage,ready,showView};
window.replicaCapture = {async prepare(request) {
  await ready;
  if (request.screen !== scene.id || request.capture.motionTimeMs !== 0 || request.capture.randomSeed !== 0 || request.capture.animationState !== 'settled-static') throw new RangeError('Unsupported static replica capture fixture');
  setLocale(request.capture.locale);
  for (const region of [...scene.text,...scene.environmentText??[]]) if (request.catalog[region.key] !== t(region.key)) throw new RangeError(`Capture text differs: ${region.key}`);
  for (const choice of scene.choices) if (request.catalog[choice.textKey] !== t(choice.textKey)) throw new RangeError(`Capture choice differs: ${choice.id}`);
  if (request.fixture.selectedChoice && request.fixture.selectedChoice !== scene.selectedChoice) throw new RangeError('Capture selection differs');
  const view = request.variant ?? 'stage';
  if (!views.some(item => item.id === view)) throw new RangeError(`Unsupported replica view: ${view}`);
  const lighting=request.lighting??true,logo=request.logo??false;
  if(typeof lighting!=='boolean'||typeof logo!=='boolean')throw new TypeError('Invalid capture presentation');
  document.body.classList.add('replica-capture');
  window.scrollTo(0,0);
  stage.captureLocked = true;
  stage.selectedChoice = scene.selectedChoice;
  stage.layer = '';
  stage.lightingEnabled=lighting;stage.logoVisible=logo;
  if(version==='3') {presentationControls.lighting.checked=lighting;presentationControls.logo.checked=logo;}
  layerSelect.value = '';
  showView(view);
  await document.fonts.ready;
  // The same local art has already been loaded and decoded by ReplicaStage.
  // Confirm newly inserted SVG image nodes have finished their resource loads.
  await Promise.all([...stage.svg.querySelectorAll('image')].map(image => new Promise((resolve,reject) => {
    if (image.href.baseVal) {
      const check = new Image();
      check.onload = () => check.decode().then(resolve,reject);
      check.onerror = reject;
      check.src = image.href.baseVal;
    } else resolve();
  })));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  document.documentElement.dataset.captureReady = 'true';
  return {ready:true,screen:request.screen,clock:request.capture.clock,motionTimeMs:0,randomSeed:0,
    kind:{1:'stage1-layer-pilot',2:'stage2-dialogue-reconstruction',3:'stage3-ui-light-depth'}[version],version,variant:view,selectedChoice:stage.selectedChoice,
    lighting:stage.lightingEnabled,logo:stage.logoVisible,scope:scene.uiOnly?'fixed-ui':'historical-full-scene',
    comparisonMask:stage.manifest.comparisonMask??null,
    assets:stage.manifest.assets.map(asset => ({id:asset.id,sha256:asset.sha256})),
    layers:replicaLayers.map(layer => layer.id),fonts:[...document.fonts].filter(face=>face.status==='loaded').map(face=>face.family),
    typography:stage.measureTypography()};
}};
ready.then(() => {
  const view = params.get('view') ?? (version==='3'?'ui-dark':'stage');
  if (!views.some(item => item.id === view)) throw new RangeError(`Unsupported replica view: ${view}`);
  showView(view);
  document.documentElement.dataset.previewReady = 'true';
}).catch(error => {
  console.error(error);
  const notice = document.createElement('p');
  notice.className = 'replica-fault';
  notice.setAttribute('role','alert');
  notice.textContent = t('ui.replica.preview.error');
  document.getElementById('pilot').replaceChildren(notice);
  document.documentElement.dataset.previewReady = 'error';
});
