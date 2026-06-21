import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CACHE_DIR = join(homedir(), '.cache', 'hackathon-radar');
const CACHE_FILE = join(CACHE_DIR, 'results.json');
const DEFAULT_TTL_MS = 3600000; // 1 hour

function getTTL() {
  const override = process.env.HACKATHON_RADAR_CACHE_TTL_MS;
  return override ? parseInt(override, 10) : DEFAULT_TTL_MS;
}

/**
 * @returns {Promise<{ records: object[], fetchedAt: string }|null>}
 */
export async function readCache() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {object[]} records
 * @returns {Promise<void>}
 */
export async function writeCache(records) {
  await mkdir(CACHE_DIR, { recursive: true });
  const payload = { records, fetchedAt: new Date().toISOString() };
  await writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

/**
 * @param {string} fetchedAt - ISO timestamp
 * @returns {boolean}
 */
export function isCacheValid(fetchedAt) {
  const age = Date.now() - Date.parse(fetchedAt);
  return age < getTTL();
}

/**
 * @param {object[]} newRecords
 * @param {object[]} cachedRecords
 * @returns {object[]} records in newRecords not present in cachedRecords by URL
 */
export function diffResults(newRecords, cachedRecords) {
  const cachedUrls = new Set(cachedRecords.map(r => r.url));
  return newRecords.filter(r => !cachedUrls.has(r.url));
}
