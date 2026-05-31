import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HardwareGenerator } from './HardwareGenerator.ts';
import { HardwareRuleValidator } from '../validator/hardware/HardwareRuleValidator.ts';

const databaseVersion = 'db-v1';
const ruleVersion = 'phase-4.3-hardware-generator';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

const [cpuDb, gpuDb, ramDb, compatibilityDb] = await Promise.all([
  readJson('database/hardware/cpu.json'),
  readJson('database/hardware/gpu.json'),
  readJson('database/hardware/ram.json'),
  readJson('database/hardware/hardware-compatibility.json'),
]);

const osRecords = [
  {
    osName: 'windows',
    version: 'mvp',
    build: 'mvp',
    architecture: 'x64',
    source: 'database/os/windows.json',
    confidence: 'medium',
    weight: 1,
    ruleVersion,
    databaseVersion,
  },
];

const data = {
  cpus: cpuDb.records,
  gpus: gpuDb.records,
  ram: ramDb.records,
  compatibility: compatibilityDb.records,
  os: osRecords,
};

const generator = new HardwareGenerator(data);
const baseInput = {
  seed: 'hardware-seed',
  ruleVersion,
  databaseVersion,
};

const first = generator.generate(baseInput);
const second = generator.generate(baseInput);
assert.equal(first.ok, true);
assert.deepEqual(first.hardware, second.hardware, 'same seed produces same hardware');

let alternate = generator.generate({ ...baseInput, seed: 'hardware-seed-2' });
assert.equal(alternate.ok, true);
if (
  first.hardware.cpu.id === alternate.hardware.cpu.id
  && first.hardware.gpu.id === alternate.hardware.gpu.id
  && first.hardware.ram.id === alternate.hardware.ram.id
) {
  alternate = generator.generate({ ...baseInput, seed: 'hardware-seed-3' });
}
assert.notDeepEqual(
  {
    cpu: first.hardware.cpu.id,
    gpu: first.hardware.gpu.id,
    ram: first.hardware.ram.id,
  },
  {
    cpu: alternate.hardware.cpu.id,
    gpu: alternate.hardware.gpu.id,
    ram: alternate.hardware.ram.id,
  },
  'different seed may produce different hardware',
);

const lowCpuExtremeGpu = generator.generate({
  ...baseInput,
  seed: 'forced-incompatible',
  constraints: {
    cpuTier: 'low',
    gpuTier: 'extreme',
  },
  maxAttempts: 5,
});
assert.equal(lowCpuExtremeGpu.ok, false, 'low CPU must not pair with extreme GPU');
assert.match(lowCpuExtremeGpu.errors[0].reason, /not compatible|No compatible/);

const lowCpuOnly = generator.generate({
  ...baseInput,
  seed: 'low-cpu-only',
  constraints: {
    cpuTier: 'low',
  },
});
assert.equal(lowCpuOnly.ok, true);
assert.notEqual(lowCpuOnly.hardware.gpu.tier, 'extreme', 'low CPU generated result should not use extreme GPU');

const validator = new HardwareRuleValidator();
const validation = validator.validateCombination(data, {
  cpuTier: first.hardware.cpu.tier,
  gpuTier: first.hardware.gpu.tier,
  ramTier: first.hardware.ram.tier,
  osName: first.hardware.os.osName,
});
assert.equal(validation.passed, true, 'generated result must pass HardwareRuleValidator');

const missingRecords = new HardwareGenerator({
  ...data,
  cpus: [],
});
const missingResult = missingRecords.generate(baseInput);
assert.equal(missingResult.ok, false, 'missing hardware records should return explicit error');
assert.match(missingResult.errors[0].reason, /No cpu records/);

const source = await readFile('src/core/generator/HardwareGenerator.ts', 'utf8');
assert.equal(source.includes('Math.random'), false, 'HardwareGenerator must not use Math.random');

console.log('HardwareGenerator tests passed');
