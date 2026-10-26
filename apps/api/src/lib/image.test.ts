import { describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { cropToAspect, dHash, hammingDistance, imageInfo, isBlank, placeholderImage, toJpeg } from './image';

describe('image helpers', () => {
  test('crops to 16:9 when off, leaves it when close', async () => {
    const square = await placeholderImage(1000, 1000, 10, 'a');
    const cropped = await imageInfo(await cropToAspect(square, 16 / 9));
    expect(cropped.width).toBe(1000);
    expect(cropped.height).toBe(563);
    const wide = await placeholderImage(1600, 900, 10, 'b');
    expect(await cropToAspect(wide, 16 / 9)).toBe(wide);
  });

  test('flags a flat image as blank, not a real one', async () => {
    const flat = await sharp({ create: { width: 200, height: 100, channels: 3, background: '#ffffff' } }).png().toBuffer();
    expect(await isBlank(flat)).toBe(true);
    expect(await isBlank(await placeholderImage(400, 225, 200, 'x'))).toBe(false);
  });

  test('near-identical images have a small hash distance, different ones a large one', async () => {
    const a = await placeholderImage(400, 225, 10, 'a');
    const a2 = await sharp(a).resize(380, 214).png().toBuffer();
    const b = await sharp({ create: { width: 400, height: 225, channels: 3, background: '#000' } })
      .composite([{ input: Buffer.from('<svg width="400" height="225"><rect x="0" y="0" width="200" height="225" fill="white"/></svg>') }])
      .png()
      .toBuffer();
    expect(hammingDistance(await dHash(a), await dHash(a2))).toBeLessThan(8);
    expect(hammingDistance(await dHash(a), await dHash(b))).toBeGreaterThan(8);
  });

  test('jpeg output carries only the credit line as metadata', async () => {
    const jpg = await toJpeg(await placeholderImage(320, 180, 50, 'c'), { copyright: 'AI illustration: ET' });
    const meta = await sharp(jpg).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.exif?.toString('latin1')).toContain('AI illustration: ET');
  });
});
