/** One source-sized RGBA PNG: RG = octahedral normal, B = depth, A = matte.
 * The data is linear numeric texture data; save losslessly as PNG.
 */
export function packDepthNormalMap(depth, normal, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
    || depth.length !== width * height * 4 || normal.length !== depth.length) {
    throw new Error('Depth and normal dimensions must match.');
  }
  const pixels = new Uint8ClampedArray(depth.length);
  for (let i = 0; i < depth.length; i += 4) {
    const alpha = Math.min(depth[i + 3], normal[i + 3]);
    if (!alpha) continue;
    const nx = normal[i] / 127.5 - 1, ny = normal[i + 1] / 127.5 - 1;
    const nz = Math.max(0, normal[i + 2] / 127.5 - 1);
    const sum = Math.max(Math.abs(nx) + Math.abs(ny) + nz, 1e-8);
    pixels[i] = (nx / sum * .5 + .5) * 255;
    pixels[i + 1] = (ny / sum * .5 + .5) * 255;
    pixels[i + 2] = depth[i] * .2126 + depth[i + 1] * .7152 + depth[i + 2] * .0722;
    pixels[i + 3] = alpha;
  }
  return { pixels, width, height };
}

/** The shader's range-gated nine-point plane fit, prepared once in the worker.
 * Use a fixed source filter (density 24), so live tile density cannot regenerate
 * the image or change the camera. Positive Y follows Mapshroom normal assets.
 */
export function renderDepthTilesNormals(depth, matte, width, height) {
  if (depth.length !== width * height * 4 || matte.length !== depth.length) throw new Error('Depth dimensions do not match.');
  const radius = Math.max(3, Math.min(10, height * .22 / 24));
  const pixels = new Uint8ClampedArray(depth.length), heights = new Float32Array(width * height), alpha = new Float32Array(width * height);
  for (let i = 0; i < heights.length; i++) {
    const at = i * 4;
    heights[i] = (depth[at] * .2126 + depth[at + 1] * .7152 + depth[at + 2] * .0722) / 255;
    alpha[i] = Math.min(depth[at + 3], matte[at + 3]) / 255;
  }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const sample = (data, x, y) => {
    x = Math.max(0, Math.min(width - 1, x)); y = Math.max(0, Math.min(height - 1, y));
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1), tx = x - x0, ty = y - y0;
    return (data[y0 * width + x0] * (1 - tx) + data[y0 * width + x1] * tx) * (1 - ty)
      + (data[y1 * width + x0] * (1 - tx) + data[y1 * width + x1] * tx) * ty;
  };
  const strength = Math.max(width, height) * .15 / radius;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x, at = i * 4; if (!alpha[i]) continue;
    const center = heights[i]; let sw = 0, sx = 0, sy = 0, sd = 0, sxx = 0, syy = 0, sxy = 0, sxd = 0, syd = 0;
    for (let qy = -1; qy <= 1; qy++) for (let qx = -1; qx <= 1; qx++) {
      const px = x + qx * radius, py = y + qy * radius;
      // The half-texel boundary matches the original normalized UV checks.
      if (px < -.5 || py < -.5 || px > width - .5 || py > height - .5) continue;
      const d = qx === 0 && qy === 0 ? center : sample(heights, px, py);
      const a = qx === 0 && qy === 0 ? alpha[i] : sample(alpha, px, py);
      if (a * smooth(.018, .065, d) < .5) continue;
      const w = (qx === 0 ? 2 : 1) * (qy === 0 ? 2 : 1) * (1 - smooth(.025, .065, Math.abs(d - center)));
      sw += w; sx += w * qx; sy += w * qy; sd += w * d;
      sxx += w * qx * qx; syy += w * qy * qy; sxy += w * qx * qy; sxd += w * qx * d; syd += w * qy * d;
    }
    let gx = 0, gy = 0;
    if (sw > .001) {
      const mx = sx / sw, my = sy / sw, md = sd / sw, xx = sxx - sx * mx, yy = syy - sy * my, xy = sxy - sx * my;
      const xd = sxd - sx * md, yd = syd - sy * md, determinant = xx * yy - xy * xy;
      if (determinant > .001) { gx = (yy * xd - xy * yd) / determinant; gy = (xx * yd - xy * xd) / determinant; }
    }
    const nx = -gx * strength, ny = gy * strength, length = Math.hypot(nx, ny, 1);
    pixels[at] = (nx / length * .5 + .5) * 255;
    pixels[at + 1] = (ny / length * .5 + .5) * 255;
    pixels[at + 2] = (1 / length * .5 + .5) * 255;
    pixels[at + 3] = Math.round(alpha[i] * 255);
  }
  return pixels;
}
