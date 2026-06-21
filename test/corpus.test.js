import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { classify } from '../src/classify.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/corpus.json'), 'utf8')
);

describe('classifier recall on fixture corpus', () => {
  it('achieves ≥90% accuracy on labelled corpus', () => {
    let correct = 0;
    const errors = [];

    for (const { text, badge } of corpus) {
      const result = classify(text);
      if (result.badge === badge) {
        correct++;
      } else {
        errors.push({ text, expected: badge, got: result.badge });
      }
    }

    const accuracy = correct / corpus.length;
    if (errors.length > 0) {
      console.log('Misclassified:', JSON.stringify(errors, null, 2));
    }

    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('classifies each entry deterministically', () => {
    for (const { text } of corpus) {
      const r1 = classify(text);
      const r2 = classify(text);
      expect(r1.badge).toBe(r2.badge);
    }
  });
});
