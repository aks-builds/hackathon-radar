import { createInterface } from 'node:readline/promises';

export async function runWizard() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Step 0 — Internet check
  process.stdout.write('\n');
  try {
    await fetch('https://dns.google/resolve?name=google.com&type=A', {
      signal: AbortSignal.timeout(3000),
    });
    process.stdout.write('  ✓ Connected\n\n');
  } catch {
    process.stdout.write('  ⚠ No internet detected. Results may be stale.\n');
    const cont = await rl.question('  Continue? [Y/n]: ');
    if (cont.trim().toLowerCase() === 'n') {
      rl.close();
      process.exit(0);
    }
    process.stdout.write('\n');
  }

  // Step 1 — Platform
  process.stdout.write('? Search scope\n');
  process.stdout.write('  › 1  Entire web          (DuckDuckGo — broadest)\n');
  process.stdout.write('    2  Devpost only         (largest hackathon platform)\n');
  process.stdout.write('    3  MLH only             (student hackathons)\n');
  process.stdout.write('    4  GitHub topics        (open source events, max 10 results)\n');
  const platformInput = (await rl.question('Enter [1]: ')).trim();
  const platformMap = { '1': 'web', '2': 'devpost', '3': 'mlh', '4': 'github' };
  const platform = platformMap[platformInput] ?? 'web';
  process.stdout.write('\n');

  // Step 2 — Location
  process.stdout.write('? Location  (Enter = worldwide)\n');
  process.stdout.write('  › 1  Worldwide   2  Asia   3  Europe   4  Americas   5  Africa   6  Type name…\n');
  const locationInput = (await rl.question('Enter [1]: ')).trim();
  const locationMap = { '1': '', '2': 'Asia', '3': 'Europe', '4': 'Americas', '5': 'Africa' };
  let location = '';
  if (locationInput === '6') {
    location = (await rl.question('  Location name: ')).trim();
  } else {
    location = locationMap[locationInput] ?? '';
  }
  process.stdout.write('\n');

  // Step 3 — Domain (only for web)
  let department = '';
  if (platform === 'web') {
    process.stdout.write('? Topic filter  (Enter to skip)\n');
    department = (await rl.question('  e.g. fintech, AI, climate, gaming\n  Topic: ')).trim();
    process.stdout.write('\n');
  }

  // Step 4 — Count
  let limit = '5';
  if (platform === 'github') {
    process.stdout.write('? How many results?  (GitHub API · max 10)\n');
    process.stdout.write('  › 1  5\n    2  10\n');
    const countInput = (await rl.question('Enter [1]: ')).trim();
    limit = countInput === '2' ? '10' : '5';
  } else {
    process.stdout.write('? How many results?  (more = slower)\n');
    process.stdout.write('  › 1  5   (fast, ~5s)\n    2  10  (~10s)\n    3  20  (slow, ~30s)\n');
    const countInput = (await rl.question('Enter [1]: ')).trim();
    const countMap = { '1': '5', '2': '10', '3': '20' };
    limit = countMap[countInput] ?? '5';
  }
  process.stdout.write('\n');

  rl.close();
  return { location, department, limit, platform };
}
