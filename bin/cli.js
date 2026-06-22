#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { searchHackathons } from '../src/search.js';
import { filterRecords, deduplicateByUrl } from '../src/filter.js';
import { enrichRecord } from '../src/enrich.js';
import { readCache, writeCache, isCacheValid, diffResults } from '../src/cache.js';
import { renderLog, renderJson } from '../src/output.js';
import { validateFlags } from '../src/validate.js';
import { createProgress } from '../src/progress.js';

const OPTION_DEFS = {
  json:        { type: 'boolean', default: false },
  'open-only': { type: 'boolean', default: false },
  'min-days':  { type: 'string',  default: '3' },
  limit:       { type: 'string',  default: '20' },
  watch:       { type: 'string',  default: '' },
  'no-cache':  { type: 'boolean', default: false },
  quiet:       { type: 'boolean', default: false },
  version:     { type: 'boolean', default: false },
  location:    { type: 'string',  default: '' },
  department:  { type: 'string',  default: '' },
};

let flags;
try {
  ({ values: flags } = parseArgs({ options: OPTION_DEFS, strict: true }));
} catch (err) {
  const msg = err.message.split('. To specify')[0];
  process.stderr.write(msg + '\n');
  process.exit(2);
}

if (flags.version) {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

const validation = validateFlags(flags);
if (!validation.ok) {
  for (const msg of validation.errors) {
    process.stderr.write(msg + '\n');
  }
  process.exit(2);
}

const minDays = parseInt(flags['min-days'], 10);
const limit = parseInt(flags.limit, 10);
const location = flags.location || undefined;
const department = flags.department || undefined;

const progress = createProgress({
  quiet: flags.quiet,
  isTTY: !!(process.stderr.isTTY || process.stdout.isTTY),
});

function parseWatchInterval(str) {
  const match = str.match(/^(\d+)(m|h)$/);
  if (!match) return null;
  return parseInt(match[1]) * (match[2] === 'h' ? 3600000 : 60000);
}

const watchInterval = flags.watch ? parseWatchInterval(flags.watch) : null;

export async function runPipeline({ noCache = false } = {}) {
  const year = new Date().getFullYear();

  progress.update('checking sources…');

  if (!noCache) {
    const cached = await readCache();
    if (cached && isCacheValid(cached.fetchedAt)) {
      return filterRecords(cached.records, { minDays }).slice(0, limit);
    }
  }

  const queryDesc = [
    `hackathon ${year}`,
    location,
    department,
  ].filter(Boolean).join(' · ');
  progress.update(`searching duckduckgo · ${queryDesc}…`);

  const raw = await searchHackathons(year, { location, department });
  if (!raw.length) {
    const stale = await readCache();
    if (stale?.records?.length) {
      progress.clear();
      process.stderr.write('All sources failed — serving stale cache.\n');
      return filterRecords(stale.records, { minDays }).slice(0, limit);
    }
    return [];
  }

  const filtered = deduplicateByUrl(filterRecords(raw, { minDays }));
  const toEnrich = filtered.slice(0, limit);
  const enriched = [];
  for (let i = 0; i < toEnrich.length; i++) {
    progress.update(`enriching pages · ${i + 1}/${toEnrich.length}…`);
    enriched.push(await enrichRecord(toEnrich[i]));
  }

  await writeCache(enriched);
  return enriched;
}

async function once() {
  const records = await runPipeline({ noCache: flags['no-cache'] });

  progress.clear();

  if (!records.length) {
    process.stderr.write('No hackathons found matching your criteria.\n');
    process.exit(0);
  }

  const shown = flags['open-only'] ? records.filter(r => r.badge === 'OPEN') : records;

  if (!shown.length && flags['open-only']) {
    if (flags.json) process.stdout.write('[]\n');
    process.stderr.write('No open-to-all hackathons found in current results.\n');
    process.exit(0);
  }

  if (flags.json) {
    process.stdout.write(renderJson(shown) + '\n');
  } else {
    process.stdout.write(renderLog(shown, { quiet: flags.quiet }) + '\n');
  }
}

async function watch(intervalMs) {
  if (!flags.quiet) console.log(`hackathon-radar watching · polling every ${flags.watch} · Ctrl+C to stop\n`);
  let seenRecords = [];

  async function poll(isFirst) {
    const records = await runPipeline({ noCache: true });
    progress.clear();
    const toShow = flags['open-only'] ? records.filter(r => r.badge === 'OPEN') : records;

    if (isFirst && !toShow.length) {
      if (!flags.quiet) process.stderr.write('No results match current filters.\n');
    }

    if (isFirst) {
      process.stdout.write(renderLog(toShow, { quiet: flags.quiet }) + '\n');
      seenRecords = seenRecords.concat(toShow);
    } else {
      const newOnes = diffResults(toShow, seenRecords);
      if (newOnes.length) {
        console.log(`[${new Date().toISOString()}] ${newOnes.length} new found`);
        newOnes.forEach(r => {
          process.stdout.write(`NEW ✨\n${renderLog([r], { quiet: true })}\n`);
        });
        seenRecords = seenRecords.concat(newOnes);
      } else if (!flags.quiet) {
        console.log(`[${new Date().toISOString()}] polling · no new hackathons · next in ${flags.watch}`);
      }
    }
  }

  await poll(true);
  const timer = setInterval(() => poll(false), intervalMs);
  process.on('SIGINT', () => { clearInterval(timer); process.exit(0); });
}

try {
  if (watchInterval) {
    await watch(watchInterval);
  } else {
    await once();
  }
} catch (err) {
  progress.clear();
  process.stderr.write(`Something went wrong: ${err.message}\n`);
  process.exit(1);
}
