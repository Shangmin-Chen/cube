import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'src/data/generated');
const PKG_DATA_DIR = path.resolve(ROOT_DIR, 'packages/cfop-data/src/data');

async function main() {
  console.log('--- Starting CFOP Algorithm Dataset Sync Pipeline ---');
  console.log('Initializing cubing/puzzles 3x3x3 simulation...');
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();

  console.log('Loading datasets from @cube/cfop-data workspace package...');
  const files = ['oll-2look.json', 'pll-2look.json', 'oll-full.json', 'pll-full.json'];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const file of files) {
    const filePath = path.join(PKG_DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Validate each algorithm using cubing.js kpuzzle
    for (const item of data) {
      const algs = [item.primaryAlg, ...(item.alternativeAlgs || [])];
      for (const alg of algs) {
        kpuzzle.algToTransformation(new Alg(alg));
      }
    }

    // Sync to src/data/generated/ for backward compatibility
    fs.writeFileSync(path.join(OUTPUT_DIR, file), JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ Validated and synced ${file} (${data.length} cases)`);
  }

  console.log('--- Algorithm sync complete! All cases validated successfully. ---');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
