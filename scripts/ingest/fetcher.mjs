import { assertOrUpdatePin } from './upstream-lock.mjs';

/**
 * Fetch raw response body from a remote endpoint URL.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchRaw(url) {
  console.log(`Fetching from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/**
 * Extract balanced array bracket substring following a prefix identifier.
 *
 * @param {string} code - Full source code text
 * @param {string} prefix - Identifier before array literal (e.g. "algsetAlgs")
 * @returns {string | null}
 */
export function extractBalancedArray(code, prefix) {
  const startIdx = code.indexOf(prefix);
  if (startIdx === -1) return null;
  const bracketStart = code.indexOf('[', startIdx + prefix.length);
  if (bracketStart === -1) return null;

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let isEscaped = false;

  for (let i = bracketStart; i < code.length; i++) {
    const ch = code[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (ch === '\\') {
      isEscaped = true;
      continue;
    }

    if (inString) {
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return code.slice(bracketStart, i + 1);
      }
    }
  }

  return null;
}

/**
 * Validate extracted raw algset entries against an explicit schema.
 *
 * @param {Array<any>} algs
 * @param {string} url
 */
export function validateAlgsetSchema(algs, url) {
  if (!Array.isArray(algs) || algs.length === 0) {
    throw new Error(`Schema validation failed for ${url}: algsetAlgs must be a non-empty array`);
  }

  for (let i = 0; i < algs.length; i++) {
    const item = algs[i];
    if (!item || typeof item !== 'object') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item must be an object`);
    }
    if (typeof item.name !== 'string' && typeof item.name !== 'number') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.name must be string or number`);
    }
    if (!Array.isArray(item.alg) || !item.alg.every((a) => typeof a === 'string')) {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.alg must be an array of strings`);
    }
    if (item.group !== undefined && typeof item.group !== 'string') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.group must be a string`);
    }
    if (item.prob !== undefined && typeof item.prob !== 'number') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.prob must be a number`);
    }
  }
}

/**
 * Extract and safely parse the algsetAlgs array from fetched script source text.
 * Does not execute code in any runtime or VM context.
 *
 * @param {string} code
 * @param {string} url
 * @returns {Array<{ name: string | number, alg: string[], group?: string, prob?: number }>}
 */
export function parseAlgset(code, url) {
  const arrStr = extractBalancedArray(code, 'algsetAlgs');
  if (!arrStr) {
    throw new Error(`No algsetAlgs array found in ${url}`);
  }

  // Convert JS object literal array into valid JSON:
  // 1. Replace identifier references such as pageDetails.* with null
  let jsonStr = arrStr.replace(/pageDetails(?:\.[a-zA-Z0-9_$]+)*/g, 'null');
  // 2. Replace JS boolean shortcuts !0 and !1
  jsonStr = jsonStr.replace(/!0/g, 'true').replace(/!1/g, 'false');
  // 3. Quote unquoted property names: name:, alg:, group:, prob:, etc.
  jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
  // 4. Remove trailing commas before closing braces/brackets
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse algsetAlgs from ${url}: ${err.message}`);
  }

  validateAlgsetSchema(parsed, url);
  return parsed;
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
