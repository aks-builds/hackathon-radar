<div align="center">

# hackathon-radar

**Find active hackathons worldwide — with eligibility badges**

[![CI](https://github.com/aks-builds/hackathon-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/aks-builds/hackathon-radar/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/hackathon-radar)](https://www.npmjs.com/package/hackathon-radar)
[![License: MIT](https://img.shields.io/npm/l/hackathon-radar)](LICENSE)

</div>

---

<!-- Terminal screenshots: capture after first publish using the terminal-screenshot skill -->

## Why

| Problem | How hackathon-radar solves it |
|---|---|
| Manually scanning for hackathons is slow | One command searches DuckDuckGo, Devpost, and MLH automatically |
| Can't tell at a glance if you're eligible | Every result is badged: 🟢 OPEN TO ALL · 🔴 GATED · 🟡 PARTIAL · ⚪ UNKNOWN |
| Results go stale fast | 1-hour local cache; `--no-cache` to force a fresh fetch |
| Hard to automate or pipe | `--json` emits structured output; `--quiet` suppresses status lines |
| Global search returns irrelevant regions | `--location Asia` or `--location India` scopes the DDG query |
| Too many results from unrelated fields | `--department fintech` or `--department "climate tech"` narrows the query |

## Install

```bash
npm install -g hackathon-radar
```

Requires Node.js ≥ 18.

## Usage

```bash
hackathon-radar                                        # all hackathons, enriched log
hackathon-radar --open-only                            # open-to-all only
hackathon-radar --location Asia                        # filter by region
hackathon-radar --location India --department fintech  # filter by country + field
hackathon-radar --json                                 # structured JSON output
hackathon-radar --json --quiet | jq '.[0]'             # pipe-friendly
hackathon-radar --watch 1h                             # poll every hour, show new only
hackathon-radar --no-cache                             # force fresh search
hackathon-radar --min-days 7 --limit 5                 # ≥7 days left, top 5
```

## Flags

| Flag | Default | Description |
|---|---|---|
| `--location <value>` | — | Region (`Asia`, `Europe`, `Americas`, `Africa`, `Oceania`, `Global`) or country (`India`, `Germany`, `USA`, …) |
| `--department <value>` | — | Domain keyword — any string (`fintech`, `climate tech`, `robotics`) |
| `--open-only` | off | Show OPEN TO ALL results only |
| `--min-days <n>` | `3` | Only show hackathons with ≥ n days remaining |
| `--limit <n>` | `20` | Maximum results to show |
| `--json` | off | Emit structured JSON array sorted OPEN → PARTIAL → GATED → UNKNOWN |
| `--watch <interval>` | — | Poll mode: `30m`, `1h` — shows only newly found hackathons on each poll |
| `--no-cache` | off | Skip the 1-hour cache and fetch fresh results |
| `--quiet` | off | Suppress status and header lines |
| `--version` | — | Print version and exit |

## Badge meanings

| Badge | Meaning |
|---|---|
| 🟢 OPEN TO ALL | No eligibility restrictions found on the hackathon page |
| 🔴 GATED | Hard restriction — students only, age 18+, KYC required, invite-only |
| 🟡 PARTIAL | Soft preference — team size limit, recommended experience level |
| ⚪ UNKNOWN | Page not fetched or no eligibility text found |

## Security

- **HTTPS-only page fetches** — HTTP URLs are skipped entirely, never fetched
- **No API keys** — uses public DuckDuckGo search, no credentials stored or sent
- **Polite fetching** — 500ms minimum delay between page requests
- **Local cache only** — results stored at `~/.cache/hackathon-radar/results.json`, never sent anywhere
- **Out of scope:** JavaScript-rendered pages, login-gated content

Report vulnerabilities via [GitHub Private Advisories](https://github.com/aks-builds/hackathon-radar/security/advisories/new).

## Repo layout

```
bin/cli.js           Entry point — flag parsing, validation, pipeline orchestration
src/validate.js      Flag validation — location list, range checks, combo checks
src/search.js        DDG search + Devpost API + MLH sitemap fallback chain
src/filter.js        Date filtering and URL deduplication
src/enrich.js        HTTPS page fetch + cheerio extraction
src/classify.js      Eligibility classifier — OPEN / GATED / PARTIAL / UNKNOWN
src/cache.js         JSON file cache — TTL, read, write, watch diff
src/output.js        Terminal log renderer and --json emitter
SKILL.md             Agent skill descriptor
```

## License

MIT © 2026 aks-builds
