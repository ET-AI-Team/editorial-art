import sharp from 'sharp';

/** Image helpers on top of sharp. All pure functions of their input buffers. */

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

export async function imageInfo(buffer: Buffer): Promise<ImageInfo> {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height || !meta.format) throw new Error('not a readable image');
  return { width: meta.width, height: meta.height, format: meta.format };
}

/** Centre-crops to an aspect ratio when the image is off by more than `tolerance`. */
export async function cropToAspect(buffer: Buffer, aspect: number, tolerance = 0.02): Promise<Buffer> {
  const { width, height } = await imageInfo(buffer);
  const actual = width / height;
  if (Math.abs(actual - aspect) / aspect <= tolerance) return buffer;
  if (actual > aspect) {
    const w = Math.round(height * aspect);
    return sharp(buffer).extract({ left: Math.round((width - w) / 2), top: 0, width: w, height }).toBuffer();
  }
  const h = Math.round(width / aspect);
  return sharp(buffer).extract({ left: 0, top: Math.round((height - h) / 2), width, height: h }).toBuffer();
}

/** True when the image is close to one flat colour (a common failed-generation output). */
export async function isBlank(buffer: Buffer, minStdDev = 6): Promise<boolean> {
  const stats = await sharp(buffer).greyscale().stats();
  return (stats.channels[0]?.stdev ?? 0) < minStdDev;
}

/**
 * Difference hash: 64 bits from a 9x8 greyscale thumbnail. Two images with a Hamming distance
 * under about 8 look like the same picture.
 */
export async function dHash(buffer: Buffer): Promise<bigint> {
  const data = await sharp(buffer).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x] ?? 0;
      const right = data[y * 9 + x + 1] ?? 0;
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

export async function toWebp(buffer: Buffer, opts: { width?: number; height?: number; quality?: number } = {}): Promise<Buffer> {
  let img = sharp(buffer);
  if (opts.width || opts.height) img = img.resize(opts.width, opts.height, { fit: 'cover' });
  return img.webp({ quality: opts.quality ?? 82 }).toBuffer();
}

export async function toJpeg(buffer: Buffer, opts: { width?: number; height?: number; quality?: number; copyright?: string } = {}): Promise<Buffer> {
  let img = sharp(buffer).flatten({ background: '#ffffff' });
  if (opts.width || opts.height) img = img.resize(opts.width, opts.height, { fit: 'cover' });
  // withMetadata would copy everything; only the copyright line is written on purpose.
  if (opts.copyright) img = img.withExifMerge({ IFD0: { Copyright: opts.copyright } });
  return img.jpeg({ quality: opts.quality ?? 85, progressive: true, mozjpeg: true }).toBuffer();
}

/**
 * A test image for the fake providers. Its layout, not just its colour, varies with `hue`, so two
 * fakes do not look like near copies to the duplicate check.
 */
export async function placeholderImage(width: number, height: number, hue: number, label: string): Promise<Buffer> {
  const h = Math.round(hue) % 360;
  const colour = `hsl(${h}, 45%, 55%)`;
  const cx = width * (0.2 + ((h * 7) % 60) / 100);
  const cy = height * (0.25 + ((h * 13) % 50) / 100);
  const r = Math.min(width, height) * (0.12 + ((h * 3) % 20) / 100);
  const rx = width * (((h * 11) % 70) / 100);
  const ry = height * (((h * 17) % 70) / 100);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${colour}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" fill-opacity="0.55"/>
    <rect x="${rx}" y="${ry}" width="${width * 0.3}" height="${height * 0.25}" fill="black" fill-opacity="0.45"/>
    <title>${label.replace(/[<&>]/g, '')}</title>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
