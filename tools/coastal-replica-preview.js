import {t,setLocale} from '../src/shared/text.js';
import {applyDocumentText} from '../src/shared/documentText.js';
import {ReplicaStage} from '../src/ui/replica/ReplicaStage.js';
import {dialoguePilot,replicaAssetManifest,replicaViews,replicaLayers} from '../content/ui/coastal-replica.js';
import {dialogueReplica,dialogueAssetManifest} from '../content/ui/coastal-dialogue.js';

applyDocumentText();
const params = new URLSearchParams(location.search);
const version = params.get('version')??'2';
if (!['1','2'].includes(version)) throw new RangeError('Unsupported replica version');
const scene = version==='1'?dialoguePilot:dialogueReplica;
const assetManifest = version==='1'?replicaAssetManifest:dialogueAssetManifest;
const views = version==='1'?replicaViews:[...replicaViews,{id:'props',textKey:'ui.replica.stage2.props'}];
if (version==='2') {
  document.title=t('ui.replica.stage2.title');
  document.querySelector('h1').textContent=t('ui.replica.stage2.heading');
  document.querySelector('.replica-authoring > p').textContent=t('ui.replica.stage2.note');
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
  document.body.classList.add('replica-capture');
  window.scrollTo(0,0);
  stage.captureLocked = true;
  stage.selectedChoice = scene.selectedChoice;
  stage.layer = '';
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
    kind:version==='1'?'stage1-layer-pilot':'stage2-dialogue-reconstruction',version,variant:view,selectedChoice:stage.selectedChoice,
    assets:stage.manifest.assets.map(asset => ({id:asset.id,sha256:asset.sha256})),
    layers:replicaLayers.map(layer => layer.id),fonts:[...document.fonts].filter(face=>face.status==='loaded').map(face=>face.family),
    typography:stage.measureTypography()};
}};
ready.then(() => {
  const view = params.get('view') ?? 'stage';
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
