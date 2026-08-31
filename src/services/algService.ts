import { Alg } from 'cubing/alg';
import type { AlgCase } from '../types/cube';

// Dynamic Third-Party Algorithm Fetcher & Provider Service
// Fetches algorithm cases directly from standard third-party endpoints

const THIRD_PARTY_ENDPOINTS = {
  OLL_2LOOK: 'https://jperm.net/lib/2lookoll.js',
  PLL_2LOOK: 'https://jperm.net/lib/2lookpll.js',
};

// In-memory cache for fetched datasets
const cache: Record<string, AlgCase[]> = {};

// Safely convert JS object literal string into valid JSON without executing code (no eval / new Function)
function safeParseJsObjectArray<T>(jsArrayStr: string): T[] {
  try {
    const jsonString = jsArrayStr
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner: string) => `"${inner.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`)
      .replace(/,\s*([\}\]])/g, '$1');
    return JSON.parse(jsonString) as T[];
  } catch {
    return [];
  }
}

export async function fetchThirdPartyAlgData(type: 'oll' | 'pll'): Promise<AlgCase[]> {
  if (cache[type]) {
    return cache[type];
  }

  const endpoint = type === 'oll' ? THIRD_PARTY_ENDPOINTS.OLL_2LOOK : THIRD_PARTY_ENDPOINTS.PLL_2LOOK;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const scriptText = await res.text();

    // Safely extract the array assigned to algsetAlgs
    const match = scriptText.match(/algsetAlgs\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
    if (!match || !match[1]) {
      throw new Error('Failed to parse algsetAlgs from script');
    }

    const rawData = safeParseJsObjectArray<{
      name?: string;
      alg?: string[];
      group?: string;
      prob?: number;
    }>(match[1]);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Parsed rawData is empty or not an array');
    }

    const parsedCases: AlgCase[] = rawData.map((item, index) => {
      const algsList = Array.isArray(item.alg) ? item.alg : [];
      const primaryAlgStr = algsList[0] || '';
      let wcaAlgStr = primaryAlgStr;

      try {
        if (primaryAlgStr) {
          wcaAlgStr = new Alg(primaryAlgStr).toString();
        }
      } catch {
        wcaAlgStr = primaryAlgStr;
      }

      const caseName = item.name || `${type.toUpperCase()} Case ${index + 1}`;

      return {
        id: `${type}-2look-${index + 1}`,
        name: caseName,
        category: type,
        subcategory: `2-Look ${type.toUpperCase()}`,
        group: item.group || (type === 'oll' ? 'Corners (Look 2)' : 'Edges (Look 2)'),
        is2Look: true,
        primaryAlg: wcaAlgStr,
        alternativeAlgs: algsList.slice(1),
        description: `3x3 ${type.toUpperCase()} Case: ${caseName}`,
        tips: `Third-Party Source Alg: ${wcaAlgStr}`,
        why: `Calculated with WCA cubing/alg standard library`,
        probability: item.prob ? `1/${item.prob}` : undefined,
      };
    });

    cache[type] = parsedCases;
    return parsedCases;
  } catch (err) {
    console.warn(`Dynamic fetch from ${endpoint} failed, using local fallback.`, err);
    return [];
  }
}
