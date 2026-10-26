/** Review-only composition renderer. Does not load or modify a game session. */
const base = new URL('.', import.meta.url);
const loadImage = async path => {
  const image = new Image();
  image.src = new URL(path, base).href;
  await image.decode();
  return image;
};
const interpolate = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));

function extractFigures(image) {
  const source = document.createElement('canvas');
  source.width = image.naturalWidth; source.height = image.naturalHeight;
  const context = source.getContext('2d', {willReadFrequently:true});
  context.drawImage(image, 0, 0);
  const {data} = context.getImageData(0, 0, source.width, source.height);
  return [0, 1].map(side => {
    let left = source.width, right = -1, top = source.height, bottom = -1;
    const start = Math.floor(side * source.width / 2), end = Math.floor((side + 1) * source.width / 2);
    for (let y = 0; y < source.height; y++) for (let x = start; x < end; x++) {
      if (data[(y * source.width + x) * 4 + 3] < 128) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) throw new Error('review.figure.missing');
    return {image, x:left, y:top, width:right-left+1, height:bottom-top+1};
  });
}

function nativeFigure(figure, height) {
  const canvas = document.createElement('canvas');
  canvas.height = Math.round(height);
  canvas.width = Math.max(1, Math.round(figure.width * canvas.height / figure.height));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.drawImage(figure.image, figure.x, figure.y, figure.width, figure.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawScene(context, config, background, figures, density, height) {
  const {room,actors} = config;
  context.imageSmoothingEnabled = true;
  context.drawImage(background, 0, 0, room.width, room.height);
  context.imageSmoothingEnabled = false;
  figures.get(density).forEach((figure, actorIndex) => {
    const actor = actors[actorIndex], native = nativeFigure(figure, density * actor.relativeHeight);
    const h = height * actor.relativeHeight, w = native.width * h / native.height;
    context.drawImage(native, Math.round(actor.x - w / 2), Math.round(room.baseline - h), Math.round(w), Math.round(h));
  });
}

function drawBoard(canvas, config, background, figures, kind) {
  const {board, labels} = config;
  const options = kind === 'density' ? config.densities : config.heights;
  canvas.width = board.width; canvas.height = board.rowHeight * options.length;
  const context = canvas.getContext('2d');
  context.fillStyle = board.backgroundColor; context.fillRect(0, 0, canvas.width, canvas.height);
  options.forEach((option, index) => {
    const rowTop = index * board.rowHeight, density = kind === 'density' ? option.value : 192;
    const height = kind === 'density' ? 136 : option.value;
    context.fillStyle = board.labelColor; context.font = board.font;
    context.fillText(interpolate(kind === 'density' ? labels.densityRow : labels.scaleRow, {density,height,letter:option.letter}), 20, rowTop + 27);
    context.save();
    context.beginPath(); context.rect(0, rowTop + board.headerHeight, board.width, board.rowHeight - board.headerHeight); context.clip();
    context.translate(0, rowTop + board.headerHeight - board.cropTop);
    drawScene(context,config,background,figures,density,height);
    context.restore();
  });
}

export const ready = (async () => {
  const response = await fetch(new URL('review.json', base));
  if (!response.ok) throw new Error('review.config.load');
  const config = await response.json(), {labels} = config;
  for (const [id,key] of [['eyebrow','eyebrow'],['title','title'],['description','description'],['composition-title','compositionTitle'],['density-title','densityTitle'],['scale-title','scaleTitle'],['limitations','limitations']]) document.getElementById(id).textContent = labels[key];
  const status = document.getElementById('status'); status.textContent = labels.loading;
  for (const [id,key] of [['density','densityLink'],['scale','scaleLink']]) {
    const link = document.createElement('a'); link.href = '#' + id; link.textContent = labels[key]; document.getElementById('navigation').append(link);
  }
  try {
    const paths = [config.background,...config.densities.map(item => item.image)];
    const images = await Promise.all(paths.map(loadImage));
    const figures = new Map(config.densities.map((entry,index) => [entry.value,extractFigures(images[index + 1])]));
    const composition = document.getElementById('composition-board');
    composition.width = config.viewport.width; composition.height = config.viewport.height;
    composition.setAttribute('role','img'); composition.setAttribute('aria-label',labels.compositionAlt);
    const sceneContext = composition.getContext('2d');
    sceneContext.translate(-config.viewport.cameraX,0);
    drawScene(sceneContext,config,images[0],figures,192,136);
    for (const kind of ['density','scale']) {
      const canvas = document.getElementById(kind + '-board');
      canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',labels[kind + 'Alt']);
      drawBoard(canvas,config,images[0],figures,kind);
    }
    status.textContent = labels.ready;
    document.documentElement.dataset.reviewReady = 'true';
    return {config,figures};
  } catch (error) {status.textContent = labels.error; document.documentElement.dataset.reviewReady = 'error'; throw error;}
})();
