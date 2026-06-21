# hackathon-radar — Claude Context

## Project

CLI npm package + agent skill (SKILL.md) that finds active hackathons worldwide via DuckDuckGo, enriches with eligibility metadata, classifies as OPEN/GATED/PARTIAL/UNKNOWN, caches 1h, outputs enriched log or `--json`.

**Why it exists:** Confirmed unique by 100-agent adversarial deep research (June 2026). No existing tool combines DDG search + eligibility classification + CLI + agent skill.

## Current state (v0.1.0)

- **Git:** 18 commits on `master`, no remote configured yet
- **Tests:** 63/63 passing, 8 test files
- **Source:** `src/classify.js`, `src/filter.js`, `src/cache.js`, `src/enrich.js`, `src/search.js`, `src/output.js`
- **Entry:** `bin/cli.js`
- **Flags:** `--json`, `--open-only`, `--min-days`, `--limit`, `--watch`, `--no-cache`, `--quiet`, `--version`

## Spec and plan files

- Spec: `C:\Users\AdityaKumarSingh\docs\superpowers\specs\2026-06-21-hackathon-radar-design.md`
- Plan: `C:\Users\AdityaKumarSingh\docs\superpowers\plans\2026-06-21-hackathon-radar.md`

---

## v2 — Brainstorm in progress (paused 2026-06-21)

### Scope agreed

1. **New flags:** `--location 'Asia'` and `--department 'IT'` filters
2. **Stability overhaul:** validation, exit codes, no crashes/freezes, proper message for every wrong input
3. **GitHub repo setup:** README (with CLI screenshots), CONTRIBUTING, SECURITY, CHANGELOG, SUPPORT, LICENSE, `.github/workflows/`, issue/PR templates, CODEOWNERS — following `C:\NashTech\ai-test-failure-analyzer` patterns
4. **Push to GitHub** (`aks-builds/hackathon-radar`) + npm publish

### Brainstorm decisions so far

**Q1 — Filtering strategy: A (pre-filter / query enrichment)**
Location and department baked into the DuckDuckGo search query directly.
- `hackathon 2026 Asia`
- `hackathon 2026 IT machine learning`
No client-side post-filter. Simple and fast.

**Q2 — Not yet answered.** Which location values should `--location` accept?
- **A:** Named regions only (strict): `Asia`, `Europe`, `Americas`, `Africa`, `Oceania`, `Global` — validation error if unknown
- **B:** Named regions + countries: `India`, `Germany`, `USA` also accepted
- **C:** Free-form pass-through — any string appended to DDG query, no validation

### Resume instructions

Start from Q2. Continue Q3 (department values), Q4 (stability/validation contract), Q5 (GitHub identity/secrets). Then: propose approaches → design → spec → `writing-plans` skill → subagent-driven-development with `model: sonnet`.

---

## Exit codes contract (v2 target)

| Code | Meaning |
|------|---------|
| 0 | Success — results found and printed |
| 1 | Operational error — all sources failed, no cache, network down |
| 2 | Usage/validation error — unknown flag, invalid `--location`, bad `--min-days`, etc. |

Never random or uncaught exits.

---

## Reference codebase for v2 patterns

`C:\NashTech\ai-test-failure-analyzer` — studied in full. Key things to replicate:

### Markdown files
- **README.md:** centered title + emoji tagline, badge row (CI/npm/license), terminal screenshot, why-table, install, usage, security guarantees, repo layout tree
- **CONTRIBUTING.md:** dev setup, `npm test`, TDD flow, Conventional Commits, releasing (maintainers only via workflow_dispatch)
- **SECURITY.md:** GitHub Private Advisories, scope, design guarantees, out-of-scope
- **CHANGELOG.md:** Keep a Changelog format — `## [Unreleased]` only; never pre-write versioned sections
- **SUPPORT.md:** Issues link + `its.aks@outlook.com`

### GitHub workflows (4 for this project)

#### ci.yml
- Triggers: push/PR to main or master
- Job: `test` — `npm test` (Node 20)
- Permissions: `contents:read`

#### release.yml (workflow_dispatch)
- Inputs: `bump` (patch|minor|major|prerelease), `preid` (alpha)
- Steps: checkout with `RELEASE_PR_PAT`, npm test, `npm version`, roll CHANGELOG, push `release/*` branch, open PR with auto-merge
- Required secrets: `RELEASE_PR_PAT`, `NPM_TOKEN`

#### publish.yml
- Trigger: PR closed + merged + head starts with `release/`
- Jobs: publish-npm (`--provenance`, `--tag latest|alpha`), github-release
- Permissions: `contents:write`, `id-token:write`
- Abort if git tag already exists
- `gh release create` with CHANGELOG notes, `--prerelease` if alpha

#### codeql.yml
- Triggers: push/PR to main, schedule Mon 5:30 UTC
- Language: `javascript`

### .github/ templates
- `ISSUE_TEMPLATE/bug_report.md` — labels: bug, assignees: aks-builds
- `ISSUE_TEMPLATE/feature_request.md` — labels: enhancement, assignees: aks-builds
- `PULL_REQUEST_TEMPLATE.md` — checklist: npm test, tests added, docs updated, Conventional Commits
- `CODEOWNERS` — `* @aks-builds`

### package.json additions needed
```json
{
  "bugs": { "url": "https://github.com/aks-builds/hackathon-radar/issues" },
  "author": "aks-builds",
  "publishConfig": { "access": "public" }
}
```

### Git identity for workflows
```
git config user.name "aks-builds"
git config user.email "its.aks@outlook.com"
```

### Required GitHub secrets
- `RELEASE_PR_PAT` — PAT with repo + workflow perms (to open release PRs that trigger CI)
- `NPM_TOKEN` — npm publish token

### npm publish pattern
```bash
npm publish --access public --tag ${disttag} --provenance
```

### CHANGELOG rolling pattern (in release.yml)
Replace `## [Unreleased]` with `## [Unreleased]\n\n## [VERSION] - DATE`

---

## Global constraints (carry forward from v1)

- ESM throughout (`"type": "module"`, all `import`/`export`)
- Node.js ≥18 only
- Exactly 3 runtime deps: `duck-duck-scrape`, `cheerio`, `chalk`
- Badge values exactly: `"OPEN"`, `"GATED"`, `"PARTIAL"`, `"UNKNOWN"`
- Source values exactly: `"ddg"`, `"devpost-api"`, `"mlh-sitemap"`
- HTTPS-only page fetches, 500ms delay between fetches
- Cache: `~/.cache/hackathon-radar/results.json`, 1h TTL, `HACKATHON_RADAR_CACHE_TTL_MS` env override
- Colour auto-disabled when `process.stdout.isTTY` is falsy
