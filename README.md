# hackathon-radar

Find active hackathons worldwide with eligibility badges — CLI and agent skill.

## Install

```bash
npm install -g hackathon-radar
```

## Usage

```bash
hackathon-radar                  # enriched log, all hackathons
hackathon-radar --open-only      # open-to-all only
hackathon-radar --json           # structured JSON (agent mode)
hackathon-radar --watch 1h       # poll every hour, show new only
hackathon-radar --min-days 7     # only hackathons with ≥7 days left
```

## Flags

| Flag | Default | Description |
|---|---|---|
| `--json` | off | Emit JSON array |
| `--open-only` | off | OPEN TO ALL results only |
| `--min-days <n>` | 3 | Minimum days remaining |
| `--limit <n>` | 20 | Max results |
| `--watch <interval>` | off | Poll mode (`30m`, `1h`) |
| `--no-cache` | off | Force fresh fetch |
| `--quiet` | off | Suppress status lines |
| `--version` | — | Print version and exit |
