import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertOrUpdatePin,
  digestContent,
  loadLock,
} from './ingest/upstream-lock.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fail(message) {
  console.error(`verify-upstream-pin: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`verify-upstream-pin: ${message}`);
}

const lock = loadLock();
const ollEntry = lock.sources.oll2Look;
if (!ollEntry) {
  fail('expected oll2Look entry in lockfile');
}

const matchingContent = 'pin-check-content';
const tamperedLockPath = path.join(__dirname, '.upstream.lock.test.json');
const tamperedLock = structuredClone(lock);
tamperedLock.sources.oll2Look = {
  ...ollEntry,
  sha256: digestContent('stale-upstream-body'),
};

try {
  fs.writeFileSync(tamperedLockPath, JSON.stringify(tamperedLock, null, 2) + '\n', 'utf-8');
  assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, loadLock(tamperedLockPath), false);
  fail('expected digest mismatch to throw');
} catch (err) {
  if (!String(err.message).includes('no longer matches the pinned digest')) {
    fail(`unexpected mismatch error: ${err.message}`);
  }
  pass('digest mismatch fails loudly');
} finally {
  fs.rmSync(tamperedLockPath, { force: true });
}

try {
  assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, structuredClone(tamperedLock), true);
  pass('--update-pin path records new digest without throwing');
} catch (err) {
  fail(`update-pin path should not throw: ${err.message}`);
}

try {
  const pinnedDigest = digestContent(matchingContent);
  const matchingLock = structuredClone(lock);
  matchingLock.sources.oll2Look = { ...ollEntry, sha256: pinnedDigest };
  assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, matchingLock, false);
  pass('matching digest passes verification');
} catch (err) {
  fail(`matching digest should pass: ${err.message}`);
}

console.log('verify-upstream-pin: all checks passed');
