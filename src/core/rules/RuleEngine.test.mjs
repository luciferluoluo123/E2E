import assert from 'node:assert/strict';
import { SeededRandom } from './SeededRandom.ts';
import { WeightEngine } from './WeightEngine.ts';
import { RuleSource } from './RuleSource.ts';
import { RuleEngine } from './RuleEngine.ts';

const first = new SeededRandom('same-seed');
const second = new SeededRandom('same-seed');
assert.deepEqual(
  [first.nextUint32(), first.nextUint32(), first.nextUint32()],
  [second.nextUint32(), second.nextUint32(), second.nextUint32()],
  'same seed produces same result',
);

const third = new SeededRandom('different-seed-a');
const fourth = new SeededRandom('different-seed-b');
assert.notDeepEqual(
  [third.nextUint32(), third.nextUint32(), third.nextUint32()],
  [fourth.nextUint32(), fourth.nextUint32(), fourth.nextUint32()],
  'different seed may produce different result',
);

const weighted = new WeightEngine(new SeededRandom('zero-weight-test'));
for (let index = 0; index < 20; index += 1) {
  const selected = weighted.pick([
    { item: 'zero', weight: 0 },
    { item: 'one', weight: 1 },
  ]);
  assert.equal(selected.item, 'one', 'weight=0 should not be selected');
}

assert.throws(
  () => new RuleSource([]).getFile('country'),
  /missing database collection/,
  'missing records should return a clear error',
);

assert.throws(
  () => new RuleEngine(new RuleSource([
    {
      databaseVersion: 'db-v1',
      ruleVersion: 'phase-3.5-rule-engine',
      collection: 'country',
      generatedBy: 'Importer',
      generatedAt: '2026-05-30T00:00:00.000Z',
      records: [],
    },
  ])).getCountries(),
  /no records/,
  'empty records should return a clear error',
);

console.log('Rule Engine tests passed');

