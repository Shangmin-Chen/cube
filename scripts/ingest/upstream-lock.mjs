import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_LOCK_PATH = path.resolve(__dirname, 'upstream.lock.json');

/**
 * @param {string} content
 * @returns {string} Hex SHA-256 digest of upstream response body
 */
export function digestContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * @returns {{ version: number, sources: Record<string, { url: string, sha256: string }> }}
 */
export function createEmptyLock() {
  return { version: 1, sources: {} };
}

/**
 * @param {string} lockPath
 * @param {{ bootstrap?: boolean }} [options]
 * @returns {{ version: number, sources: Record<string, { url: string, sha256: string }> }}
 */
export function loadLock(lockPath = DEFAULT_LOCK_PATH, { bootstrap = false } = {}) {
  if (!fs.existsSync(lockPath)) {
    if (bootstrap) {
      return createEmptyLock();
    }

    throw new Error(
      `Upstream lockfile missing at ${lockPath}. Run \`npm run sync:algs -- --update-pin\` to create it.`,
    );
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  if (!lock?.sources || typeof lock.sources !== 'object') {
    throw new Error(`Invalid upstream lockfile at ${lockPath}: expected a "sources" object.`);
  }

  return lock;
}

/**
 * @param {string} sourceKey
 * @param {string} url
 * @param {string} content
 * @param {{ version: number, sources: Record<string, { url: string, sha256: string }> }} lock
 * @param {boolean} updatePin
 * @returns {void}
 */
export function assertOrUpdatePin(sourceKey, url, content, lock, updatePin) {
  const digest = digestContent(content);
  const pinned = lock.sources[sourceKey];

  if (updatePin) {
    lock.sources[sourceKey] = { url, sha256: digest };
    return;
  }

  if (!pinned) {
    throw new Error(
      `No upstream pin for "${sourceKey}" in lockfile. Run \`npm run sync:algs -- --update-pin\` to record the current upstream content.`,
    );
  }

  if (pinned.url !== url) {
    throw new Error(
      `Endpoint URL for "${sourceKey}" changed (${pinned.url} -> ${url}). Update scripts/sync-algorithms.mjs and refresh the pin with \`npm run sync:algs -- --update-pin\`.`,
    );
  }

  if (pinned.sha256 !== digest) {
    throw new Error(
      [
        `Upstream content for "${sourceKey}" no longer matches the pinned digest.`,
        `  pinned:   ${pinned.sha256}`,
        `  fetched:  ${digest}`,
        `  url:      ${url}`,
        '',
        'The lockfile prevents silent algorithm drift from jperm.net.',
        'To intentionally accept new upstream content, run:',
        '  npm run sync:algs -- --update-pin',
      ].join('\n'),
    );
  }
}

/**
 * @param {{ version: number, sources: Record<string, { url: string, sha256: string }> }} lock
 * @param {string} lockPath
 */
export function writeLock(lock, lockPath = DEFAULT_LOCK_PATH) {
  const payload = {
    version: lock.version ?? 1,
    sources: Object.fromEntries(
      Object.entries(lock.sources).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };

  fs.writeFileSync(lockPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
}
