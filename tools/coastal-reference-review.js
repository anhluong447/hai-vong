import {canvas, compare, decode, digest} from './reference-comparison.js';

const specRoot = '../docs/ui-specs/coastal-replica/';
const referenceRoot = '../docs/ui-concepts/coastal-editorial-v1/';
const colors = {'reconstruct':'#ffcf54', 'vector-mask':'#00e4cf', 'new-pose':'#ff75c1', 'text':'#87bcff'};
const node = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const captureMode = params.get('capture');
let layout, fixtures, copy, hashes, active, result, revision = 0;
const references = new Map();

async function json(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json();
}

function svg(tag, attributes = {}, parent = node('marks')) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  parent.append(element);
  return element;
}

function detail() {
  const layer = active.layers.find(item => item.id === node('layer').value);
  node('detail').textContent = JSON.stringify(layer ? {
    ...layer, text:layer.textGroup ? fixtures.screens[active.id].groups[layer.textGroup] : null,
    catalog:layer.textGroup ? Object.fromEntries(fixtures.screens[active.id].groups[layer.textGroup].plannedTextKeys.map(key => [key,fixtures.catalog[key]])) : null,
    measurement:layout.measurement,
  } : {lighting:active.lighting, anchors:active.anchors, contours:active.contours, notes:active.notes}, null, 2);
  drawMarks();
}

function drawMarks() {
  node('marks').replaceChildren();
  node('marks').hidden = !node('annotations').checked;
  // SVG hidden property is not consistently reflected as display:none.
  node('marks').style.display = node('annotations').checked ? '' : 'none';
  active.layers.forEach((layer, index) => {
    const [x,y,width,height] = layer.bounds;
    const group = svg('g', {class:`region ${node('layer').value === layer.id ? 'selected' : ''}`});
    svg('title', {}, group).textContent = `${index+1}: ${layer.id} / ${layer.label}`;
    svg('rect', {x,y,width,height,fill:'none',stroke:colors[layer.method],'stroke-width':2}, group);
    svg('rect', {x,y,width:33,height:24,fill:'#142f38',class:'badge'}, group);
    svg('text', {x:x+3,y:y+18,fill:colors[layer.method],'font-size':17,'font-family':'monospace'}, group).textContent = index+1;
    group.addEventListener('click', () => { node('layer').value = layer.id; detail(); });
  });
  for (const contour of active.contours) {
    svg('polyline', {points:contour.points.map(p => p.join(',')).join(' '),fill:'none',stroke:'#fff','stroke-width':3,'stroke-dasharray':'8 5','pointer-events':'none'});
  }
  for (const anchor of active.anchors) {
    for (const [x,y] of anchor.points ?? [anchor.point]) svg('path', {d:`M${x-8},${y}h16 M${x},${y-8}v16`,stroke:'#ff4444','stroke-width':3,'pointer-events':'none'});
  }
}

