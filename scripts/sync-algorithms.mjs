import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { puzzles } from 'cubing/puzzles';
import { fetchAlgset } from './ingest/fetcher.mjs';
import {
  transform2LookOLL,
  transform2LookPLL,
  transformFullOLL,
  transformFullPLL,
} from './pipeline/transformers.mjs';
import { exportDatasets } from './pipeline/exporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'src/data/generated');

const ENDPOINTS = {
  oll2Look: 'https://jperm.net/lib/2lookoll.js',
  pll2Look: 'https://jperm.net/lib/2lookpll.js',
  ollFull: 'https://jperm.net/lib/oll.js',
  pllFull: 'https://jperm.net/lib/pll.js',
};

async function main() {
  console.log('--- Starting CFOP Algorithm Ingestion Pipeline ---');

  console.log('Initializing cubing/puzzles 3x3x3 simulation...');
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();

  console.log('Fetching raw datasets...');
  const [oll2LookRaw, pll2LookRaw, ollFullRaw, pllFullRaw] = await Promise.all([
    fetchAlgset(ENDPOINTS.oll2Look),
    fetchAlgset(ENDPOINTS.pll2Look),
    fetchAlgset(ENDPOINTS.ollFull),
    fetchAlgset(ENDPOINTS.pllFull),
  ]);

  console.log('Transforming and validating algorithms with rule-based pipeline...');
  const oll2LookCases = transform2LookOLL(oll2LookRaw, kpuzzle);
  const pll2LookCases = transform2LookPLL(pll2LookRaw, kpuzzle);
  const ollFullCases = transformFullOLL(ollFullRaw, kpuzzle);
  const pllFullCases = transformFullPLL(pllFullRaw, kpuzzle);

  if (oll2LookCases.length !== 10) throw new Error(`Expected 10 cases for 2-Look OLL, got ${oll2LookCases.length}`);
  if (pll2LookCases.length !== 6) throw new Error(`Expected 6 cases for 2-Look PLL, got ${pll2LookCases.length}`);
  if (ollFullCases.length !== 57) throw new Error(`Expected 57 cases for Full OLL, got ${ollFullCases.length}`);
  if (pllFullCases.length !== 21) throw new Error(`Expected 21 cases for Full PLL, got ${pllFullCases.length}`);

  exportDatasets([
    { file: 'oll-2look.json', count: oll2LookCases.length, data: oll2LookCases },
    { file: 'pll-2look.json', count: pll2LookCases.length, data: pll2LookCases },
    { file: 'oll-full.json', count: ollFullCases.length, data: ollFullCases },
    { file: 'pll-full.json', count: pllFullCases.length, data: pllFullCases },
  ], OUTPUT_DIR);

  console.log('--- Algorithm sync complete! All cases validated successfully. ---');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
