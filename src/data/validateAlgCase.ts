import type { AlgCase } from '../types/cube';

/**
 * Validates that an unknown JSON payload conforms to the AlgCase[] shape.
 * Throws a descriptive error on the first invalid entry so that corrupted
 * or structurally wrong generated JSON is caught at import time rather
 * than silently passing through an `as AlgCase[]` cast.
 */
export function validateAlgCases(data: unknown, label: string): AlgCase[] {
  if (!Array.isArray(data)) {
    throw new Error(`${label}: expected an array, got ${typeof data}`);
  }

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`${label}[${i}]: expected an object, got ${entry === null ? 'null' : typeof entry}`);
    }
    const obj = entry as Record<string, unknown>;

    // Required string fields
    const requiredStrings = ['id', 'name', 'category', 'subcategory', 'group', 'primaryAlg'] as const;
    for (const field of requiredStrings) {
      if (typeof obj[field] !== 'string' || obj[field] === '') {
        throw new Error(
          `${label}[${i}] (id=${String(obj['id'] ?? '?')}): required field "${field}" must be a non-empty string, got ${JSON.stringify(obj[field])}`
        );
      }
    }

    // Optional string fields
    const optionalStrings = ['probability', 'description', 'tips', 'why'] as const;
    for (const field of optionalStrings) {
      if (field in obj && obj[field] !== undefined && typeof obj[field] !== 'string') {
        throw new Error(
          `${label}[${i}] (id=${String(obj['id'])}): optional field "${field}" must be a string if present, got ${typeof obj[field]}`
        );
      }
    }

    // alternativeAlgs: optional string[]
    if ('alternativeAlgs' in obj && obj['alternativeAlgs'] !== undefined) {
      if (!Array.isArray(obj['alternativeAlgs'])) {
        throw new Error(
          `${label}[${i}] (id=${String(obj['id'])}): "alternativeAlgs" must be an array if present`
        );
      }
      for (let j = 0; j < (obj['alternativeAlgs'] as unknown[]).length; j++) {
        if (typeof (obj['alternativeAlgs'] as unknown[])[j] !== 'string') {
          throw new Error(
            `${label}[${i}] (id=${String(obj['id'])}): "alternativeAlgs[${j}]" must be a string`
          );
        }
      }
    }

    // is2Look: optional boolean
    if ('is2Look' in obj && obj['is2Look'] !== undefined && typeof obj['is2Look'] !== 'boolean') {
      throw new Error(
        `${label}[${i}] (id=${String(obj['id'])}): "is2Look" must be a boolean if present, got ${typeof obj['is2Look']}`
      );
    }
  }

  return data as AlgCase[];
}
