# Security Policy

## Reporting a vulnerability

Use [GitHub Private Advisories](https://github.com/aks-builds/hackathon-radar/security/advisories/new) to report security issues privately. Do not open public issues for security vulnerabilities.

## Scope

**In scope:** arbitrary command execution via flag values, path traversal via cache file location, data exfiltration from the local cache.

**Out of scope:** hackathon pages that serve malicious content (we fetch but do not execute scripts), rate limiting by third-party APIs, denial-of-service via `--watch` intervals.

## Design guarantees

- **HTTPS-only fetches** — the enrich step skips any URL that does not start with `https://`
- **No credentials** — no API keys, tokens, or secrets are stored or transmitted
- **Local-only cache** — results written to `~/.cache/hackathon-radar/results.json` only
- **No shell execution** — flag values are never passed to a shell
- **No eval** — no dynamic code execution anywhere in the pipeline
