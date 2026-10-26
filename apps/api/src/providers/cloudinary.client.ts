import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../lib/env';
import { mapAxiosError } from './http';
import type { ImageData, UploadResult } from './types';

let configured = false;
function configure() {
  if (configured) return;
  const c = env();
  cloudinary.config({ cloud_name: c.CLOUDINARY_CLOUD_NAME, api_key: c.CLOUDINARY_API_KEY, api_secret: c.CLOUDINARY_API_SECRET, secure: true });
  configured = true;
}

/**
 * Uploads through a base64 data URI rather than upload_stream: design-pipeline found upload_stream
 * mishandles streams under Bun.
 */
export async function upload(
  image: ImageData,
  opts: { folder: string; publicId: string; format: 'webp' | 'png' | 'jpg'; tags?: string[] }
): Promise<UploadResult> {
  configure();
  const uri = `data:${image.mimeType};base64,${image.buffer.toString('base64')}`;
  const res = await cloudinary.uploader.upload(uri, {
    folder: opts.folder,
    public_id: opts.publicId,
    format: opts.format,
    overwrite: true,
    resource_type: 'image',
    tags: ['editorial-art', ...(opts.tags ?? [])],
  });
  return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, bytes: res.bytes };
}

export async function destroy(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

/**
 * The same delivery-URL trick as AI Studio's lib/cloudinary-url.ts: insert a bounding transform so
 * a reference is downloaded at the size the model needs, not as the original.
 */
export function boundedUrl(url: string, maxWidth: number): string {
  const m = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/.exec(url);
  if (!m) return url;
  if (/^[a-z]+_[^/,]+(,[a-z]+_[^/,]+)*\//.test(m[2] ?? '')) return url;
  return `${m[1]}w_${maxWidth},c_limit,q_auto:good/${m[2]}`;
}

export async function fetchImage(url: string, maxWidth = 1024): Promise<ImageData> {
  if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) throw new Error('Only stored images can be fetched.');
  try {
    const res = await axios.get<ArrayBuffer>(boundedUrl(url, maxWidth), { responseType: 'arraybuffer', timeout: 30_000, maxContentLength: 20 * 1024 * 1024 });
    const mimeType = String(res.headers['content-type'] ?? 'image/png').split(';')[0] ?? 'image/png';
    return { buffer: Buffer.from(res.data), mimeType };
  } catch (error) {
    throw mapAxiosError(error, 'Cloudinary');
  }
}
