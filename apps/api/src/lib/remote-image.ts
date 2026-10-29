import axios from 'axios';
import sharp from 'sharp';
import { StageError } from './errors';

/**
 * Downloads an image from one of a few known public hosts (Wikimedia Commons, AI Studio's
 * Cloudinary), never from anywhere a caller names: the URL must start with an allowed prefix, the
 * body is capped, and the bytes must read as a JPG, PNG or WebP of a usable size.
 */

export type BinaryFetch = (url: string, opts: { timeoutMs: number; maxBytes: number; headers: Record<string, string> }) => Promise<Buffer>;

const axiosBinary: BinaryFetch = async (url, opts) => {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: opts.timeoutMs,
    maxContentLength: opts.maxBytes,
    maxRedirects: 0,
    headers: opts.headers,
  });
  return Buffer.from(res.data);
};

let fetcher: BinaryFetch = axiosBinary;

/** Tests only: answer downloads without the network. */
export function setBinaryFetchForTests(fn?: BinaryFetch): void {
  fetcher = fn ?? axiosBinary;
}

const FORMATS = new Set(['jpeg', 'png', 'webp']);
const MIN_SIDE = 64;

export class RemoteImageError extends StageError {
  constructor(message: string) {
    super('REMOTE_IMAGE_INVALID', message, false);
  }
}

export async function fetchRemoteImage(
  url: string,
  opts: { allow: readonly string[]; headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (!opts.allow.some((prefix) => url.startsWith(prefix))) throw new RemoteImageError('That image address is not one this service fetches from.');
  let buffer: Buffer;
  try {
    buffer = await fetcher(url, { timeoutMs: opts.timeoutMs ?? 10_000, maxBytes: opts.maxBytes ?? 15 * 1024 * 1024, headers: opts.headers ?? {} });
  } catch {
    throw new RemoteImageError('The image could not be downloaded.');
  }
  const meta = await sharp(buffer)
    .metadata()
    .catch(() => null);
  if (!meta?.format || !FORMATS.has(meta.format) || !meta.width || !meta.height) throw new RemoteImageError('The file is not a JPG, PNG or WebP image.');
  if (Math.min(meta.width, meta.height) < MIN_SIDE) throw new RemoteImageError('The image is too small to show a face.');
  return { buffer, width: meta.width, height: meta.height };
}
