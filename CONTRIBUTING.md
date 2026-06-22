# Contributing to hackathon-radar

## Dev setup

```bash
git clone https://github.com/aks-builds/hackathon-radar.git
cd hackathon-radar
npm install
npm test
```

Requires Node.js ≥ 18.

## Running tests

```bash
npm test             # run once
npm run test:watch   # re-run on file change
```

All 8 test files must pass before opening a PR.

## TDD flow

1. Write the failing test first
2. Run it — verify it fails with the expected message
3. Write the minimal implementation to make it pass
4. Run the full suite — verify no regressions
5. Commit

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add --location flag
fix: normalise trailing slash in URL deduplication
test: add corpus recall test for PARTIAL classifier
chore: update vitest to 2.1.0
docs: add --department to README usage table
```

Types: `feat`, `fix`, `test`, `chore`, `docs`, `refactor`

## Branching

- `main` is the protected default branch
- Open PRs against `main`
- CI must be green before merge

## Releasing

Releases are managed by maintainers only via the `Release` workflow (`workflow_dispatch` on GitHub Actions). Do not bump `package.json` versions manually.
