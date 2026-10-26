/** Manual visual-review capture using the existing isolated browser harness. */
import {test, assert, equal, params} from '/tests/harness.js';

let frame;
const load = async () => {
  if (frame) return frame;
  frame = document.createElement('iframe');
  frame.style.cssText = 'width:1328px;height:1200px;border:0';
  frame.src = '/docs/art-direction/review-a/index.html';
  document.body.append(frame);
  await new Promise((resolve,reject) => {
    const deadline = performance.now() + 20000;
    const poll = () => {
      const page = frame.contentDocument;
      if (page?.documentElement.dataset.reviewReady === 'true') return resolve();
      if (page?.documentElement.dataset.reviewReady === 'error' || performance.now() > deadline) return reject(new Error('review.capture.not-ready'));
      setTimeout(poll,50);
    };
    poll();
  });
  return frame;
};

for (const kind of ['composition','density','scale']) test('G1 Review A ' + kind + ' board capture', async () => {
  const viewer = await load(), board = viewer.contentDocument.getElementById(kind + '-board');
  equal(board.width,kind === 'composition' ? 960 : 1280); equal(board.height,kind === 'composition' ? 540 : 936);
  const context = board.getContext('2d');
  assert(context.getImageData(500,200,1,1).data[3] === 255,'board should be opaque');
  const images = [...viewer.contentDocument.querySelectorAll('canvas')];
  equal(images.length,3);
  const encoded = board.toDataURL('image/png').split(',')[1];
  return {encodedLength:encoded.length,...(params.get('capture') === kind ? {screenshot:encoded} : {}),purpose:'Art-review rendering only; no gameplay acceptance',sourceRows:3};
});
