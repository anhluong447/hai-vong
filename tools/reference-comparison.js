// Authoring-only image diagnostics. Browser-decoded RGBA; no runtime imports.
export function nativePoint(rect, clientX, clientY, width, height) {
  return [(clientX - rect.left) * width / rect.width, (clientY - rect.top) * height / rect.height];
}

export async function digest(blob) {
  // Files may come from another same-origin window (authoring tests/iframes).
  const bytes = typeof blob?.arrayBuffer === 'function' ? await blob.arrayBuffer() : new TextEncoder().encode(blob);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function decode(blob) {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise((resolve,reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('image-load-failed'));
      image.src = url;
    });
    // Drawing at native size forces decoding before readiness is published.
    // Image.decode() alone can remain pending with headless virtual time.
    const decoded = canvas(image.naturalWidth,image.naturalHeight);
    decoded.getContext('2d').drawImage(image,0,0);
    return decoded;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function canvas(width, height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  return surface;
}

export function pixels(image, width, height) {
  const surface = canvas(width, height);
  const context = surface.getContext('2d', {willReadFrequently:true});
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
}

export function compare(reference, candidate, width, height, regions = []) {
  if (reference.width !== width || reference.height !== height || candidate.width !== width || candidate.height !== height) {
    throw new RangeError('native-size-mismatch');
  }
  const original = pixels(reference, width, height);
  const current = pixels(candidate, width, height);
  const diffSurface = canvas(width, height);
  const diffContext = diffSurface.getContext('2d');
  const diff = diffContext.createImageData(width, height);
  const stride = width + 1;
  const totals = new Float64Array(stride * (height + 1));
  const changes = new Float64Array(stride * (height + 1));
  let maxChannelError = 0;
  for (let y = 0; y < height; y += 1) {
    let rowTotal = 0;
    let rowChanged = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      let delta = 0;
      let largest = 0;
      for (let c = 0; c < 4; c += 1) {
        const value = Math.abs(original.data[pixel + c] - current.data[pixel + c]);
        delta += value;
        largest = Math.max(largest, value);
        if (c < 3) diff.data[pixel + c] = Math.min(255, value * 4);
      }
      // Alpha-only errors must remain visible in the diagnostic image.
      const alphaError = Math.abs(original.data[pixel + 3] - current.data[pixel + 3]);
      for (let c = 0; c < 3; c += 1) diff.data[pixel + c] = Math.max(diff.data[pixel + c], Math.min(255, alphaError * 4));
      diff.data[pixel + 3] = 255;
      rowTotal += delta;
      rowChanged += Number(largest > 0);
      maxChannelError = Math.max(maxChannelError, largest);
      const pos = (y + 1) * stride + x + 1;
      totals[pos] = totals[pos - stride] + rowTotal;
      changes[pos] = changes[pos - stride] + rowChanged;
    }
  }
  diffContext.putImageData(diff, 0, 0);
  const sum = (table, x, y, w, h) => table[(y+h)*stride+x+w] - table[y*stride+x+w] - table[(y+h)*stride+x] + table[y*stride+x];
  const metrics = (bounds) => {
    const [x, y, w, h] = bounds;
    if (![x,y,w,h].every(Number.isInteger) || x < 0 || y < 0 || w <= 0 || h <= 0 || x+w > width || y+h > height) throw new RangeError('region-out-of-bounds');
    const changedPixels = sum(changes, x, y, w, h);
    return {meanAbsoluteErrorRGBA:sum(totals, x, y, w, h) / (w*h*4), changedPixels, changedFraction:changedPixels / (w*h)};
  };
  const overlay = canvas(width, height);
  const overlayContext = overlay.getContext('2d');
  overlayContext.drawImage(reference, 0, 0);
  overlayContext.globalAlpha = 0.5;
  overlayContext.drawImage(candidate, 0, 0);
  overlayContext.globalAlpha = 1;
  return {
    overlay, difference:diffSurface,
    report:{
      width, height, colorSpace:'browser-decoded sRGB RGBA, 8 bits per channel',
      overlay:'reference plus candidate at opacity 0.5; source-over',
      difference:'RGB absolute difference multiplied by 4, clipped at 255; alpha error visible; output opaque',
      role:'diagnostic-only; does not certify G2',
      global:{...metrics([0,0,width,height]), maxChannelError},
      regions:regions.map(region => ({id:region.id, bounds:region.bounds, ...metrics(region.bounds)})),
    },
  };
}