async function reference(screen) {
  if (!references.has(screen.id)) references.set(screen.id, (async () => {
    const response = await fetch(referenceRoot + screen.reference);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${screen.reference}`);
    const blob = await response.blob();
    document.documentElement.dataset.referenceState = 'decoding';
    const image = await decode(blob);
    document.documentElement.dataset.referenceState = 'hashing';
    if (image.width !== layout.stage.width || image.height !== layout.stage.height) throw new RangeError('reference-size-mismatch');
    const sha256 = await digest(blob);
    document.documentElement.dataset.referenceState = 'ready';
    return {blob,image,sha256};
  })());
  return references.get(screen.id);
}

function displayComparison() {
  const mode = node('mode').value;
  const surface = node('comparison');
  surface.hidden = !result || mode === 'reference';
  if (!surface.hidden) {
    const context = surface.getContext('2d');
    context.clearRect(0,0,surface.width,surface.height);
    context.drawImage(result[mode],0,0);
  }
}

function clearComparison() {
  result = null;
  node('candidate').value = '';
  node('mode').value = 'reference';
  node('status').textContent = copy.unmeasured;
  node('report').textContent = '';
  for (const id of ['overlay','difference','report']) node(`export-${id}`).disabled = true;
  displayComparison();
}

async function selectScreen(id) {
  const current = ++revision;
  active = layout.screens.find(screen => screen.id === id);
  if (!active) throw new RangeError(`unknown-screen:${id}`);
  node('screen').value = id;
  node('layer').replaceChildren(new Option(copy.allLayers, ''), ...active.layers.map((layer,index) => new Option(`${index+1}. ${layer.label} (${layer.id})`, layer.id)));
  const imageNode = node('reference-image');
  const source = referenceRoot + active.reference;
  const svgImageLoaded = imageNode.dataset.loaded === source ? Promise.resolve() : new Promise((resolve,reject) => {
    imageNode.addEventListener('load', () => { imageNode.dataset.loaded = imageNode.getAttribute('href'); resolve(); }, {once:true});
    imageNode.addEventListener('error', () => reject(new Error('svg-image-load-failed')), {once:true});
  });
  imageNode.setAttribute('href', source);
  node('stage-title').textContent = active.title;
  clearComparison();
  detail();
  await Promise.all([reference(active), svgImageLoaded]);
  document.documentElement.dataset.referenceState = 'fonts';
  if (current !== revision) return;
  await document.fonts.ready;
}

async function compareBlob(blob) {
  const current = ++revision;
  const screen = active;
  if (blob.type !== 'image/png') throw new TypeError('png-required');
  const header = new Uint8Array(await blob.slice(0,24).arrayBuffer());
  const signature = [137,80,78,71,13,10,26,10];
  if (header.length < 24 || !signature.every((value,index) => header[index] === value) || String.fromCharCode(...header.slice(12,16)) !== 'IHDR') throw new TypeError('png-required');
  const dimensions = new DataView(header.buffer);
  if (dimensions.getUint32(16) !== layout.stage.width || dimensions.getUint32(20) !== layout.stage.height) throw new RangeError('native-size-mismatch');
  const candidate = await decode(blob);
  const original = await reference(screen);
  const comparison = compare(original.image, candidate, layout.stage.width, layout.stage.height, screen.layers);
  comparison.report.provenance = {
    screen:screen.id, reference:screen.reference, referenceSHA256:original.sha256,
    candidateSHA256:await digest(blob), ...hashes,
    fixture:fixtures.capture, fixtureScreen:fixtures.screens[screen.id],
    captureVerification:'caller must verify viewport, state, fonts and motion; upload alone does not prove fixture compliance',
  };
  if (current !== revision) return comparison;
  result = comparison;
  node('mode').value = 'overlay';
  node('annotations').checked = false;
  drawMarks();
  displayComparison();
  node('report').textContent = JSON.stringify(result.report, null, 2);
  node('status').textContent = copy.diagnostic;
  for (const id of ['overlay','difference','report']) node(`export-${id}`).disabled = false;
  return comparison;
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const api = {selectScreen, compareBlob, canvas, get layout(){return layout;}, get fixtures(){return fixtures;}, get result(){return result;}};
window.referenceReview = api;
api.ready = (async () => {
  document.documentElement.dataset.captureState = 'loading-specs';
  [layout, fixtures, copy] = await Promise.all([json(specRoot+'layouts.json'), json(specRoot+'fixtures.json'), json('./coastal-reference-review-copy.json')]);
  document.documentElement.dataset.captureState = 'hashing-specs';
  hashes = {layoutSemanticSHA256:await digest(JSON.stringify(layout)), fixtureSemanticSHA256:await digest(JSON.stringify(fixtures))};
  document.title = copy.title;
  for (const element of document.querySelectorAll('[data-copy]')) element.textContent = copy[element.dataset.copy];
  node('screen').replaceChildren(...layout.screens.map(screen => new Option(screen.title, screen.id)));
  node('screen').addEventListener('change', () => selectScreen(node('screen').value).catch(showError));
  node('layer').addEventListener('change', detail);
  node('annotations').addEventListener('change', drawMarks);
  node('mode').addEventListener('change', displayComparison);
  node('candidate').addEventListener('change', async () => {
    const blob = node('candidate').files[0];
    if (!blob) return;
    try { await compareBlob(blob); } catch(error) { clearComparison(); showError(error); }
  });
  node('stage').addEventListener('pointermove', event => {
    // SVG bounding client rect may include letterboxing; use its screen matrix.
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(node('stage').getScreenCTM().inverse());
    node('coordinates').textContent = `${copy.coordinates}: ${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
  });
  for (const mode of ['overlay','difference']) node(`export-${mode}`).addEventListener('click', () => result?.[mode].toBlob(blob => download(blob, `${active.id}-${mode}.png`), 'image/png'));
  node('export-report').addEventListener('click', () => { if (result) download(new Blob([JSON.stringify(result.report,null,2)+'\n'],{type:'application/json'}), `${active.id}-comparison.json`); });
  if (captureMode) {
    if (!['reference','layout'].includes(captureMode)) throw new RangeError(`unknown-capture-mode:${captureMode}`);
    document.body.classList.add('capture');
    node('annotations').checked = captureMode === 'layout';
  }
  document.documentElement.dataset.captureState = 'loading-reference';
  await selectScreen(params.get('screen') ?? 'dialogue');
  document.documentElement.dataset.captureState = 'ready';
  document.documentElement.dataset.captureViewport = `${innerWidth}x${innerHeight}@${devicePixelRatio}`;
  document.documentElement.dataset.captureReady = 'true';
  return api;
})();

function showError(error) {
  console.error(error);
  node('status').textContent = error.message === 'native-size-mismatch' ? copy.sizeMismatch : error.message === 'png-required' ? copy.pngOnly : copy.readError;
}
api.ready.catch(error => { console.error(error); document.documentElement.dataset.captureReady = 'error'; if (copy) showError(error); });
