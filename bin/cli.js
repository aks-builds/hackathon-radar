#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { searchHackathons } from '../src/search.js';
import { filterRecords, deduplicateByUrl } from '../src/filter.js';
import { enrichRecord } from '../src/enrich.js';
import { readCache, writeCache, isCacheValid, diffResults } from '../src/cache.js';
import { renderLog, renderJson } from '../src/output.js';

const { values: flags } = parseArgs({
  options: {
    json:         { type: 'boolean', default: false },
    'open-only':  { type: 'boolean', default: false },
    'min-days':   { type: 'string',  default: '3' },
    limit:        { type: 'string',  default: '20' },
    watch:        { type: 'string',  default: '' },
    'no-cache':   { type: 'boolean', default: false },
    quiet:        { type: 'boolean', default: false },
    version:      { type: 'boolean', default: false },
  },
  strict: false,
});

if (flags.version) {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

const minDays = parseInt(flags['min-days'], 10) || 3;
const limit = parseInt(flags.limit, 10) || 20;
const watchInterval = flags.watch ? parseWatchInterval(flags.watch) : null;

function parseWatchInterval(str) {
  const match = str.match(/^(\d+)(m|h)$/);
  if (!match) return null;
  return parseInt(match[1]) * (match[2] === 'h' ? 3600000 : 60000);
}

export async function runPipeline({ noCache = false } = {}) {
  const year = new Date().getFullYear();

  // Cache check
  if (!noCache) {
    const cached = await readCache();
    if (cached && isCacheValid(cached.fetchedAt)) {
      return cached.records;
    }
  }

  // Search
  const raw = await searchHackathons(year);
  if (!raw.length) {
    // All live sources failed — serve stale cache as last resort
    const stale = await readCache();
    if (stale?.records?.length) {
      process.stderr.write('hackathon-radar: all sources failed — serving stale cache\n');
      return stale.records;
    }
    return [];
  }

  // Filter + dedup
  const filtered = deduplicateByUrl(filterRecords(raw, { minDays }));

  // Enrich (fetch pages sequentially with polite delay)
  const enriched = [];
  for (const record of filtered.slice(0, limit)) {
    enriched.push(await enrichRecord(record));
  }

  // Cache write
  await writeCache(enriched);
  return enriched;
}

async function once() {
  const records = await runPipeline({ noCache: flags['no-cache'] });

  if (!records.length) {
    console.error('hackathon-radar: no results found — all sources failed or returned 0 active hackathons');
    process.exit(1);
  }

  const shown = flags['open-only'] ? records.filter(r => r.badge === 'OPEN') : records;

  if (!shown.length && flags['open-only']) {
    process.stderr.write('hackathon-radar: no open-to-all hackathons found in current results\n');
    process.exit(0); // Not an error — just none that match the filter
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
    const toShow = flags['open-only'] ? records.filter(r => r.badge === 'OPEN') : records;

    if (isFirst && !toShow.length) {
      if (!flags.quiet) process.stderr.write('hackathon-radar: no results match current filters\n');
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

if (watchInterval) {
  await watch(watchInterval);
} else {
  await once();
}
