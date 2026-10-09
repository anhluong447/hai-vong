import {t,setLocale} from '../src/shared/text.js';
import {applyDocumentText} from '../src/shared/documentText.js';
import {ReplicaStage} from '../src/ui/replica/ReplicaStage.js';
import {dialoguePilot,replicaAssetManifest,replicaViews,replicaLayers} from '../content/ui/coastal-replica.js';

applyDocumentText();
const viewSelect = document.getElementById('view');
const layerSelect = document.getElementById('layer');
viewSelect.replaceChildren(...replicaViews.map(view => new Option(t(view.textKey),view.id)));
layerSelect.replaceChildren(new Option(t('ui.replica.preview.allLayers'),''),...replicaLayers.map(layer => new Option(t(layer.textKey),layer.id)));
const stage = new ReplicaStage(document.getElementById('pilot'),{onAction:action => {
  if (action.type === 'choose') {
    const choice = dialoguePilot.choices.find(item => item.id === action.id);
    document.getElementById('selection').textContent = t('ui.replica.preview.action',{choice:t(choice.textKey)});
  }
}});
const ready = stage.load(new URL('../'+replicaAssetManifest,import.meta.url));
const showView = view => { viewSelect.value=view; stage.setView(view); };
viewSelect.addEventListener('change',() => showView(viewSelect.value));
layerSelect.addEventListener('change',() => stage.setLayer(layerSelect.value));
window.addEventListener('pagehide',() => stage.dispose(),{once:true});

window.replicaPreview = {stage,ready,showView};
window.replicaCapture = {async prepare(request) {
  await ready;
  if (request.screen !== dialoguePilot.id || request.capture.motionTimeMs !== 0 || request.capture.randomSeed !== 0 || request.capture.animationState !== 'settled-static') throw new RangeError('Unsupported Stage 1 capture fixture');
  setLocale(request.capture.locale);
  for (const region of dialoguePilot.text) if (request.catalog[region.key] !== t(region.key)) throw new RangeError(`Capture text differs: ${region.key}`);
  for (const choice of dialoguePilot.choices) if (request.catalog[choice.textKey] !== t(choice.textKey)) throw new RangeError(`Capture choice differs: ${choice.id}`);
  if (request.fixture.selectedChoice && request.fixture.selectedChoice !== dialoguePilot.selectedChoice) throw new RangeError('Capture selection differs');
  const view = request.variant ?? 'stage';
  if (!replicaViews.some(item => item.id === view)) throw new RangeError(`Unsupported Stage 1 view: ${view}`);
  document.body.classList.add('replica-capture');
  window.scrollTo(0,0);
  stage.captureLocked = true;
  stage.selectedChoice = dialoguePilot.selectedChoice;
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
    kind:'stage1-layer-pilot',variant:view,selectedChoice:stage.selectedChoice,
    assets:stage.manifest.assets.map(asset => ({id:asset.id,sha256:asset.sha256})),
    layers:replicaLayers.map(layer => layer.id),fonts:[...document.fonts].filter(face=>face.status==='loaded').map(face=>face.family),
    typography:stage.measureTypography()};
}};
ready.then(() => {
  const params = new URLSearchParams(location.search);
  const view = params.get('view') ?? 'stage';
  if (!replicaViews.some(item => item.id === view)) throw new RangeError(`Unsupported Stage 1 view: ${view}`);
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
