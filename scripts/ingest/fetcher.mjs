import vm from 'node:vm';
import { assertOrUpdatePin } from './upstream-lock.mjs';

/**
 * Fetch raw response body from a remote endpoint URL.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchRaw(url) {
  console.log(`Fetching from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/**
 * Extract the algsetAlgs array from fetched script source.
 *
 * @param {string} code
 * @param {string} url
 * @returns {Array<any>}
 */
export function parseAlgset(code, url) {
  const context = { window: {}, document: {}, Math, Array, Object, String, Number };
  vm.createContext(context);
  vm.runInContext(code, context);

  if (!Array.isArray(context.algsetAlgs)) {
    throw new Error(`No algsetAlgs array found in ${url}`);
  }

  return context.algsetAlgs;
}

/**
 * Fetch and extract the algsetAlgs array from a remote endpoint URL.
 * Verifies response body against the shared upstream lock unless updatePin is set.
 *
 * @param {string} sourceKey - Stable key matching upstream.lock.json
 * @param {string} url - Remote endpoint URL (e.g. J Perm script)
 * @param {{ updatePin?: boolean, lock: { version: number, sources: Record<string, { url: string, sha256: string }> } }} options
 * @returns {Promise<Array<any>>} Raw algsetAlgs array
 */
export async function fetchAlgset(sourceKey, url, { lock, updatePin = false }) {
  const code = await fetchRaw(url);
  assertOrUpdatePin(sourceKey, url, code, lock, updatePin);
  return parseAlgset(code, url);
}
