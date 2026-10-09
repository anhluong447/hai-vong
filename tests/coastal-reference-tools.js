import {test, assert, runAll} from './harness.js';
import {canvas, compare, decode, nativePoint} from '../tools/reference-comparison.js';

const frame = document.getElementById('review');
const progress = document.createElement('p');
progress.id = 'progress';
document.getElementById('results').append(progress);
progress.textContent = 'Waiting for iframe load';
await new Promise(resolve => { if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow.referenceReview) resolve(); else frame.addEventListener('load',resolve,{once:true}); });
progress.textContent = 'Waiting for referenceReview.ready';
const api = await frame.contentWindow.referenceReview.ready;
progress.textContent = 'Registering tests';
const doc = frame.contentDocument;
const blobs = new Map();
async function reference(screen) {
  if (!blobs.has(screen.id)) blobs.set(screen.id, await (await fetch(`../docs/ui-concepts/coastal-editorial-v1/${screen.reference}`)).blob());
  return blobs.get(screen.id);
}
const png = surface => new Promise(resolve => surface.toBlob(resolve,'image/png'));
async function rejects(fn, pattern) {
  try { await fn(); } catch(error) { assert.ok(pattern.test(error.message),error.message); return; }
  throw new Error('Expected rejection');
}

test('Native capture has no authoring chrome and keeps the original plane', () => {
  assert.equal(doc.documentElement.dataset.captureReady,'true');
  assert.equal(doc.body.classList.contains('capture'),true);
  assert.equal(frame.contentWindow.getComputedStyle(doc.querySelector('header')).display,'none');
  const rect = doc.getElementById('stage').getBoundingClientRect();
  assert.equal(rect.width,1672);
  assert.equal(rect.height,941);
});

test('All text regions resolve to planned fixture keys; all layer IDs are unique', () => {
  let regions = 0;
  for (const screen of api.layout.screens) {
    assert.equal(new Set(screen.layers.map(l => l.id)).size,screen.layers.length);
    regions += screen.layers.length;
    for (const layer of screen.layers.filter(l => l.method === 'text')) {
      const group = api.fixtures.screens[screen.id].groups[layer.textGroup];
      assert.equal(group.region,layer.id);
      for (const key of group.plannedTextKeys) assert.ok(Object.hasOwn(api.fixtures.catalog,key));
    }
  }
  assert.equal(regions,169);
  assert.equal(Object.keys(api.fixtures.catalog).length,96);
});

for (const screen of api.layout.screens) {
  test(`Exact native self-comparison is zero: ${screen.id}`, async () => {
    await api.selectScreen(screen.id);
    assert.equal(doc.querySelectorAll('#marks g.region').length,screen.layers.length);
    const result = await api.compareBlob(await reference(screen));
    assert.equal(result.report.global.meanAbsoluteErrorRGBA,0);
    assert.equal(result.report.global.changedPixels,0);
    assert.equal(result.report.provenance.referenceSHA256,result.report.provenance.candidateSHA256);
    assert.equal(result.report.regions.length,screen.layers.length);
  });
}

test('Region selection preserves planned text metadata and visibility toggle', async () => {
  await api.selectScreen('dialogue');
  const selector = doc.getElementById('layer');
  selector.value = 'dialogue-line';
  selector.dispatchEvent(new frame.contentWindow.Event('change'));
  const detail = JSON.parse(doc.getElementById('detail').textContent);
  assert.equal(detail.text.entries[0].key,'ui.replica.dialogue.line.1');
  assert.equal(detail.catalog['ui.replica.dialogue.line.1'],api.fixtures.catalog['ui.replica.dialogue.line.1']);
  assert.equal(doc.querySelectorAll('#marks g.selected').length,1);
  const toggle = doc.getElementById('annotations');
  toggle.checked = false;
  toggle.dispatchEvent(new frame.contentWindow.Event('change'));
  assert.equal(doc.getElementById('marks').style.display,'none');
});

test('One changed native pixel is reported in the affected ROI and raw metrics', async () => {
  const screen = api.layout.screens[0];
  const original = await decode(await reference(screen));
  const candidate = canvas(1672,941);
  const context = candidate.getContext('2d');
  context.drawImage(original,0,0);
  const before = context.getImageData(234,800,1,1);
  const delta = before.data[0] === 255 ? -1 : 1;
  before.data[0] += delta;
  context.putImageData(before,234,800);
  const result = compare(original,candidate,1672,941,screen.layers);
  assert.equal(result.report.global.changedPixels,1);
  assert.near(result.report.global.meanAbsoluteErrorRGBA,1/(1672*941*4));
  assert.equal(result.report.regions.find(r => r.id === 'dialogue-line').changedPixels,1);
  assert.equal(result.report.regions.find(r => r.id === 'brand-text').changedPixels,0);
  const pixel = result.difference.getContext('2d').getImageData(234,800,1,1).data;
  assert.equal(pixel[0],4);
  assert.equal(pixel[3],255);
});

test('Wrong-size PNG is rejected rather than resized or cropped', async () => {
  const wrong = canvas(836,470);
  await rejects(async () => api.compareBlob(await png(wrong)),/native-size-mismatch/);
});

test('Non-PNG input is rejected', async () => {
  await rejects(() => api.compareBlob(new Blob(['invalid'],{type:'text/plain'})),/png-required/);
  await rejects(() => api.compareBlob(new Blob(['invalid'],{type:'image/png'})),/png-required/);
});

test('Uniform-scale coordinate conversion returns the native point', () => {
  const point = nativePoint({left:40,top:25,width:836,height:470.5},458,260.25,1672,941);
  assert.near(point[0],836);
  assert.near(point[1],470.5);
});

test('Exports retain native dimensions and include fixture/hash provenance', async () => {
  await api.selectScreen('menu');
  const result = await api.compareBlob(await reference(api.layout.screens[1]));
  for (const mode of ['overlay','difference']) {
    const image = await decode(await png(result[mode]));
    assert.equal(image.width,1672);
    assert.equal(image.height,941);
    assert.equal(doc.getElementById(`export-${mode}`).disabled,false);
  }
  assert.equal(result.report.provenance.fixture.deviceScaleFactor,1);
  assert.equal(result.report.provenance.layoutSemanticSHA256.length,64);
  assert.equal(result.report.role,'diagnostic-only; does not certify G2');
});

test('Saved DevTools control capture has the actual native viewport and zero image diff', async () => {
  const root = '../docs/ui-specs/coastal-replica/verification/reference-plane';
  const report = await (await fetch(`${root}.json`)).json();
  assert.equal(report.environment.viewport.join('x'),'1672x941');
  assert.equal(report.environment.deviceScaleFactor,1);
  assert.equal(report.environment.state.kind,'reference-tooling-proof');
  const captured = await decode(await (await fetch(`${root}.png`)).blob());
  const original = await decode(await reference(api.layout.screens[0]));
  const result = compare(original,captured,1672,941);
  assert.equal(result.report.global.changedPixels,0);
});

progress.textContent = 'Running tests';
const results = await runAll();
progress.textContent = 'Finished';
const output = document.getElementById('results');
const summary = document.createElement('p');
summary.className = results.every(result => result.ok) ? 'ok' : 'bad';
summary.textContent = `${results.filter(result => result.ok).length}/${results.length} passed`;
output.append(summary);
for (const result of results) {
  const entry = document.createElement('pre');
  entry.className = result.ok ? 'ok' : 'bad';
  entry.textContent = result.ok ? result.name : `${result.name}\n${result.error}`;
  output.append(entry);
}
