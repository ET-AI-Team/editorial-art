import { env } from '../lib/env';
import * as cloudinary from './cloudinary.client';
import { createFakeProviders } from './fake/fake-providers';
import * as gemini from './gemini.client';
import * as openai from './openai.client';
import type { Providers } from './types';

const real: Providers = {
  chatJson: openai.chatJson,
  embed: openai.embed,
  geminiImage: gemini.generateImage,
  openaiImageEdit: openai.imageEdit,
  upload: cloudinary.upload,
  destroy: cloudinary.destroy,
  async fetchImage(url, maxWidth) {
    // Only images in our own Cloudinary account, so nothing here can be pointed at the network.
    const prefix = `https://res.cloudinary.com/${env().CLOUDINARY_CLOUD_NAME}/`;
    if (!url.startsWith(prefix)) throw new Error('Only images stored by this service can be fetched.');
    return cloudinary.fetchImage(url, maxWidth);
  },
};

let current: Providers | undefined;

/** Real providers, or the fakes when EA_FAKE_PROVIDERS=true. Tests may swap them with setProviders. */
export function providers(): Providers {
  current ??= env().EA_FAKE_PROVIDERS ? createFakeProviders({ latencyMs: Number(process.env.EA_FAKE_LATENCY_MS ?? 0) }) : real;
  return current;
}

export function setProviders(p: Providers | undefined): void {
  current = p;
}

export * from './types';
