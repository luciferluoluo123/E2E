import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HardwareRuleValidator } from './HardwareRuleValidator.ts';

const root = process.cwd();

const [cpuDb, gpuDb, ramDb, compatibilityDb] = await Promise.all([
  readJson('database/hardware/cpu.json'),
  readJson('database/hardware/gpu.json'),
  readJson('database/hardware/ram.json'),
  readJson('database/hardware/hardware-compatibility.json'),
]);

const ruleSet = {
  cpus: cpuDb.records,
  gpus: gpuDb.records,
  ram: ramDb.records,
  compatibility: compatibilityDb.records,
};

const validator = new HardwareRuleValidator();
const ruleSetResult = validator.validateRuleSet(ruleSet);
assert.equal(ruleSetResult.passed, true, 'MVP hardware rule set should pass validation');

assert.equal(
  validator.validateCombination(ruleSet, {
    cpuTier: 'low',
    gpuTier: 'extreme',
    ramTier: 'mid',
    osName: 'windows',
  }).passed,
  false,
  'low CPU + extreme GPU must fail',
);

assert.equal(
  validator.validateCombination(ruleSet, {
    cpuTier: 'mid',
    gpuTier: 'mid',
    ramTier: 'mid',
    osName: 'windows',
  }).passed,
  true,
  'mid CPU + mid GPU must pass',
);

assert.equal(
  validator.validateCombination(ruleSet, {
    cpuTier: 'high',
    gpuTier: 'high',
    ramTier: 'high',
    osName: 'windows',
  }).passed,
  true,
  'high CPU + high GPU must pass',
);

const zeroWeightRuleSet = {
  ...ruleSet,
  cpus: [{ ...ruleSet.cpus[0], weight: 0 }],
};
const zeroWeightResult = validator.validateRuleSet(zeroWeightRuleSet);
assert.equal(zeroWeightResult.passed, true, 'weight=0 hardware may exist as disabled data');
assert.equal(zeroWeightResult.warnings.length > 0, true, 'weight=0 hardware must not be default selectable');

const missingSourceResult = validator.validateRuleSet({
  ...ruleSet,
  cpus: [{ ...ruleSet.cpus[0], source: '' }],
});
assert.equal(missingSourceResult.passed, false, 'missing source must fail');

const missingConfidenceResult = validator.validateRuleSet({
  ...ruleSet,
  gpus: [{ ...ruleSet.gpus[0], confidence: '' }],
});
assert.equal(missingConfidenceResult.passed, false, 'missing confidence must fail');

console.log('HardwareRuleValidator tests passed');

async function readJson(filePath) {
  return JSON.parse(await readFile(join(root, filePath), 'utf8'));
}

