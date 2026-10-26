import axios, { type AxiosError } from 'axios';
import { ProviderTimeout, ProviderUnavailable } from './types';

/**
 * Maps transport failures to our error types. Provider error text is logged by the caller but
 * never reaches a client; only the status is kept.
 */
export function mapAxiosError(error: unknown, provider: string): Error {
  if (axios.isAxiosError(error)) {
    const e = error as AxiosError;
    if (e.code === 'ECONNABORTED' || e.code === 'ERR_CANCELED' || /timeout/i.test(e.message)) return new ProviderTimeout();
    const status = e.response?.status ?? null;
    return new ProviderUnavailable(status, `${provider} request failed${status ? ` (HTTP ${status})` : ''}`);
  }
  return error instanceof Error ? error : new Error(String(error));
}

/** A short, safe summary of a provider's error body for logs. */
export function errorSummary(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string; status?: string; code?: unknown } } | undefined;
    return `${error.response?.status ?? error.code ?? 'error'} ${data?.error?.status ?? ''} ${String(data?.error?.message ?? '').slice(0, 200)}`.trim();
  }
  return error instanceof Error ? error.message.slice(0, 200) : 'unknown';
}
