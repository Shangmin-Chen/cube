import ts from 'typescript';
import { assertOrUpdatePin } from './upstream-lock.mjs';

/**
 * Fetch raw response body from a remote endpoint URL.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchRaw(url) {
  console.log(`Fetching from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/**
 * Recursively convert a TypeScript AST literal expression into a plain JS value.
 * Non-literal expressions (identifiers, function calls, property access) return undefined.
 *
 * @param {import('typescript').Node} node
 * @returns {any}
 */
export function astToValue(node) {
  if (!node) return undefined;
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return node.text;
    case ts.SyntaxKind.NumericLiteral:
      return Number(node.text);
    case ts.SyntaxKind.TrueKeyword:
      return true;
    case ts.SyntaxKind.FalseKeyword:
      return false;
    case ts.SyntaxKind.NullKeyword:
      return null;
    case ts.SyntaxKind.PrefixUnaryExpression:
      if (node.operator === ts.SyntaxKind.MinusToken && node.operand.kind === ts.SyntaxKind.NumericLiteral) {
        return -Number(node.operand.text);
      }
      if (node.operator === ts.SyntaxKind.ExclamationToken && node.operand.kind === ts.SyntaxKind.NumericLiteral) {
        return !Number(node.operand.text);
      }
      return undefined;
    case ts.SyntaxKind.ArrayLiteralExpression:
      return node.elements.map(astToValue);
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const obj = {};
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.text || (ts.isIdentifier(prop.name) ? prop.name.text : undefined);
          if (key && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
            const val = astToValue(prop.initializer);
            if (val !== undefined) {
              obj[key] = val;
            }
          }
        }
      }
      return obj;
    }
    default:
      return undefined;
  }
}

/**
 * Extract the algsetAlgs array literal from JavaScript source code using TypeScript AST.
 *
 * @param {string} code - Full source code text
 * @returns {Array<any> | null}
 */
export function extractAlgsetAst(code) {
  const sf = ts.createSourceFile('upstream.js', code, ts.ScriptTarget.Latest, false);
  let result = null;

  function visit(node) {
    if (result) return;

    // Match: var algsetAlgs = [...] or const/let algsetAlgs = [...]
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'algsetAlgs' && node.initializer) {
      result = astToValue(node.initializer);
      return;
    }

    // Match: algsetAlgs = [...]
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      if (ts.isIdentifier(node.left) && node.left.text === 'algsetAlgs') {
        result = astToValue(node.right);
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return result;
}

/**
 * Validate extracted raw algset entries against an explicit schema.
 *
 * @param {Array<any>} algs
 * @param {string} url
 */
export function validateAlgsetSchema(algs, url) {
  if (!Array.isArray(algs) || algs.length === 0) {
    throw new Error(`Schema validation failed for ${url}: algsetAlgs must be a non-empty array`);
  }

  for (let i = 0; i < algs.length; i++) {
    const item = algs[i];
    if (!item || typeof item !== 'object') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item must be an object`);
    }
    if (typeof item.name !== 'string' && typeof item.name !== 'number') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.name must be string or number`);
    }
    if (!Array.isArray(item.alg) || !item.alg.every((a) => typeof a === 'string')) {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.alg must be an array of strings`);
    }
    if (item.group !== undefined && typeof item.group !== 'string') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.group must be a string`);
    }
    if (item.prob !== undefined && typeof item.prob !== 'number') {
      throw new Error(`Schema validation failed for ${url} at index ${i}: item.prob must be a number`);
    }
  }
}

/**
 * Extract and safely parse the algsetAlgs array from fetched script source text.
 * Uses the TypeScript compiler AST parser to extract data literals without executing code.
 *
 * @param {string} code
 * @param {string} url
 * @returns {Array<{ name: string | number, alg: string[], group?: string, prob?: number }>}
 */
export function parseAlgset(code, url) {
  const parsed = extractAlgsetAst(code);
  if (!parsed) {
    throw new Error(`No algsetAlgs array found in ${url}`);
  }

  validateAlgsetSchema(parsed, url);
  return parsed;
}

/**
 * Fetch and extract the algsetAlgs array from a remote endpoint URL.
 * Verifies response body against the shared upstream lock unless updatePin is set.
 *
 * @param {string} sourceKey - Stable key matching upstream.lock.json
 * @param {string} url - Remote endpoint URL (e.g. J Perm script)
 * @param {{ updatePin?: boolean, lock: { version: number, sources: Record<string, { url: string, sha256: string }> } }} options
 * @returns {Promise<Array<any>>} Raw algsetAlgs array
 */
export async function fetchAlgset(sourceKey, url, { lock, updatePin = false }) {
  const code = await fetchRaw(url);
  assertOrUpdatePin(sourceKey, url, code, lock, updatePin);
  return parseAlgset(code, url);
}
