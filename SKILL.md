---
name: hackathon-radar
description: >
  Find active hackathons worldwide. Returns an enriched list with eligibility
  badges (OPEN/GATED/PARTIAL/UNKNOWN) — use when asked to find hackathons,
  competitions, or coding events to join. Sources: DuckDuckGo search with
  Devpost API and MLH sitemap fallback. Each result includes name, prize,
  objective, join URL, and eligibility requirements.
---

## When to Use

Use this skill when the user asks any of:
- "find me a hackathon"
- "what hackathons are open right now"
- "show me open-to-all coding events"
- "any hackathons with no prerequisites"
- "what competitions can I join"
- "find hackathons accepting anyone"

## How to Invoke

Run: `hackathon-radar --json --quiet`

Parse the JSON array. Surface OPEN badge entries first. For GATED/PARTIAL entries, always show the `requirements` array so the user knows what the gate is.

## Output Schema

Each item in the returned array:
- `name`: string — hackathon name
- `url`: string — hackathon page URL
- `joinUrl`: string|null — direct registration link if found
- `daysLeft`: number|null — days until deadline
- `prize`: string|null — prize description
- `objective`: string|null — what participants should build
- `badge`: "OPEN"|"GATED"|"PARTIAL"|"UNKNOWN"
- `requirements`: string[] — extracted prerequisite signals (empty for OPEN)
- `eligibilityRaw`: string|null — raw eligibility text from page

## Example Response to User

"I found 4 active hackathons:

**Global AI Hackathon** — 5 days left · $50,000 · 🟢 Open to all
Register: https://globalai2026.devpost.com/register
Build AI tools for social good

**Web3 BuildFest** — 12 days left · $10,000 · 🔴 Gated
⚠ Requires: Age 18+, KYC verification"
