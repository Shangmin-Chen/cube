import vm from 'node:vm';

/**
 * Fetch and extract the algsetAlgs array from a remote endpoint URL.
 * Safely executes in an isolated Node vm context.
 *
 * @param {string} url - Remote endpoint URL (e.g. J Perm script)
 * @returns {Promise<Array<any>>} Raw algsetAlgs array
 */
export async function fetchAlgset(url) {
  console.log(`Fetching from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const code = await res.text();
  const context = { window: {}, document: {}, Math, Array, Object, String, Number };
  vm.createContext(context);
  vm.runInContext(code, context);

  if (!Array.isArray(context.algsetAlgs)) {
    throw new Error(`No algsetAlgs array found in ${url}`);
  }

  return context.algsetAlgs;
}
