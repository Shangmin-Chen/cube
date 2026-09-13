import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertOrUpdatePin,
  createEmptyLock,
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

const updateLock = structuredClone(tamperedLock);
try {
  assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, updateLock, true);
  const recorded = updateLock.sources.oll2Look;
  if (!recorded) {
    fail('update-pin path did not record a lock entry');
  }
  if (recorded.sha256 !== digestContent(matchingContent)) {
    fail(`update-pin recorded wrong digest: ${recorded.sha256}`);
  }
  if (recorded.url !== ollEntry.url) {
    fail(`update-pin recorded wrong url: ${recorded.url}`);
  }
  pass('--update-pin path records digestContent(content)');
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

const missingLockPath = path.join(__dirname, '.upstream.lock.missing.json');
try {
  fs.rmSync(missingLockPath, { force: true });
  try {
    loadLock(missingLockPath);
    fail('expected missing lockfile to throw without bootstrap');
  } catch (err) {
    if (!String(err.message).includes('Upstream lockfile missing')) {
      fail(`unexpected missing-lock error: ${err.message}`);
    }
    pass('missing lockfile fails without bootstrap');
  }

  const bootstrapped = loadLock(missingLockPath, { bootstrap: true });
  if (!bootstrapped.sources || Object.keys(bootstrapped.sources).length !== 0) {
    fail('bootstrap should return an empty lock');
  }
  if (bootstrapped.version !== 1) {
    fail(`bootstrap lock should have version 1, got ${bootstrapped.version}`);
  }
  pass('missing lockfile bootstraps empty lock with bootstrap=true');

  const emptyLock = createEmptyLock();
  assertOrUpdatePin('oll2Look', ollEntry.url, matchingContent, emptyLock, true);
  if (emptyLock.sources.oll2Look?.sha256 !== digestContent(matchingContent)) {
    fail('bootstrap lock did not record digest after update-pin');
  }
  pass('bootstrap lock accepts update-pin entries offline');
} finally {
  fs.rmSync(missingLockPath, { force: true });
}

console.log('verify-upstream-pin: all checks passed');
