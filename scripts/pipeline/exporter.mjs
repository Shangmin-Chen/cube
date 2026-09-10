import fs from 'node:fs';
import path from 'node:path';

/**
 * Single responsibility: writes formatted JSON files into the specified directory.
 *
 * @param {Array<{ file: string, count: number, data: any }>} datasets
 * @param {string} outputDir
 */
export function exportDatasets(datasets, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const { file, count, data } of datasets) {
    const dest = path.join(outputDir, file);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✓ Emitted ${file} (${count} cases) -> ${dest}`);
  }
}
