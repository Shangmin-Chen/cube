import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertOrUpdatePin,
  createEmptyLock,
  digestContent,
  loadLock,
  DEFAULT_LOCK_PATH,
} from '../../scripts/ingest/upstream-lock.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('upstreamLock', () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    for (const f of tempFiles) {
      if (fs.existsSync(f)) {
        fs.rmSync(f, { force: true });
      }
    }
    tempFiles.length = 0;
  });

  it('default lockfile has oll2Look entry', () => {
    const lock = loadLock(DEFAULT_LOCK_PATH);
    expect(lock.sources.oll2Look).toBeDefined();
    expect(lock.sources.oll2Look.url).toBeTruthy();
    expect(lock.sources.oll2Look.sha256).toHaveLength(64);
  });

  it('digest mismatch throws an error', () => {
    const lock = loadLock(DEFAULT_LOCK_PATH);
    const ollEntry = lock.sources.oll2Look;
    const matchingContent = 'pin-check-content';

    const tamperedLockPath = path.join(__dirname, '.upstream.lock.test.json');
    tempFiles.push(tamperedLockPath);

    const tamperedLock = structuredClone(lock);
    tamperedLock.sources.oll2Look = {
      ...ollEntry,
      sha256: digestContent('stale-upstream-body'),
    };

    fs.writeFileSync(tamperedLockPath, JSON.stringify(tamperedLock, null, 2) + '\n', 'utf-8');

    expect(() => {
      assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, loadLock(tamperedLockPath), false);
    }).toThrow(/no longer matches the pinned digest/);
  });

  it('--update-pin records digestContent', () => {
    const lock = loadLock(DEFAULT_LOCK_PATH);
    const ollEntry = lock.sources.oll2Look;
    const matchingContent = 'pin-check-content';

    const updateLock = structuredClone(lock);
    assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, updateLock, true);

    const recorded = updateLock.sources.oll2Look;
    expect(recorded).toBeDefined();
    expect(recorded.sha256).toBe(digestContent(matchingContent));
    expect(recorded.url).toBe(ollEntry.url);
  });

  it('matching digest passes verification', () => {
    const lock = loadLock(DEFAULT_LOCK_PATH);
    const ollEntry = lock.sources.oll2Look;
    const matchingContent = 'pin-check-content';

    const pinnedDigest = digestContent(matchingContent);
    const matchingLock = structuredClone(lock);
    matchingLock.sources.oll2Look = { ...ollEntry, sha256: pinnedDigest };

    expect(() => {
      assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, matchingLock, false);
    }).not.toThrow();
  });

  it('missing lockfile fails without bootstrap and bootstraps with bootstrap=true', () => {
    const missingLockPath = path.join(__dirname, '.upstream.lock.missing.json');
    tempFiles.push(missingLockPath);

    expect(() => {
      loadLock(missingLockPath);
    }).toThrow(/Upstream lockfile missing/);

    const bootstrapped = loadLock(missingLockPath, { bootstrap: true });
    expect(bootstrapped.sources).toEqual({});
    expect(bootstrapped.version).toBe(1);

    const emptyLock = createEmptyLock();
    const matchingContent = 'pin-check-content';
    assertOrUpdatePin('oll2Look', 'https://example.com', matchingContent, emptyLock, true);
    expect(emptyLock.sources.oll2Look?.sha256).toBe(digestContent(matchingContent));
  });
});
